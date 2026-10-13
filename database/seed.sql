-- =====================================================================
-- INKLET STUDIOS — SEED DATA
-- Notice: Contains clearly identified sample development data
-- =====================================================================

-- Default Administrator:
-- Email: admin@inkletstudios.com
-- Password: AdminPassword2026! (Bcrypt hashed)
INSERT INTO `administrators` (`id`, `name`, `email`, `password_hash`, `role`, `status`)
VALUES (
  1,
  'Inklet Studio Administrator',
  'admin@inkletstudios.com',
  '$2y$12$e0c0iA6yWqC9o2mIq4V6t.RzF0yvJ7kL2m8h9Q5jY9e7s9w6k4P5a', -- 'AdminPassword2026!'
  'superadmin',
  'active'
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Project Categories
INSERT INTO `project_categories` (`id`, `name`, `slug`, `description`, `sort_order`) VALUES
(1, 'Brand Identity & Logos', 'brand-identity', 'Holistic visual systems, bespoke wordmarks, typography rules, and collateral assets.', 1),
(2, 'Posters & Editorial Print', 'posters-print', 'Large-format event posters, editorial brochures, marketing flyers, and exhibition banners.', 2),
(3, 'Packaging & Mockups', 'packaging-mockups', 'Physical merchandise, premium business card finishes, and 3D product representations.', 3),
(4, 'Software & Web Development', 'software-web', 'Bespoke web applications, digital platforms, responsive business sites, and headless interfaces.', 4),
(5, 'Motion & Video Editing', 'motion-video', 'Kinetic typography, animated brand marks, commercial social reels, and promotional video cuts.', 5),
(6, 'Social Media & Content', 'social-content', 'High-conversion multi-channel campaign assets, carousel decks, and structured feed themes.', 6)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Services (The 7 Core Disciplines)
INSERT INTO `services` (`id`, `name`, `slug`, `summary`, `description`, `deliverables`, `intended_audience`, `process_overview`, `timeline_estimate`, `starting_price_kes`, `is_active`, `sort_order`) VALUES
(1, 'Posters, Banners, Flyers & Brochures', 'print-editorial-design',
 'Commanding print and digital promotional collateral crafted with editorial precision and visual impact.',
 'We design tangible and digital communications that demand attention and communicate complex information with effortless hierarchy. From grand outdoor banners across Tharaka Nithi to folded luxury brochures and cultural event posters, every piece is tuned for ink-on-paper reality and digital clarity.',
 '["Vector Print-Ready PDFs (CMYK with bleed)", "Web-Optimized RGB Files", "Source Asset Archives (AI/PSD)", "Paper & Stock Finishing Consultation", "Print House Hand-off Specifications"]',
 'Event organizers, cultural institutions, educational bodies, corporate conferences, and retail campaigns.',
 'Discovery brief -> Information architecture -> Typography & composition drafts -> Refinement -> Pre-flight print proofing.',
 '3 to 7 business days',
 4500, 1, 1),

(2, 'Brand Identity & Logo Design', 'brand-identity-design',
 'Strategic, memorable visual systems built from conceptual core to living guidelines.',
 'A brand is not merely a logo; it is an enduring covenant of intention. We craft complete identity ecosystems: bespoke logomarks, refined typographic hierarchies, curated colour palettes, and comprehensive brand guidelines that empower your team to build trust across every touchpoint.',
 '["Primary, Secondary & Sub-mark Vector Logos", "Comprehensive Brand Guidelines PDF (20+ pages)", "Curated Typography & Colour System", "Social Media Avatar & Banner Suites", "Vector Stationery & Favicon Package"]',
 'Entrepreneurs, startups, established enterprises undergoing rebrands, and premium hospitality ventures.',
 'Strategic brand audit -> Concept moodboards -> Vector mark iteration -> Collateral stress-testing -> Delivery & training.',
 '2 to 3 weeks',
 18000, 1, 2),

(3, 'Business Cards & Product Mockups', 'business-cards-mockups',
 'Tactile business stationery and photorealistic digital mockups that anchor your physical credibility.',
 'Make every hand-to-hand encounter unforgettable. We produce bespoke business card layouts tailored for foil stamping, embossing, spot UV, or tactile uncoated stocks, paired with ultra-crisp 3D product mockups that showcase your offerings before production begins.',
 '["Double-Sided Print-Ready Business Card Files", "Die-cut & Specialty Finish Layer Guides", "High-Resolution 3D Product Renders (PNG/JPEG)", "Photorealistic Brand Application Scenes"]',
 'Executives, consultants, artisan brands, e-commerce retailers, and physical product creators.',
 'Concept formulation -> Material selection guidance -> Visual mockup renders -> Final print-ready asset compilation.',
 '3 to 5 business days',
 3500, 1, 3),

(4, 'Software & Web Development', 'software-web-development',
 'Hand-crafted, performance-first web platforms and digital systems engineered for conversions.',
 'We reject bloated frameworks when clean, semantic engineering yields instant page loads, flawless search indexing, and resilient security. From custom marketing sites to bespoke client booking engines, we engineer digital homes that elevate your brand reputation.',
 '["Production-Ready Semantic Web Code (HTML5/CSS3/JS/PHP)", "Mobile-First Responsive Layouts", "MySQL Database Schema & Setup Scripts", "Technical SEO & Structured Schema Data", "Administrative Management Dashboard"]',
 'Businesses scaling their digital presence, boutique consultancies, creative agencies, and booking-driven operations.',
 'Wireframing & user journeys -> High-fidelity design mockup -> Semantic backend & frontend build -> Security & speed audit -> Deployment.',
 '2 to 5 weeks',
 35000, 1, 4),

(5, 'Video Editing & Motion Graphics', 'video-editing-motion',
 'Cinematic pacing, kinetic typography, and motion design that breathe life into static concepts.',
 'Attention is won in the first three seconds. We edit commercial video, craft dynamic kinetic typography reels, and animate brand identities into broadcast-grade motion assets tailored for social media storytelling and digital billboards.',
 '["4K/1080p Master Video Exports (MP4/ProRes)", "Vertical 9:16 & Square 1:1 Social Edits", "Kinetic Typography & Lower-Third Templates", "Sound Design & Licensed Audio Mastering", "Lottie/GIF Web Animation Assets"]',
 'Brands launching campaigns, content creators, keynote speakers, musicians, and corporate trainers.',
 'Footage review & assembly cut -> Motion graphics scripting -> Sound mixing & color grading -> Final export batches.',
 '4 to 10 business days',
 8000, 1, 5),

(6, 'Content & Social Media Design', 'social-media-content-design',
 'Cohesive, high-converting visual assets and carousel narratives that build community.',
 'Turn fragmented feeds into an intentional gallery. We develop monthly social media design templates, engaging educational carousels, promotional story templates, and campaign visuals that stop the scroll and reinforce your brand positioning.',
 '["Monthly Themed Graphic Assets (Feed & Stories)", "High-Engagement Educational Carousel Templates", "Fully Editable Canva or Figma Component Packs", "Story Highlight Covers & Profile Architecture"]',
 'E-commerce stores, coaches, community leaders, service providers, and local businesses in Kenya and beyond.',
 'Content pillar strategy -> Template design system -> Monthly asset production -> Review & scheduling support.',
 'Ongoing / 5 business days per batch',
 6000, 1, 6),

(7, 'Graphic Design Classes & Training', 'design-classes-training',
 'Hands-on, mentorship-driven design training in Chuka that bridges artistic instinct and industry execution.',
 'Learn the craft of "Ink with Intent." Our intensive training cohorts take students from beginner fundamentals to professional design software proficiency (Illustrator, Photoshop, InDesign, Web foundations), portfolio development, and client communication skills.',
 '["Live Studio Lectures & Hands-on Workshops", "Curated Project Briefs & Personalized Portfolio Reviews", "Complete Design Resource & Asset Library Access", "Certificate of Completion & Freelance Launch Guide"]',
 'Aspiring graphic designers, university students, small business owners, and marketing professionals.',
 'Structured weekly syllabus -> Practical daily briefs -> Peer critique sessions -> Capstone portfolio presentation.',
 '4 to 8 weeks per cohort',
 12000, 1, 7)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Clearly identified development sample projects
INSERT INTO `projects` (`id`, `category_id`, `title`, `slug`, `client_name`, `project_year`, `overview`, `client_brief`, `creative_direction`, `design_process`, `tools_used`, `deliverables`, `verified_outcomes`, `cover_image`, `is_featured`, `is_published`, `sort_order`, `meta_title`, `meta_description`) VALUES
(1, 1, 'Kipawa Coffee Roasters — Visual Identity', 'kipawa-coffee-roasters-identity', 'Kipawa Coffee Co. (Sample Project)', 2026,
 'A grounded, heritage-rich identity for a specialty highlands coffee brand rooted in Mount Kenya foothills.',
 'Develop a complete brand identity that honors smallholder farming heritage while appealing to international specialty coffee buyers and contemporary Nairobi cafes.',
 'Restrained earth tones, warm ivory paper stock, bespoke linework illustration of Mount Kenya contours, and timeless serif typography.',
 'Extensive research into Tharaka Nithi and Meru agricultural cooperatives, 40+ pencil thumbnails of coffee cherry geometry, custom type vectorization, packaging die-line testing.',
 'Adobe Illustrator, Adobe Photoshop, Figma',
 'Brand guidelines, primary mark, packaging labels, kraft paper bag stamping guides, and barista apparel specs.',
 'Sample project showcase: Demonstrates artisanal coffee packaging and heritage storytelling system.',
 'assets/projects/kipawa-cover.svg', 1, 1, 1,
 'Kipawa Coffee Roasters Identity — Inklet Studios',
 'Explore how Inklet Studios crafted a heritage-focused visual identity and packaging system for Kipawa Coffee Roasters.'),

(2, 2, 'Mount Kenya Creative Summit — Poster & Exhibition System', 'mt-kenya-creative-summit-poster', 'MKC Arts Collective (Sample Project)', 2026,
 'A striking visual campaign and editorial poster series for an annual creative gathering in Eastern Kenya.',
 'Create an unforgettable, high-contrast poster series that inspires young artists, digital creators, and cultural entrepreneurs to convene in Chuka.',
 'Dynamic typographic hierarchy, bold monochrome ink cuts paired with champagne gold accents, and architectural grid structures.',
 'Concept formulation around the intersection of traditional folklore and digital technology; typographic experimentation with oversized display ligatures.',
 'Adobe InDesign, Illustrator, Glyphs',
 'A1 outdoor event posters, street pole banners, speaker badges, and social media announcement carousels.',
 'Sample project showcase: Illustrates large-format editorial print and multi-touchpoint event signage.',
 'assets/projects/summit-cover.svg', 1, 1, 2,
 'Mount Kenya Creative Summit Poster Series — Inklet Studios',
 'An editorial poster campaign designed by Inklet Studios celebrating creative entrepreneurship in Eastern Kenya.'),

(3, 4, 'Boma Timber Crafts — E-Commerce & Workshop Platform', 'boma-timber-crafts-web', 'Boma Crafts Kenya (Sample Project)', 2025,
 'A lightweight, bespoke digital catalog and custom commission booking platform for artisanal woodworkers.',
 'Design and engineer a fast, clean website that allows custom furniture clients to configure materials, view workshop grain finishes, and request commission consultations.',
 'Editorial magazine aesthetic, warm neutral backgrounds, high-contrast typography, and frictionless multi-step booking forms.',
 'Client journey mapping, prototyping in HTML/CSS, database normalization for timber species and workshop availability, rigorous mobile performance tuning.',
 'HTML5, CSS3, Vanilla JS, PHP, MySQL',
 'Fully responsive custom website, commission quote calculator, administrator project portal, and automated client notifications.',
 'Sample project showcase: Highlights fast, framework-free web development with integrated client booking workflows.',
 'assets/projects/boma-cover.svg', 1, 1, 3,
 'Boma Timber Crafts Web Platform — Inklet Studios',
 'Case study: bespoke web development and client enquiry platform engineered for artisanal woodworking studio.'),

(4, 5, 'Echoes of the River — Film Titles & Kinetic Identity', 'echoes-of-the-river-motion', 'Nithi Documentaries (Sample Project)', 2025,
 'Kinetic typography and evocative visual title sequences for an environmental documentary series.',
 'Design animated opening credits and map cartography graphics explaining the Kathita and Tungu river conservation initiatives.',
 'Liquid organic motion combined with clinical topographic cartography and restrained gold and slate palettes.',
 'Storyboarding frames against original musical score, vector path animation in After Effects, color grading match with cinema footage.',
 'Adobe After Effects, Premiere Pro, Illustrator',
 'Cinema title sequence, chapter divider animations, interactive social teaser reels, and trailer title card.',
 'Sample project showcase: Demonstrates narrative motion graphics, sound synchronization, and documentary titling.',
 'assets/projects/echoes-cover.svg', 0, 1, 4,
 'Echoes of the River Kinetic Identity — Inklet Studios',
 'Cinematic title sequences and motion graphic packaging created for an Eastern Kenya environmental documentary.'),

(5, 3, 'Zenith Legal Advocates — Corporate Stationery & Mockups', 'zenith-legal-stationery', 'Zenith Advocates LLP (Sample Project)', 2026,
 'Refined tactile stationery, foil-embossed business cards, and digital pitch deck assets for an elite commercial law practice.',
 'Elevate client perception through minimalist, premium print finishes that communicate unwavering discretion, authority, and meticulous attention to detail.',
 'Deep midnight navy cardstock with champagne gold foil stamping, blind debossing, and ultra-crisp geometric layout.',
 'Selection of 600gsm cotton paper stock, micro-typography kerning adjustments, vector stamping layer isolation, and realistic 3D lighting scenes.',
 'Adobe Illustrator, Photoshop 3D Rendering',
 'Foil-stamped business card design, executive letterheads, legal brief covers, email signatures, and photorealistic 3D mockups.',
 'Sample project showcase: Exemplifies luxury print finishing, tactile print specifications, and corporate stationery design.',
 'assets/projects/zenith-cover.svg', 0, 1, 5,
 'Zenith Legal Advocates Stationery & Mockups — Inklet Studios',
 'Sophisticated stationery, tactile foil business cards, and 3D mockups for an esteemed legal advocacy practice.')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Project Images for the Sample Projects
INSERT INTO `project_images` (`project_id`, `image_url`, `caption`, `alt_text`, `is_cover`, `sort_order`) VALUES
(1, 'assets/projects/kipawa-cover.svg', 'Kipawa Coffee Roasters primary brand mark and packaging badge', 'Kipawa Coffee Roasters logo mark and kraft packaging', 1, 1),
(1, 'assets/projects/kipawa-detail-1.svg', 'Typography system and color palette breakdown', 'Kipawa Coffee typography hierarchy and earth color chips', 0, 2),
(1, 'assets/projects/kipawa-detail-2.svg', 'Bespoke contour illustrations of Mount Kenya foothills', 'Linework illustration of coffee growing topography', 0, 3),

(2, 'assets/projects/summit-cover.svg', 'Mount Kenya Creative Summit official exhibition poster', 'Large-format event poster for MKC Summit', 1, 1),
(2, 'assets/projects/summit-detail-1.svg', 'Event lanyard, badge system, and pocket programme schedule', 'Summit delegate pass and schedule layout', 0, 2),

(3, 'assets/projects/boma-cover.svg', 'Boma Timber Crafts responsive web platform interface', 'Clean web interface for artisanal wood furniture', 1, 1),
(3, 'assets/projects/boma-detail-1.svg', 'Commission customizer and multi-step enquiry wizard', 'Interactive commission booking form on desktop and mobile', 0, 2),

(4, 'assets/projects/echoes-cover.svg', 'Echoes of the River documentary motion title card', 'Kinetic typography title sequence frame', 1, 1),

(5, 'assets/projects/zenith-cover.svg', 'Zenith Legal Advocates tactile business card system', 'Midnight navy business cards with champagne gold foil deboss', 1, 1)
ON DUPLICATE KEY UPDATE `caption` = VALUES(`caption`);

-- Design Classes / Academy
INSERT INTO `classes` (`id`, `title`, `slug`, `level`, `duration_weeks`, `format`, `summary`, `description`, `learning_outcomes`, `syllabus_modules`, `schedule_notes`, `price_kes`, `is_enrolling`, `sort_order`) VALUES
(1, 'Design Foundations & Typography Mastery', 'design-foundations-typography', 'Beginner', 4, 'In-Person (Chuka)',
 'A disciplined immersion into visual hierarchy, grid systems, type pairings, and vector drawing fundamentals.',
 'Before touching complex software, an exceptional designer must understand how the human eye moves. This course strips away superficial tricks to teach the enduring laws of balance, contrast, negative space, and typographic intent.',
 '["Command fundamental principles of visual hierarchy and balance", "Master grid systems for print and digital surfaces", "Execute professional vector drawing in Adobe Illustrator", "Pair typefaces with deliberate psychological resonance", "Produce print-ready artwork with accurate color spaces"]',
 '["Week 1: The Anatomy of Visual Intent & Grid Geometry", "Week 2: Typographic Hierarchy, Kerning & Legibility", "Week 3: Vector Drawing & Path Precision in Illustrator", "Week 4: Layout Composition & First Professional Portfolio Piece"]',
 'Tuesdays & Thursdays, 5:30 PM - 7:30 PM EAT at Inklet Studios Chuka',
 9500, 1, 1),

(2, 'Brand Identity & Commercial Vector Systems', 'brand-identity-commercial-vector', 'Intermediate', 6, 'Hybrid',
 'Learn to research, develop, and present complete brand identity ecosystems that command professional fees.',
 'Transform from a graphic maker into a strategic brand designer. Learn client discovery interviews, moodboard curation, concept sketching, vector logo craft, collateral design, and delivering 30-page brand guidelines books.',
 '["Conduct thorough client discovery and creative direction synthesis", "Develop distinct, defensible logomarks from concept sketch to vector master", "Build comprehensive brand style guides and asset deliverables", "Design corporate stationery, social templates, and packaging mockups", "Present brand concepts with confidence to business decision-makers"]',
 '["Week 1: Strategic Discovery & Visual Moodboards", "Week 2: Logo Mark Conceptualization & Thumbnails", "Week 3: Vector Refinement & Grid Harmonization", "Week 4: Complete Color, Type & Collateral Systems", "Week 5: Authoring Commercial Brand Guidelines Books", "Week 6: Client Pitching, Contracts & Project Delivery"]',
 'Saturdays, 10:00 AM - 1:00 PM EAT (Studio + Live Stream)',
 14500, 1, 2),

(3, 'Web Design & Code for Creative Professionals', 'web-design-code-for-creatives', 'Comprehensive', 8, 'Hybrid',
 'Bridge the gap between visual artistry and clean, responsive web code without dependency on visual page builders.',
 'Empower your designs with actual web engineering. Learn to craft semantic HTML5, modern CSS3 layouts (Grid & Flexbox), responsive dark/light theme systems, and clean vanilla JavaScript that makes your client sites blindingly fast.',
 '["Translate Figma and Illustrator designs into pixel-perfect semantic code", "Master responsive CSS Grid, Flexbox, and CSS custom properties", "Implement dark and light theme architectures with local persistence", "Build accessible, interactive forms with client and server validation", "Deploy fast business websites with technical SEO and structured data"]',
 '["Weeks 1-2: Semantic HTML5 Structure & CSS Design Systems", "Weeks 3-4: Responsive Layouts, Media Queries & Typography", "Weeks 5-6: Vanilla JavaScript, DOM Interactions & Theme Toggles", "Weeks 7-8: Backend Integration (PHP/MySQL) & Production Deployment"]',
 'Mondays & Wednesdays, 6:00 PM - 8:00 PM EAT',
 22000, 1, 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Site Settings (Configurable business settings)
INSERT INTO `site_settings` (`setting_key`, `setting_value`, `setting_group`, `description`) VALUES
('business_name', 'Inklet Studios', 'general', 'Official registered business name'),
('tagline', 'Ink with Intent', 'general', 'Studio motto and creative philosophy'),
('location_town', 'Chuka', 'general', 'Primary studio physical town'),
('location_region', 'Tharaka Nithi County, Kenya', 'general', 'County and national jurisdiction'),
('phone_number', '+254 700 000 000', 'contact', 'Direct studio voice telephone line'),
('whatsapp_number', '+254700000000', 'contact', 'WhatsApp international format without spaces or symbols'),
('official_email', 'hello@inkletstudios.com', 'contact', 'Public enquiries email address'),
('admin_email', 'admin@inkletstudios.com', 'contact', 'Operational notifications email address'),
('social_instagram', 'https://instagram.com/inkletstudios', 'social', 'Official Instagram profile'),
('social_behance', 'https://behance.net/inkletstudios', 'social', 'Official Behance portfolio'),
('social_linkedin', 'https://linkedin.com/company/inkletstudios', 'social', 'Official LinkedIn company page'),
('social_x', 'https://x.com/inkletstudios', 'social', 'Official X profile'),
('meta_default_title', 'Inklet Studios — Ink with Intent | Creative Design & Web Studio in Chuka, Kenya', 'seo', 'Default browser title tag'),
('meta_default_description', 'Inklet Studios is a premier creative design and digital services studio in Chuka, Kenya. Posters, brand identity, web development, video editing, and design classes.', 'seo', 'Default search engine meta description'),
('theme_default', 'dark', 'appearance', 'Default theme when visitor preference is unknown (dark/light)'),
('booking_prefix', 'INK', 'booking', 'Unique booking reference prefix')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
