<?php
/**
 * INKLET STUDIOS — Projects & Portfolio API Endpoint
 * Handles public portfolio querying and administrative project management
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/logger.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = DB::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle single project lookup by slug or id
if ($method === 'GET' && (isset($_GET['slug']) || isset($_GET['id']))) {
    $slug = $_GET['slug'] ?? null;
    $id = $_GET['id'] ?? null;

    $query = "
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM projects p
        JOIN project_categories c ON p.category_id = c.id
        WHERE " . ($slug ? "p.slug = :param" : "p.id = :param");

    if (!Auth::checkAdmin()) {
        $query .= " AND p.is_published = 1";
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute(['param' => $slug ?: $id]);
    $project = $stmt->fetch();

    if (!$project) {
        Response::notFound('Project not found or is currently in draft status.');
    }

    // Fetch gallery images
    $imgStmt = $pdo->prepare("
        SELECT id, image_url, caption, alt_text, is_cover, sort_order
        FROM project_images
        WHERE project_id = :pid
        ORDER BY is_cover DESC, sort_order ASC, id ASC
    ");
    $imgStmt->execute(['pid' => $project['id']]);
    $project['gallery'] = $imgStmt->fetchAll();

    // Fetch related projects (same category or recent)
    $relStmt = $pdo->prepare("
        SELECT p.id, p.title, p.slug, p.cover_image, c.name AS category_name
        FROM projects p
        JOIN project_categories c ON p.category_id = c.id
        WHERE p.id != :pid AND p.is_published = 1 AND p.category_id = :cid
        ORDER BY p.sort_order ASC, p.id DESC
        LIMIT 3
    ");
    $relStmt->execute(['pid' => $project['id'], 'cid' => $project['category_id']]);
    $project['related_projects'] = $relStmt->fetchAll();

    Response::success($project);
}

// GET: Portfolio List (Public or Admin)
if ($method === 'GET') {
    $categorySlug = $_GET['category'] ?? null;
    $search = trim($_GET['search'] ?? '');
    $featuredOnly = !empty($_GET['featured']);
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 12)));
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if (!Auth::checkAdmin()) {
        $where[] = "p.is_published = 1";
    }

    if ($featuredOnly) {
        $where[] = "p.is_featured = 1";
    }

    if ($categorySlug && $categorySlug !== 'all') {
        $where[] = "c.slug = :category_slug";
        $params['category_slug'] = $categorySlug;
    }

    if ($search !== '') {
        $where[] = "(p.title LIKE :search OR p.overview LIKE :search OR p.tools_used LIKE :search)";
        $params['search'] = '%' . $search . '%';
    }

    $whereSql = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    // Count total
    $countStmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM projects p 
        JOIN project_categories c ON p.category_id = c.id 
        {$whereSql}
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['total'];

    // Fetch records
    $stmt = $pdo->prepare("
        SELECT p.id, p.title, p.slug, p.client_name, p.project_year, p.overview, 
               p.cover_image, p.is_featured, p.is_published, p.sort_order,
               c.name AS category_name, c.slug AS category_slug
        FROM projects p
        JOIN project_categories c ON p.category_id = c.id
        {$whereSql}
        ORDER BY p.is_featured DESC, p.sort_order ASC, p.id DESC
        LIMIT :limit OFFSET :offset
    ");

    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $projects = $stmt->fetchAll();

    // Fetch categories list for filters
    $catStmt = $pdo->query("SELECT id, name, slug, description FROM project_categories ORDER BY sort_order ASC, name ASC");
    $categories = $catStmt->fetchAll();

    Response::success($projects, 'Projects retrieved successfully', 200, [
        'pagination' => [
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => ceil($total / $limit)
        ],
        'categories' => $categories
    ]);
}

// POST: Create New Project (Admin)
if ($method === 'POST') {
    $admin = Auth::requireAdmin();
    $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $validator = new Validator($raw);
    $validator->required('title')->required('category_id')->required('overview')->required('cover_image');

    if (!$validator->isValid()) {
        Response::error('Please correct the validation errors.', 422, $validator->getErrors());
    }

    // Generate slug if omitted
    $slug = !empty($raw['slug']) 
        ? strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($raw['slug'])))
        : strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($raw['title'])));

    // Ensure slug uniqueness
    $check = $pdo->prepare("SELECT id FROM projects WHERE slug = :slug LIMIT 1");
    $check->execute(['slug' => $slug]);
    if ($check->fetch()) {
        $slug .= '-' . time();
    }

    $stmt = $pdo->prepare("
        INSERT INTO projects (
            category_id, title, slug, client_name, project_year, overview, 
            client_brief, creative_direction, design_process, tools_used, 
            deliverables, verified_outcomes, cover_image, is_featured, 
            is_published, sort_order, meta_title, meta_description
        ) VALUES (
            :category_id, :title, :slug, :client_name, :project_year, :overview,
            :client_brief, :creative_direction, :design_process, :tools_used,
            :deliverables, :verified_outcomes, :cover_image, :is_featured,
            :is_published, :sort_order, :meta_title, :meta_description
        )
    ");

    $stmt->execute([
        'category_id'        => (int)$raw['category_id'],
        'title'              => trim($raw['title']),
        'slug'               => $slug,
        'client_name'        => trim($raw['client_name'] ?? ''),
        'project_year'       => (int)($raw['project_year'] ?? date('Y')),
        'overview'           => trim($raw['overview']),
        'client_brief'       => trim($raw['client_brief'] ?? ''),
        'creative_direction' => trim($raw['creative_direction'] ?? ''),
        'design_process'     => trim($raw['design_process'] ?? ''),
        'tools_used'         => trim($raw['tools_used'] ?? ''),
        'deliverables'       => trim($raw['deliverables'] ?? ''),
        'verified_outcomes'  => trim($raw['verified_outcomes'] ?? ''),
        'cover_image'        => trim($raw['cover_image']),
        'is_featured'        => !empty($raw['is_featured']) ? 1 : 0,
        'is_published'       => isset($raw['is_published']) ? (int)$raw['is_published'] : 1,
        'sort_order'         => (int)($raw['sort_order'] ?? 0),
        'meta_title'         => trim($raw['meta_title'] ?? $raw['title']),
        'meta_description'   => trim($raw['meta_description'] ?? substr($raw['overview'], 0, 155))
    ]);

    $newId = (int)$pdo->lastInsertId();

    // Process gallery images if provided
    if (!empty($raw['gallery_images']) && is_array($raw['gallery_images'])) {
        $imgInsert = $pdo->prepare("
            INSERT INTO project_images (project_id, image_url, caption, alt_text, is_cover, sort_order)
            VALUES (:pid, :url, :caption, :alt, :is_cover, :sort)
        ");
        foreach ($raw['gallery_images'] as $idx => $img) {
            $imgInsert->execute([
                'pid'      => $newId,
                'url'      => $img['image_url'],
                'caption'  => $img['caption'] ?? '',
                'alt'      => $img['alt_text'] ?? $raw['title'],
                'is_cover' => $img['image_url'] === $raw['cover_image'] ? 1 : 0,
                'sort'     => $idx + 1
            ]);
        }
    }

    Logger::audit($admin['id'], 'CREATE_PROJECT', 'projects', $newId, ['title' => $raw['title']]);
    Response::success(['id' => $newId, 'slug' => $slug], 'Project created successfully', 201);
}

// PUT / PATCH: Update Project (Admin)
if ($method === 'PUT' || $method === 'PATCH') {
    $admin = Auth::requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        Response::error('Project ID is required', 400);
    }

    $raw = json_decode(file_get_contents('php://input'), true) ?? [];
    $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    if (!$stmt->fetch()) {
        Response::notFound('Project not found');
    }

    $fields = [];
    $params = ['id' => $id];

    $allowed = [
        'category_id', 'title', 'slug', 'client_name', 'project_year',
        'overview', 'client_brief', 'creative_direction', 'design_process',
        'tools_used', 'deliverables', 'verified_outcomes', 'cover_image',
        'is_featured', 'is_published', 'sort_order', 'meta_title', 'meta_description'
    ];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $raw)) {
            $fields[] = "`{$f}` = :{$f}";
            $params[$f] = $raw[$f];
        }
    }

    if (!empty($fields)) {
        $sql = "UPDATE projects SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";
        $updateStmt = $pdo->prepare($sql);
        $updateStmt->execute($params);
    }

    // Update gallery if supplied
    if (isset($raw['gallery_images']) && is_array($raw['gallery_images'])) {
        $pdo->prepare("DELETE FROM project_images WHERE project_id = :pid")->execute(['pid' => $id]);
        $imgInsert = $pdo->prepare("
            INSERT INTO project_images (project_id, image_url, caption, alt_text, is_cover, sort_order)
            VALUES (:pid, :url, :caption, :alt, :is_cover, :sort)
        ");
        foreach ($raw['gallery_images'] as $idx => $img) {
            $imgInsert->execute([
                'pid'      => $id,
                'url'      => $img['image_url'],
                'caption'  => $img['caption'] ?? '',
                'alt'      => $img['alt_text'] ?? $raw['title'] ?? 'Project image',
                'is_cover' => !empty($img['is_cover']) ? 1 : 0,
                'sort'     => $idx + 1
            ]);
        }
    }

    Logger::audit($admin['id'], 'UPDATE_PROJECT', 'projects', $id);
    Response::success(null, 'Project updated successfully');
}

// DELETE: Remove Project (Admin)
if ($method === 'DELETE') {
    $admin = Auth::requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        Response::error('Project ID is required', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM projects WHERE id = :id");
    $stmt->execute(['id' => $id]);

    Logger::audit($admin['id'], 'DELETE_PROJECT', 'projects', $id);
    Response::success(null, 'Project deleted successfully');
}

Response::error('Method not allowed', 405);
