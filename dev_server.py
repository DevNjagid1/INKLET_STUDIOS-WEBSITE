#!/usr/bin/env python3
"""
INKLET STUDIOS — Development Server
Philosophy: "Ink with Intent"

Provides local HTTP serving for static files and provides API mock simulation
when native PHP runtime is not installed on the host operating system.
"""

import http.server
import socketserver
import os
import json
import urllib.parse
from datetime import datetime

PORT = 8000
WEB_ROOT = os.path.join(os.path.dirname(__file__), 'public')

# In-memory storage for development server testing
DEV_DB = {
    'bookings': [
        {
            'id': 1,
            'booking_ref': 'INK-202610-A101',
            'client_name': 'Grace Wanjiku',
            'client_email': 'grace@kenyaorigin.co.ke',
            'client_phone': '+254 712 345 678',
            'preferred_channel': 'whatsapp',
            'service_id': 2,
            'service_name': 'Brand Identity & Logo Design',
            'project_title': 'Agri-Export Brand System',
            'project_description': 'Complete identity, logo, and export packaging system for organic macadamia growers in Eastern Kenya.',
            'budget_range': 'KES 50,000 - 100,000',
            'deadline_date': '2026-11-30',
            'status': 'NEW',
            'client_notified': 1,
            'created_at': '2026-10-12 14:30:00',
            'history': [
                {'previous_status': None, 'new_status': 'NEW', 'notes': 'Submitted via web platform', 'created_at': '2026-10-12 14:30:00'}
            ],
            'notes': [
                {'admin_name': 'Inklet Administrator', 'note_content': 'Initial brief reviewed. Client macadamia cooperative is located in Embu/Meru region.', 'created_at': '2026-10-12 15:00:00'}
            ]
        }
    ],
    'messages': [
        {
            'id': 1,
            'name': 'David Mwenda',
            'email': 'dmwenda@chukaarts.org',
            'phone': '+254 722 998 877',
            'subject': 'Inquiry regarding Graphic Design Classes for youth cohort',
            'message': 'Hello Inklet team, we would like to sponsor 5 young creatives for your upcoming Design Foundations course in Chuka. Could you share full syllabus and group rates?',
            'is_read': 0,
            'status': 'unread',
            'created_at': '2026-10-13 08:15:00'
        }
    ],
    'projects': [
        {
            'id': 1,
            'title': 'Kipawa Coffee Roasters — Visual Identity',
            'slug': 'kipawa-coffee-roasters-identity',
            'category_id': 1,
            'category_name': 'Brand Identity & Logos',
            'category_slug': 'brand-identity',
            'client_name': 'Kipawa Coffee Co. (Sample Project)',
            'project_year': 2026,
            'overview': 'A grounded, heritage-rich identity for a specialty highlands coffee brand rooted in Mount Kenya foothills.',
            'client_brief': 'Develop a complete brand identity that honors smallholder farming heritage while appealing to international specialty coffee buyers and contemporary Nairobi cafes.',
            'creative_direction': 'Restrained earth tones, warm ivory paper stock, bespoke linework illustration of Mount Kenya contours, and timeless serif typography.',
            'design_process': 'Extensive research into Tharaka Nithi and Meru agricultural cooperatives, 40+ pencil thumbnails of coffee cherry geometry, custom type vectorization, packaging die-line testing.',
            'tools_used': 'Adobe Illustrator, Adobe Photoshop, Figma',
            'deliverables': 'Brand guidelines, primary mark, packaging labels, kraft paper bag stamping guides, and barista apparel specs.',
            'verified_outcomes': 'Sample project showcase: Demonstrates artisanal coffee packaging and heritage storytelling system.',
            'cover_image': 'assets/projects/kipawa-cover.svg',
            'is_featured': 1,
            'is_published': 1,
            'gallery': [
                {'id': 1, 'image_url': 'assets/projects/kipawa-cover.svg', 'caption': 'Primary brand mark and packaging emblem', 'alt_text': 'Kipawa Coffee mark'}
            ],
            'related_projects': [
                {'id': 2, 'title': 'Mount Kenya Creative Summit — Poster & Exhibition System', 'slug': 'mt-kenya-creative-summit-poster', 'cover_image': 'assets/projects/summit-cover.svg', 'category_name': 'Posters & Editorial Print'},
                {'id': 5, 'title': 'Zenith Legal Advocates — Corporate Stationery & Mockups', 'slug': 'zenith-legal-stationery', 'cover_image': 'assets/projects/zenith-cover.svg', 'category_name': 'Packaging & Mockups'}
            ]
        },
        {
            'id': 2,
            'title': 'Mount Kenya Creative Summit — Poster & Exhibition System',
            'slug': 'mt-kenya-creative-summit-poster',
            'category_id': 2,
            'category_name': 'Posters & Editorial Print',
            'category_slug': 'posters-print',
            'client_name': 'MKC Arts Collective (Sample Project)',
            'project_year': 2026,
            'overview': 'A striking visual campaign and editorial poster series for an annual creative gathering in Eastern Kenya.',
            'client_brief': 'Create an unforgettable, high-contrast poster series that inspires young artists, digital creators, and cultural entrepreneurs to convene in Chuka.',
            'creative_direction': 'Dynamic typographic hierarchy, bold monochrome ink cuts paired with champagne gold accents, and architectural grid structures.',
            'design_process': 'Concept formulation around the intersection of traditional folklore and digital technology; typographic experimentation with oversized display ligatures.',
            'tools_used': 'Adobe InDesign, Illustrator, Glyphs',
            'deliverables': 'A1 outdoor event posters, street pole banners, speaker badges, and social media announcement carousels.',
            'verified_outcomes': 'Sample project showcase: Illustrates large-format editorial print and multi-touchpoint event signage.',
            'cover_image': 'assets/projects/summit-cover.svg',
            'is_featured': 1,
            'is_published': 1,
            'gallery': [
                {'id': 2, 'image_url': 'assets/projects/summit-cover.svg', 'caption': 'Exhibition poster visual', 'alt_text': 'Summit Poster'}
            ],
            'related_projects': []
        },
        {
            'id': 3,
            'title': 'Boma Timber Crafts — E-Commerce & Workshop Platform',
            'slug': 'boma-timber-crafts-web',
            'category_id': 4,
            'category_name': 'Software & Web Development',
            'category_slug': 'software-web',
            'client_name': 'Boma Crafts Kenya (Sample Project)',
            'project_year': 2025,
            'overview': 'A lightweight, bespoke digital catalog and custom commission booking platform for artisanal woodworkers.',
            'client_brief': 'Design and code a fast, responsive, non-template website allowing architects and interior designers to commission custom indigenous hardwood furniture.',
            'creative_direction': 'Warm tactile textures, minimal layouts, generous whitespace, and instant mobile responsiveness with accessible contrast.',
            'design_process': 'Information architecture mapping, wireframing in Figma, handwritten semantic HTML5/CSS3, and vanilla JS filtering without external frameworks.',
            'tools_used': 'Figma, VS Code, Vanilla JS, CSS Grid, PHP, MySQL',
            'deliverables': 'Responsive website architecture, custom furniture commission brief builder, admin catalog manager, and SEO schema.',
            'verified_outcomes': 'Sample project showcase: Zero-dependency web architecture achieving 99 Lighthouse performance rating.',
            'cover_image': 'assets/projects/boma-cover.svg',
            'is_featured': 1,
            'is_published': 1,
            'gallery': [
                {'id': 3, 'image_url': 'assets/projects/boma-cover.svg', 'caption': 'Platform UI on desktop and mobile', 'alt_text': 'Boma Timber website preview'}
            ],
            'related_projects': []
        },
        {
            'id': 4,
            'title': 'Echoes of Tharaka — Cultural Heritage Documentary Motion Graphics',
            'slug': 'echoes-of-tharaka-motion',
            'category_id': 5,
            'category_name': 'Motion & Video Editing',
            'category_slug': 'motion-video',
            'client_name': 'Eastern Cultural Archive (Sample Project)',
            'project_year': 2025,
            'overview': 'Animated lower-thirds, title sequences, and kinetic typography for an indigenous oral history documentary.',
            'client_brief': 'Produce cinematic motion graphics that convey reverence for historical Tharaka folklore while feeling sharp and modern for broadcast.',
            'creative_direction': 'Textured charcoal backgrounds, fluid golden ink transitions, and subtle organic frame rates evoking film grain and tactile drawing.',
            'design_process': 'Storyboarding 12 key sequence transitions, sound-design syncing, kinetic vector path animation in After Effects, and 4K ProRes rendering.',
            'tools_used': 'Adobe After Effects, Premiere Pro, Illustrator',
            'deliverables': 'Title sequence animation, 18 documentary lower-third templates, animated chapter bumpers, and social media teaser cuts.',
            'verified_outcomes': 'Sample project showcase: Broadcast-ready motion package delivered on time.',
            'cover_image': 'assets/projects/echoes-cover.svg',
            'is_featured': 0,
            'is_published': 1,
            'gallery': [
                {'id': 4, 'image_url': 'assets/projects/echoes-cover.svg', 'caption': 'Main title sequence frame', 'alt_text': 'Echoes title card'}
            ],
            'related_projects': []
        },
        {
            'id': 5,
            'title': 'Zenith Legal Advocates — Corporate Stationery & Mockups',
            'slug': 'zenith-legal-stationery',
            'category_id': 3,
            'category_name': 'Packaging & Mockups',
            'category_slug': 'packaging-mockups',
            'client_name': 'Zenith Advocates LLP (Sample Project)',
            'project_year': 2026,
            'overview': 'Restrained, authoritative executive stationery suite featuring hot foil stamping and tactile paper specifications.',
            'client_brief': 'Design corporate collateral that projects legal acumen, discretion, and institutional prestige for an established law firm.',
            'creative_direction': 'Deep midnight navy, champagne gold foil accents, geometric law scales mark, and heavy cotton rag paper simulations.',
            'design_process': 'Precise typographic grid construction, CMYK + metallic spot colour separation, vector die-line authoring, and 3D mockup photorealistic rendering.',
            'tools_used': 'Adobe Illustrator, Photoshop 3D Rendering',
            'deliverables': 'Foil-stamped business card design, executive letterheads, legal brief covers, email signatures, and photorealistic 3D mockups.',
            'verified_outcomes': 'Sample project showcase: Exemplifies luxury print finishing, tactile print specifications, and corporate stationery design.',
            'cover_image': 'assets/projects/zenith-cover.svg',
            'is_featured': 0,
            'is_published': 1,
            'gallery': [
                {'id': 5, 'image_url': 'assets/projects/zenith-cover.svg', 'caption': 'Embossed business card', 'alt_text': 'Zenith business cards'}
            ],
            'related_projects': []
        }
    ],
    'services': [
        {
            'id': 1,
            'name': 'Posters, Banners, Flyers & Brochures',
            'slug': 'print-editorial-design',
            'summary': 'Commanding print and digital promotional collateral crafted with editorial precision and visual impact.',
            'description': 'We design tangible and digital communications that demand attention and communicate complex information with effortless hierarchy. From grand outdoor banners across Tharaka Nithi to folded luxury brochures and cultural event posters, every piece is tuned for ink-on-paper reality and digital clarity.',
            'deliverables': ['Vector Print-Ready PDFs (CMYK with bleed)', 'Web-Optimized RGB Files', 'Source Asset Archives (AI/PSD)', 'Paper & Stock Finishing Consultation', 'Print House Hand-off Specifications'],
            'intended_audience': 'Event organizers, cultural institutions, educational bodies, corporate conferences, and retail campaigns.',
            'process_overview': 'Discovery brief -> Information architecture -> Typography & composition drafts -> Refinement -> Pre-flight print proofing.',
            'timeline_estimate': '3 to 7 business days',
            'starting_price_kes': 4500,
            'is_active': 1
        },
        {
            'id': 2,
            'name': 'Brand Identity & Logo Design',
            'slug': 'brand-identity-design',
            'summary': 'Strategic, memorable visual systems built from conceptual core to living guidelines.',
            'description': 'A brand is not merely a logo; it is an enduring covenant of intention. We craft complete identity ecosystems: bespoke logomarks, refined typographic hierarchies, curated colour palettes, and comprehensive brand guidelines that empower your team to build trust across every touchpoint.',
            'deliverables': ['Primary, Secondary & Sub-mark Vector Logos', 'Comprehensive Brand Guidelines PDF (20+ pages)', 'Curated Typography & Colour System', 'Social Media Avatar & Banner Suites', 'Vector Stationery & Favicon Package'],
            'intended_audience': 'Entrepreneurs, startups, established enterprises undergoing rebrands, and premium hospitality ventures.',
            'process_overview': 'Strategic brand audit -> Concept moodboards -> Vector mark iteration -> Collateral stress-testing -> Delivery & training.',
            'timeline_estimate': '2 to 3 weeks',
            'starting_price_kes': 18000,
            'is_active': 1
        },
        {
            'id': 3,
            'name': 'Business Cards & Product Mockups',
            'slug': 'business-cards-mockups',
            'summary': 'Tactile business stationery and photorealistic digital mockups that anchor your physical credibility.',
            'description': 'Make every hand-to-hand encounter unforgettable. We produce bespoke business card layouts tailored for foil stamping, embossing, spot UV, or tactile uncoated stocks, paired with ultra-crisp 3D product mockups that showcase your offerings before production begins.',
            'deliverables': ['Double-Sided Print-Ready Business Card Files', 'Die-cut & Specialty Finish Layer Guides', 'High-Resolution 3D Product Renders (PNG/JPEG)', 'Photorealistic Brand Application Scenes'],
            'intended_audience': 'Executives, consultants, artisan brands, e-commerce retailers, and physical product creators.',
            'process_overview': 'Concept formulation -> Material selection guidance -> Visual mockup renders -> Final print-ready asset compilation.',
            'timeline_estimate': '3 to 5 business days',
            'starting_price_kes': 3500,
            'is_active': 1
        },
        {
            'id': 4,
            'name': 'Software & Web Development',
            'slug': 'software-web-development',
            'summary': 'Clean, accessible, zero-bloat websites and bespoke digital tools engineered for real business speed.',
            'description': 'We build digital platforms that respect your visitors and your brand. No clumsy website builders, heavy corporate templates, or mystery code. Handcrafted semantic HTML5, pure CSS3, vanilla JavaScript, and secure PHP/MySQL backends that load instantly and convert visitors into clients.',
            'deliverables': ['100% Framework-Free Responsive Frontend Code', 'Secure Custom Admin Dashboard & CMS', 'Contact, Brief Booking & Lead Storage Engine', 'Technical SEO Architecture & Rich Snippets', 'Domain, Hosting Setup & SSL Hardening'],
            'intended_audience': 'Professional services, creative studios, commercial companies, institutions, and independent entrepreneurs.',
            'process_overview': 'Information architecture -> Wireframing -> Semantic frontend coding -> Database architecture -> Rigorous QA & deployment.',
            'timeline_estimate': '2 to 4 weeks',
            'starting_price_kes': 35000,
            'is_active': 1
        },
        {
            'id': 5,
            'name': 'Video Editing & Motion Graphics',
            'slug': 'video-motion-graphics',
            'summary': 'Dynamic storytelling, kinetic typography, and polished video post-production that commands attention.',
            'description': 'Give your message rhythm and momentum. We produce compelling commercial reels, YouTube series grading, educational explainers, social media video cuts, and custom logo motion stings crafted to elevate brand perception across all screens.',
            'deliverables': ['Broadcast-Grade 4K/1080p Master Video Exports', 'Social Media Aspect Ratio Cuts (16:9, 9:16, 1:1)', 'Kinetic Typography & Lower-Third Packages', 'Sound Design, Music Licensing & Audio Mastering'],
            'intended_audience': 'Content creators, educators, corporations, filmmakers, and digital advertising campaigns.',
            'process_overview': 'Creative treatment -> Rough cut assembly -> Pacing & sound sync -> Motion graphics overlay -> Color grade & delivery.',
            'timeline_estimate': '4 to 10 business days',
            'starting_price_kes': 8000,
            'is_active': 1
        },
        {
            'id': 6,
            'name': 'Content & Social Media Design',
            'slug': 'social-content-design',
            'summary': 'Cohesive, high-converting visual assets and carousel narratives that build community.',
            'description': 'Turn fragmented feeds into an intentional gallery. We develop monthly social media design templates, engaging educational carousels, promotional story templates, and campaign visuals that stop the scroll and reinforce your brand positioning.',
            'deliverables': ['Monthly Themed Graphic Assets (Feed & Stories)', 'High-Engagement Educational Carousel Templates', 'Fully Editable Canva or Figma Component Packs', 'Story Highlight Covers & Profile Architecture'],
            'intended_audience': 'E-commerce stores, coaches, community leaders, service providers, and local businesses in Kenya and beyond.',
            'process_overview': 'Content pillar strategy -> Template design system -> Monthly asset production -> Review & scheduling support.',
            'timeline_estimate': 'Ongoing / 5 business days per batch',
            'starting_price_kes': 6000,
            'is_active': 1
        },
        {
            'id': 7,
            'name': 'Graphic Design Classes & Training',
            'slug': 'design-classes-training',
            'summary': 'Hands-on, mentorship-driven design training in Chuka that bridges artistic instinct and industry execution.',
            'description': 'Learn the craft of "Ink with Intent." Our intensive training cohorts take students from beginner fundamentals to professional design software proficiency (Illustrator, Photoshop, InDesign, Web foundations), portfolio development, and client communication skills.',
            'deliverables': ['Live Studio Lectures & Hands-on Workshops', 'Curated Project Briefs & Personalized Portfolio Reviews', 'Complete Design Resource & Asset Library Access', 'Certificate of Completion & Freelance Launch Guide'],
            'intended_audience': 'Aspiring graphic designers, university students, small business owners, and marketing professionals.',
            'process_overview': 'Structured weekly syllabus -> Practical daily briefs -> Peer critique sessions -> Capstone portfolio presentation.',
            'timeline_estimate': '4 to 8 weeks per cohort',
            'starting_price_kes': 12000,
            'is_active': 1
        }
    ],
    'classes': [
        {
            'id': 1,
            'title': 'Design Foundations & Typography Mastery',
            'slug': 'design-foundations-typography',
            'level': 'Beginner',
            'duration_weeks': 4,
            'format': 'In-Person (Chuka)',
            'summary': 'Master the timeless laws of visual hierarchy, deliberate typography, and ink-sharp composition from the ground up.',
            'description': 'This foundational cohort establishes unbreakable design instincts. You will learn to see negative space, control typographic leading and kerning, choose colours with intention, and master Adobe Illustrator vector drafting through practical studio assignments.',
            'learning_outcomes': ['Understand grid systems and ocular balance', 'Master typography hierarchies and font pairings', 'Achieve vector tool fluency in Adobe Illustrator', 'Deliver print-ready artwork with bleed and margins'],
            'syllabus_modules': ['Week 1: Seeing Space — Composition & Grids', 'Week 2: The Written Mark — Typography & Form', 'Week 3: Color Intent — Pigment, Screen & Emotion', 'Week 4: Final Poster Capstone & Critique'],
            'schedule_notes': 'Tuesdays & Thursdays, 5:00 PM - 7:00 PM EAT (Studio)',
            'price_kes': 12000,
            'is_enrolling': 1
        },
        {
            'id': 2,
            'title': 'Brand Identity Systems & Visual Identity Craft',
            'slug': 'brand-identity-systems-craft',
            'level': 'Intermediate',
            'duration_weeks': 6,
            'format': 'Hybrid',
            'summary': 'Learn to research, develop, and present complete brand identity ecosystems that command professional fees.',
            'description': 'Transform from a graphic maker into a strategic brand designer. Learn client discovery, moodboards, logo craft, and guidelines books.',
            'learning_outcomes': ['Conduct client discovery interviews', 'Develop distinct vector marks from thumbnails', 'Build brand style guides and asset deliverables', 'Present brand concepts with confidence'],
            'syllabus_modules': ['Week 1: Strategic Discovery & Moodboards', 'Week 2: Logo Mark Conceptualization', 'Week 3: Vector Refinement & Grids', 'Week 4: Complete Color & Type Systems', 'Week 5: Authoring Brand Guidelines Books', 'Week 6: Pitching & Hand-off'],
            'schedule_notes': 'Saturdays, 10:00 AM - 1:00 PM EAT (Studio + Stream)',
            'price_kes': 14500,
            'is_enrolling': 1
        },
        {
            'id': 3,
            'title': 'Web Design & Code for Creative Professionals',
            'slug': 'web-design-code-for-creatives',
            'level': 'Comprehensive',
            'duration_weeks': 8,
            'format': 'Hybrid',
            'summary': 'Bridge the gap between visual artistry and clean, responsive web code without dependency on visual page builders.',
            'description': 'Empower your designs with real code. Master semantic HTML5, modern CSS3 Grid/Flexbox, responsive dark/light themes, and vanilla JavaScript.',
            'learning_outcomes': ['Translate designs into semantic HTML/CSS', 'Master CSS Grid and custom properties', 'Implement theme switching with local persistence', 'Deploy fast business websites with SEO'],
            'syllabus_modules': ['Weeks 1-2: Semantic HTML5 & Design Tokens', 'Weeks 3-4: Responsive Layouts & Typography', 'Weeks 5-6: Vanilla JS & Theme Systems', 'Weeks 7-8: Backend Integration & Deployment'],
            'schedule_notes': 'Mondays & Wednesdays, 6:00 PM - 8:00 PM EAT',
            'price_kes': 22000,
            'is_enrolling': 1
        }
    ],
    'settings': {
        'business_name': 'Inklet Studios',
        'tagline': 'Ink with Intent',
        'location_town': 'Chuka',
        'location_region': 'Tharaka Nithi County, Kenya',
        'phone_number': '+254 700 000 000',
        'whatsapp_number': '+254700000000',
        'official_email': 'hello@inkletstudios.com',
        'admin_email': 'admin@inkletstudios.com',
        'social_instagram': 'https://instagram.com/inkletstudios',
        'social_behance': 'https://behance.net/inkletstudios',
        'social_linkedin': 'https://linkedin.com/company/inkletstudios',
        'social_x': 'https://x.com/inkletstudios',
        'theme_default': 'dark',
        'hero_eyebrow': 'CREATIVE DESIGN & DIGITAL CRAFT — CHUKA, KENYA',
        'hero_heading': 'Ink with Intent.',
        'hero_subheading': 'We shape visual identities, commanding editorial print, bespoke digital experiences, and creative training with deliberate precision in Chuka, Kenya.',
        'hero_cta_primary': 'Start a Project Brief',
        'hero_cta_secondary': 'Explore Portfolio',
        'manifesto_title': '“Ink with Intent” is not a slogan; it is our working covenant.',
        'manifesto_body': 'Every curve of a logomark, every point of typographic leading, every ink drop on paper, and every line of code exists to solve a real human and commercial objective. We avoid superficial agency clichés, generic templates, and decorative noise in pursuit of enduring design craftsmanship.'
    }
}

class InkletHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_ROOT, **kwargs)

    def end_headers(self):
        # Enforce HTTP security headers on all responses
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://wa.me mailto:;")
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Block access to dotfiles and sensitive configurations
        if any(path.endswith(ext) for ext in ['.sql', '.log', '.env', '.ini', '.yml', '.yaml', '.bak', '.sh', '.py']) or '/.' in path:
            self.send_response(403)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(b"403 Forbidden: Direct access to protected resources is disabled.")
            return

        # Route API calls
        if path.startswith('/api/') or path.startswith('/public/api/'):
            return self.handle_api_get(path, query)

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            body_data = json.loads(post_body)
        except Exception:
            body_data = urllib.parse.parse_qs(post_body)

        if path.startswith('/api/') or path.startswith('/public/api/'):
            return self.handle_api_post(path, query, body_data)

        self.send_response(404)
        self.end_headers()

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            body_data = json.loads(post_body)
        except Exception:
            body_data = {}

        if 'bookings.php' in path:
            b_id = int(body_data.get('id', query.get('id', [0])[0]))
            new_status = body_data.get('status', 'REVIEWING')
            notes = body_data.get('notes', '')
            for b in DEV_DB['bookings']:
                if b['id'] == b_id:
                    old_status = b['status']
                    b['status'] = new_status
                    b['history'].append({
                        'previous_status': old_status,
                        'new_status': new_status,
                        'notes': notes or f"Status shifted to {new_status}",
                        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    })
                    return self.send_json({'success': True, 'message': 'Booking status updated'})
            return self.send_json({'success': False, 'message': 'Booking not found'}, 404)

        if 'contact.php' in path:
            m_id = int(body_data.get('id', query.get('id', [0])[0]))
            new_st = body_data.get('status', 'read')
            for m in DEV_DB['messages']:
                if m['id'] == m_id:
                    m['status'] = new_st
                    m['is_read'] = 0 if new_st == 'unread' else 1
                    return self.send_json({'success': True, 'message': 'Message updated'})
            return self.send_json({'success': False, 'message': 'Message not found'}, 404)

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if 'projects.php' in path:
            p_id = int(query.get('id', [0])[0])
            for i, p in enumerate(DEV_DB.get('projects', [])):
                if p['id'] == p_id:
                    DEV_DB['projects'].pop(i)
                    return self.send_json({'success': True, 'message': 'Project deleted successfully'})
            return self.send_json({'success': True, 'message': 'Project removed'})

        self.send_response(404)
        self.end_headers()

    def handle_api_get(self, path, query):
        if 'auth.php' in path:
            action = query.get('action', [''])[0]
            if action == 'me':
                is_authed = DEV_DB.get('admin_authenticated', True)
                if is_authed:
                    return self.send_json({
                        'success': True,
                        'data': {
                            'authenticated': True,
                            'user': {'id': 1, 'name': 'Inklet Studio Administrator', 'email': 'admin@inkletstudios.com', 'role': 'superadmin', 'type': 'admin'},
                            'csrf_token': 'dev-csrf-token-2026'
                        }
                    })
                else:
                    return self.send_json({
                        'success': True,
                        'data': {
                            'authenticated': False,
                            'user': None,
                            'csrf_token': 'dev-csrf-token-2026'
                        }
                    })
            elif action == 'csrf':
                return self.send_json({'success': True, 'data': {'token': 'dev-csrf-token-2026'}})

        if 'stats.php' in path:
            projects = DEV_DB.get('projects', [])
            bookings = DEV_DB.get('bookings', [])
            messages = DEV_DB.get('messages', [])
            return self.send_json({
                'success': True,
                'data': {
                    'projects': {
                        'total': len(projects),
                        'published': sum(1 for p in projects if p.get('is_published') == 1),
                        'draft': sum(1 for p in projects if p.get('is_published') == 0),
                        'featured': sum(1 for p in projects if p.get('is_featured') == 1)
                    },
                    'bookings': {
                        'total': len(bookings),
                        'new': sum(1 for b in bookings if b.get('status') == 'NEW'),
                        'reviewing': sum(1 for b in bookings if b.get('status') == 'REVIEWING'),
                        'accepted': sum(1 for b in bookings if b.get('status') == 'ACCEPTED'),
                        'completed': sum(1 for b in bookings if b.get('status') == 'COMPLETED')
                    },
                    'messages': {
                        'total': len(messages),
                        'unread': sum(1 for m in messages if m.get('is_read') == 0 or m.get('status') == 'unread')
                    },
                    'classes': {'confirmed': 12, 'pending': 4},
                    'recent_bookings': bookings[:5],
                    'recent_messages': messages[:5]
                }
            })

        if 'bookings.php' in path:
            ref = query.get('ref', [''])[0]
            b_id = query.get('id', [''])[0]
            if ref or b_id:
                for b in DEV_DB['bookings']:
                    if (ref and b['booking_ref'] == ref) or (b_id and str(b['id']) == b_id):
                        return self.send_json({'success': True, 'data': b})
                return self.send_json({'success': False, 'message': 'Booking not found'}, 404)

            # List
            status_f = query.get('status', ['ALL'])[0]
            items = DEV_DB['bookings']
            if status_f != 'ALL':
                items = [b for b in items if b['status'] == status_f]
            return self.send_json({
                'success': True,
                'data': items,
                'pagination': {'total': len(items), 'page': 1, 'limit': 15, 'total_pages': 1},
                'status_counts': {'NEW': sum(1 for b in DEV_DB['bookings'] if b['status'] == 'NEW')}
            })

        if 'contact.php' in path:
            return self.send_json({
                'success': True,
                'data': DEV_DB['messages'],
                'unread_count': sum(1 for m in DEV_DB['messages'] if m['is_read'] == 0 or m['status'] == 'unread')
            })

        if 'projects.php' in path:
            projects_data = DEV_DB.get('projects', [])
            slug = query.get('slug', [''])[0]
            p_id = query.get('id', [''])[0]
            if slug or p_id:
                for p in projects_data:
                    if (slug and p['slug'] == slug) or (p_id and str(p['id']) == p_id):
                        return self.send_json({'success': True, 'data': p})
                return self.send_json({'success': False, 'message': 'Project not found'}, 404)

            cat = query.get('category', ['all'])[0]
            search = query.get('search', [''])[0].lower()
            filtered = projects_data
            if cat != 'all':
                filtered = [p for p in filtered if p.get('category_slug') == cat]
            if search:
                filtered = [p for p in filtered if search in p.get('title', '').lower() or search in p.get('overview', '').lower()]

            categories = [
                {'id': 1, 'name': 'Brand Identity & Logos', 'slug': 'brand-identity'},
                {'id': 2, 'name': 'Posters & Editorial Print', 'slug': 'posters-print'},
                {'id': 3, 'name': 'Packaging & Mockups', 'slug': 'packaging-mockups'},
                {'id': 4, 'name': 'Software & Web Development', 'slug': 'software-web'},
                {'id': 5, 'name': 'Motion & Video Editing', 'slug': 'motion-video'},
                {'id': 6, 'name': 'Social Media & Content', 'slug': 'social-content'}
            ]
            return self.send_json({
                'success': True,
                'data': filtered,
                'categories': categories,
                'pagination': {'total': len(filtered), 'page': 1, 'limit': 12, 'total_pages': 1}
            })

        if 'services.php' in path:
            services_data = DEV_DB.get('services', [])
            slug = query.get('slug', [''])[0]
            s_id = query.get('id', [''])[0]
            if slug or s_id:
                for s in services_data:
                    if (slug and s['slug'] == slug) or (s_id and str(s['id']) == s_id):
                        return self.send_json({'success': True, 'data': s})
                return self.send_json({'success': False, 'message': 'Service not found'}, 404)
            return self.send_json({'success': True, 'data': services_data})

        if 'classes.php' in path:
            return self.send_json({'success': True, 'data': DEV_DB.get('classes', [])})

        if 'settings.php' in path:
            return self.send_json({
                'success': True,
                'data': DEV_DB.get('settings', {})
            })

        return self.send_json({'success': False, 'message': 'Unknown endpoint'}, 404)

    def handle_api_post(self, path, query, data):
        if 'auth.php' in path:
            action = query.get('action', [''])[0]
            if action == 'login':
                email = data.get('email', '')
                password = data.get('password', '')
                if email == 'admin@inkletstudios.com' and password == 'AdminPassword2026!':
                    DEV_DB['admin_authenticated'] = True
                    return self.send_json({
                        'success': True,
                        'message': 'Authentication successful',
                        'data': {
                            'user': {'id': 1, 'name': 'Inklet Studio Administrator', 'email': 'admin@inkletstudios.com', 'role': 'superadmin', 'type': 'admin'},
                            'csrf_token': 'dev-csrf-token-2026'
                        }
                    })
                return self.send_json({'success': False, 'message': 'Invalid credentials. Default: admin@inkletstudios.com / AdminPassword2026!'}, 401)
            elif action == 'logout':
                DEV_DB['admin_authenticated'] = False
                return self.send_json({'success': True, 'message': 'Logged out'})
            elif action in ['forgot_password', 'forgot']:
                return self.send_json({'success': True, 'message': 'If an account exists for that email, recovery instructions have been dispatched.'})
            elif action in ['reset_password', 'reset']:
                return self.send_json({'success': True, 'message': 'Password has been successfully reset. You may now log in.'})

        if 'projects.php' in path:
            p_id = data.get('id')
            if p_id:
                p_id = int(p_id)
                for p in DEV_DB.get('projects', []):
                    if p['id'] == p_id:
                        p.update(data)
                        return self.send_json({'success': True, 'message': 'Project updated', 'data': p})
            # New project
            new_id = max([p['id'] for p in DEV_DB.get('projects', [])], default=0) + 1
            new_p = dict(data)
            new_p['id'] = new_id
            cat_map = {1: 'Brand Identity & Logos', 2: 'Posters & Editorial Print', 3: 'Packaging & Mockups', 4: 'Software & Web Development', 5: 'Motion & Video Editing', 6: 'Social Media & Content'}
            new_p['category_name'] = cat_map.get(int(new_p.get('category_id', 1)), 'Design')
            DEV_DB['projects'].insert(0, new_p)
            return self.send_json({'success': True, 'message': 'Project created successfully', 'data': new_p}, 201)

        if 'services.php' in path:
            s_id = int(data.get('id', 0))
            for s in DEV_DB.get('services', []):
                if s['id'] == s_id:
                    s.update(data)
                    return self.send_json({'success': True, 'message': 'Service updated', 'data': s})
            return self.send_json({'success': True, 'message': 'Service updated'})

        if 'classes.php' in path:
            if 'action' in query and query['action'][0] == 'enroll':
                return self.send_json({'success': True, 'message': 'Enrollment submitted successfully.'}, 201)
            c_id = int(data.get('id', 0))
            if c_id:
                for c in DEV_DB.get('classes', []):
                    if c['id'] == c_id:
                        c.update(data)
                        return self.send_json({'success': True, 'message': 'Class syllabus updated', 'data': c})
            return self.send_json({'success': True, 'message': 'Enrollment submitted successfully.'}, 201)

        if 'settings.php' in path:
            DEV_DB.setdefault('settings', {}).update(data)
            return self.send_json({'success': True, 'message': 'Settings updated successfully', 'data': DEV_DB['settings']})

        if 'bookings.php' in path:
            action = query.get('action', [''])[0]
            if action == 'note':
                b_id = int(data.get('booking_id', 0))
                content = data.get('note_content', '')
                for b in DEV_DB['bookings']:
                    if b['id'] == b_id:
                        b['notes'].append({
                            'admin_name': 'Inklet Administrator',
                            'note_content': content,
                            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        })
                        return self.send_json({'success': True, 'message': 'Note added'})
                return self.send_json({'success': False, 'message': 'Booking not found'}, 404)

            # Public submission
            ref = 'INK-' + datetime.now().strftime('%Y%m') + '-' + os.urandom(2).hex().upper()
            services_map = {
                1: 'Posters, Banners, Flyers & Brochures',
                2: 'Brand Identity & Logo Design',
                3: 'Business Cards & Product Mockups',
                4: 'Software & Web Development',
                5: 'Video Editing & Motion Graphics',
                6: 'Content & Social Media Design',
                7: 'Graphic Design Classes & Training'
            }
            s_id = int(data.get('service_id', 2))
            s_name = services_map.get(s_id, 'Creative Service')

            new_booking = {
                'id': len(DEV_DB['bookings']) + 1,
                'booking_ref': ref,
                'client_name': data.get('client_name', 'Client'),
                'client_email': data.get('client_email', ''),
                'client_phone': data.get('client_phone', ''),
                'preferred_channel': data.get('preferred_channel', 'email'),
                'service_id': s_id,
                'service_name': s_name,
                'project_title': data.get('project_title', 'Design Project'),
                'project_description': data.get('project_description', ''),
                'budget_range': data.get('budget_range', 'Undisclosed'),
                'deadline_date': data.get('deadline_date', ''),
                'status': 'NEW',
                'client_notified': 1,
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'history': [{'previous_status': None, 'new_status': 'NEW', 'notes': 'Submitted via web platform', 'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')}],
                'notes': []
            }
            DEV_DB['bookings'].insert(0, new_booking)

            wa_msg = urllib.parse.quote(f"Hello Inklet Studios! I just submitted project brief {ref} for '{new_booking['project_title']}' ({s_name}). Looking forward to discussing next steps with your team in Chuka.")
            wa_url = f"https://wa.me/254700000000?text={wa_msg}"

            return self.send_json({
                'success': True,
                'message': 'Project enquiry successfully submitted.',
                'data': {
                    'booking_ref': ref,
                    'client_name': new_booking['client_name'],
                    'service_name': s_name,
                    'status': 'NEW',
                    'email_confirmation': True,
                    'whatsapp_direct_url': wa_url,
                    'notice': 'Your project brief is received and securely logged in our system.'
                }
            }, 201)

        if 'contact.php' in path:
            new_msg = {
                'id': len(DEV_DB['messages']) + 1,
                'name': data.get('name', 'Anonymous'),
                'email': data.get('email', ''),
                'phone': data.get('phone', ''),
                'subject': data.get('subject', 'General Inquiry'),
                'message': data.get('message', ''),
                'is_read': 0,
                'status': 'unread',
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            DEV_DB['messages'].insert(0, new_msg)
            return self.send_json({'success': True, 'message': 'Your message has been received.'}, 201)

        return self.send_json({'success': False, 'message': 'Endpoint not supported in dev server'}, 400)

    def send_json(self, data, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.end_headers()

if __name__ == '__main__':
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), InkletHandler) as httpd:
        print(f"============================================================")
        print(f" Inklet Studios — Development Server Active")
        print(f" Philosophy: 'Ink with Intent'")
        print(f" URL: http://localhost:{PORT}")
        print(f" Web Root: {WEB_ROOT}")
        print(f" Default Admin: admin@inkletstudios.com")
        print(f" Default Pass:  AdminPassword2026!")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
