# INKLET STUDIOS — COMPLETE PROFESSIONAL WEB PLATFORM

> **“Ink with Intent.”**  
> Creative design and digital craft studio based in **Chuka, Tharaka Nithi County, Kenya**.

---

## 1. PROJECT OVERVIEW & ARCHITECTURAL MANDATE

Inklet Studios is a creative design and digital services studio built on the principle of purposeful craftsmanship: every typography hierarchy, ink mark, layout grid, and line of code exists to solve a real human and commercial objective.

### 1.1 Non-Negotiable Frontend File Independence
As mandated by the engineering specifications, **every frontend page in this platform is 100% architecturally independent**, possessing its own dedicated HTML, CSS, and JavaScript files:
- **No shared frontend stylesheets**: Each page's CSS file explicitly defines its own color tokens, CSS custom properties for dark and light modes, typography scales, layout grids, components, and responsive media queries.
- **No shared JavaScript files**: Each page's JS file is self-contained with its own event handlers, theme management, validation, and API fetch bridges.
- **Zero Frontend Frameworks**: Strictly built using standard HTML5, modern CSS3 (Grid & Flexbox), and Vanilla JavaScript (ES6+). No React, Vue, Angular, jQuery, Bootstrap, or Tailwind CSS.

### 1.2 Suite Inventory (25 Distinct Pages / 75 Independent Files)

| Category | Pages & Dedicated Trios (`.html`, `.css`, `.js`) |
| :--- | :--- |
| **Public Suite (11 Pages)** | `index`, `services`, `portfolio`, `project`, `booking`, `about`, `contact`, `classes`, `privacy`, `terms`, `404` |
| **Authentication Suite (4 Pages)** | `login`, `register`, `forgotpassword`, `resetpassword` |
| **Administrative Suite (10 Pages)** | `admindashboard`, `adminprojects`, `adminprojectform`, `adminservices`, `adminbookings`, `adminbookingdetail`, `adminmessages`, `adminclasses`, `admincontent`, `adminsettings` |

---

## 2. BRAND IDENTITY & COLOR SYSTEM

The visual identity is editorial, refined, contemporary, and grounded in creative craftsmanship.

| Token / Element | Dark Mode Surface | Light Mode Surface | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `#0B101B` / `#0F1624` | `#F8F5EF` (Warm Ivory) | Base surface canvas |
| **Elevated Surfaces** | `#111827` (Midnight Navy) | `#FFFFFF` (Pure White) | Card panels and table containers |
| **Brand Accent Gold** | `#D4AF69` (Champagne Gold) | `#B88F47` (Burnished Gold) | Focused highlights, badges, CTAs |
| **Primary Text** | `#F8F5EF` | `#1C2333` / `#111827` | High contrast editorial headings |
| **Secondary Text** | `#A0AEC0` | `#4A5568` | Body copy and descriptions |
| **Subtle Borders** | `#1E2B42` | `#E2DBD0` | Structural dividing lines |

### Theme Persistence
Theme selection (`dark` or `light`) is toggled via the sun/moon button in headers and saved in the browser under the `localStorage` key `'inklet_theme'`. Themes switch instantly across all 25 pages without flash-of-unstyled-content (FOUC).

---

## 3. CORE SERVICES & COMMERCIAL OFFERINGS

Inklet Studios provides 7 core disciplines managed directly via the admin portal:
1. **Posters, Banners, Flyers & Brochures** — High-impact editorial print and vector promo collateral.
2. **Brand Identity & Logo Design** — Strategic identity ecosystems, logomarks, typography, and guidelines.
3. **Business Cards & Product Mockups** — Foil-stamped stationery, tactile cards, and photorealistic 3D renders.
4. **Software & Web Development** — Accessible, lightweight, framework-free websites and custom admin backends.
5. **Video Editing & Motion Graphics** — 4K video editing, kinetic typography, lower thirds, and reels.
6. **Content & Social Media Design** — Curated monthly visual feeds, educational carousels, and templates.
7. **Graphic Design Classes & Training** — Intensive mentorship cohorts hosted in Chuka (In-Person and Hybrid).

---

## 4. BACKEND & DATABASE ARCHITECTURE

### 4.1 Technology Stack
- **Backend Language:** PHP 8.2+
- **Database Engine:** MySQL 8.0+ / MariaDB 10.5+
- **Data Access:** PHP Data Objects (PDO) with 100% prepared statements (`PDO::ATTR_EMULATE_PREPARES => false`)
- **Security:** CSRF token verification, BCRYPT password hashing (`PASSWORD_DEFAULT`), audit logging, input sanitization

### 4.2 Database Schema (15 Normalized Tables)
- `administrators` — Superadmin and editor credentials with failed login tracking.
- `project_categories` — 6 creative disciplines for portfolio taxonomy.
- `projects` — Portfolio case studies with client brief, direction, process, and verified outcomes.
- `project_images` — Multi-image project gallery with cover and sort order flags.
- `services` — Service catalog with turnaround times, starting KES prices, and deliverables.
- `bookings` — Project inquiries with unique reference codes (`INK-YYYYMM-XXXX`).
- `booking_history` — Audit trail for pipeline status transitions (`NEW` &rarr; `REVIEWING` &rarr; `ACCEPTED` &rarr; `COMPLETED` &rarr; `CANCELLED`).
- `booking_notes` — Confidential internal studio notes.
- `contact_messages` — Inbound contact portal messages with read/unread flags.
- `classes` — Training course syllabus records, tuition fees in KES, and enrollment status.
- `class_registrations` — Student cohort applications and attendance status.
- `site_settings` — Key-value registry for business phone lines, WhatsApp, email, town, and copy.
- `audit_logs` — Security audit logs recording IP, user agent, action, and target record.
- `password_resets` — SHA-256 hashed one-time tokens for credential recovery.

---

## 5. LOCAL RUNTIME & DEVELOPMENT TESTING

The project includes an integrated development server (`dev_server.py`) that serves the static frontend and simulates all REST endpoints in Python with in-memory persistence when local PHP/MySQL binaries are not present on the host system.

### Quick Start with Python Dev Server:
```bash
# Navigate to project root
cd "c:\Users\User\3D Objects\inklet"

# Start the development server
python dev_server.py
```
Open your browser to:
- **Public Homepage:** [http://localhost:8000/index.html](http://localhost:8000/index.html)
- **Portfolio Showcase:** [http://localhost:8000/portfolio.html](http://localhost:8000/portfolio.html)
- **Submit Project Brief:** [http://localhost:8000/booking.html](http://localhost:8000/booking.html)
- **Design Academy:** [http://localhost:8000/classes.html](http://localhost:8000/classes.html)
- **Admin Sign In:** [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **Admin Dashboard:** [http://localhost:8000/admindashboard.html](http://localhost:8000/admindashboard.html)

**Default Administrative Credentials:**
- **Email:** `admin@inkletstudios.com`
- **Password:** `AdminPassword2026!`

---

## 6. PRODUCTION DEPLOYMENT GUIDE (APACHE / PHP / MYSQL)

### 6.1 Database Setup
1. Create a database in MySQL:
   ```sql
   CREATE DATABASE inklet_studios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Run database migration via CLI or import:
   ```bash
   php database/migrate.php
   ```
   Or import via MySQL CLI / phpMyAdmin:
   ```bash
   mysql -u root -p inklet_studios < database/schema.sql
   mysql -u root -p inklet_studios < database/seed.sql
   ```

### 6.2 Configure Credentials
Edit `backend/config/database.php` or define environment variables:
```php
'host'    => getenv('DB_HOST') ?: '127.0.0.1',
'port'    => getenv('DB_PORT') ?: '3306',
'name'    => getenv('DB_NAME') ?: 'inklet_studios',
'user'    => getenv('DB_USER') ?: 'inklet_user',
'pass'    => getenv('DB_PASS') ?: 'YourSecurePasswordHere',
```

### 6.3 Web Server Setup (Apache)
- Set document root to the `public/` directory.
- Verify `mod_rewrite`, `mod_headers`, and `mod_deflate` are enabled.
- The included `public/.htaccess` automatically activates security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`), Gzip compression, and browser caching.
- Verify `public/robots.txt` and `public/sitemap.xml` are accessible at the domain root.

---

## 7. CODE INTEGRITY & COMPLIANCE VERIFICATION

- [x] **File Independence:** Every page has its own dedicated `.html`, `.css`, and `.js` files.
- [x] **Zero Inline Code:** No inline `<style>` tags, inline `style="..."` attributes, `<script>` application blocks, or inline `onclick="..."` listeners in production templates.
- [x] **Dark / Light Modes:** Seamless theme switching with persistent local storage.
- [x] **Honest Telemetry:** Real database metrics; zero fabricated testimonials or fake statistics.
- [x] **Transparent Communications:** Booking confirmations distinguish between database persistence and email dispatch.
- [x] **Direct Studio Contact:** One-click WhatsApp launcher (`https://wa.me/254700000000`) and verified Chuka, Kenya studio references.
