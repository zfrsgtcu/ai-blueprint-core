<!-- 
  [TR] BU DOSYANIN AMACI:
  Mikro-site / mini web sitesi oluşturma platformu için temel iş mantığını tanımlar.
  AI'ı tek sayfalık siteler, portfolyo siteleri ve hızlı prototipleme konusunda yönlendirir.
-->

# MICRO-SITE BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a lightweight micro-site builder for creating focused, single-purpose websites quickly. Unlike full CMS platforms, micro-sites are designed for campaigns, events, personal branding, product launches, and mini-portfolios. Performance (sub-second load), simplicity, and mobile-first design are paramount.

## 2. SITE TYPES & TEMPLATES
- **Site Types:** Personal bio/portfolio, Event invite/wedding, Product launch teaser, Digital business card, Link-in-bio (like Linktree), Coming soon / Maintenance mode, Resume/CV, Podcast show notes.
- **Template Library:** Pre-designed templates for each site type. Templates are fully customizable with colors, fonts, and content.
- **Page Structure:** Most micro-sites are single-page. Support for multi-page (up to 5 pages) for more complex needs. Navigation is a simple sticky bar or hamburger menu.

## 3. DESIGN & CUSTOMIZATION
- **Theme System:** Pre-built color themes. Custom color picker for primary, secondary, accent, and background colors.
- **Typography:** Google Fonts integration with curated font pairings (heading + body). Custom font size and spacing controls.
- **Layout Components:** Hero (with avatar/logo, headline, subtitle, CTAs), About/Bio section, Social links (icon grid), Gallery/Media grid (images, videos), Timeline (experience, education), Pricing/Service cards, Contact form, Embedded map, Music/Spotify player embed.
- **Background Options:** Solid color, gradient (linear/radial), image, video (loop), or particle animation (subtle).
- **Custom CSS:** Advanced users can inject custom CSS for fine-grained styling control.

## 4. CONTENT MANAGEMENT
- **Rich Text Editor:** Simple WYSIWYG or Markdown editor for content sections. Support basic formatting (bold, italic, lists, links).
- **Media Library:** Upload and manage images, videos, and documents. Auto-generated thumbnails and responsive image variants.
- **Social Links:** Pre-configured social media platform icons (Twitter/X, Instagram, LinkedIn, GitHub, YouTube, TikTok, Pinterest, etc.) with custom link entry.
- **SEO Fields:** Per-page meta title, description, OG image. Auto-generated sitemap.

## 5. DOMAIN & PUBLISHING
- **Subdomain Hosting:** Each site gets a free subdomain (e.g., username.microsite.com). Instant provisioning.
- **Custom Domain:** Users can connect their own domain with CNAME setup. Automatic SSL via Let's Encrypt.
- **Publishing:** One-click publish with instant CDN propagation (Netlify/Vercel-style). Draft mode for preview before going live.
- **Password Protection:** Optional password gate for private pages (e.g., personal wedding site).
- **Analytics:** Basic page view tracking (total views, unique visitors, referrers). Optional Google Analytics integration.

## 6. SOCIAL & SHARING
- **QR Code:** Auto-generate QR code for the site URL. Downloadable in PNG/SVG.
- **Share Buttons:** One-click share to Twitter/X, LinkedIn, Facebook, WhatsApp, and copy link.
- **VCard/NFC:** Option to generate a digital vCard (VCF file) for business card style sites. NFC tag compatibility.
- **Contact Form:** Simple contact form with spam protection (honeypot). Form submissions forwarded to owner's email.

## 7. ADMIN & USER MANAGEMENT
- **Dashboard:** Overview of all user's micro-sites with view counts, publish status, and last edited date.
- **Site Duplication:** Clone an existing site as a starting point for a new one.
- **Site Analytics:** Per-site view tracking with basic charts (views over time, top referrers, devices).
- **Backup & Restore:** Auto-save version history. Manual export site as static HTML/ZIP.
- **Team Access:** Option to add collaborators with edit/view permissions.

## 8. PERFORMANCE & SECURITY
- **CDN Delivery:** All published sites are served via global CDN for fast load times.
- **Image Optimization:** Automatic WebP conversion, lazy loading, and responsive image srcset generation.
- **Minification:** HTML, CSS, and JS minification on publish.
- **No Index Option:** Option to prevent search engines from indexing the site (meta robots).
- **Custom Scripts:** Allow injection of custom HTML/JS for analytics pixels, custom fonts, or third-party widgets (within security sandbox).