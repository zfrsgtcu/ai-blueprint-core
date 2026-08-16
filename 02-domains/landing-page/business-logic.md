<!-- 
  [TR] BU DOSYANIN AMACI:
  Landing page / açılış sayfası oluşturma platformu için temel iş mantığını tanımlar.
  AI'ı dönüşüm odaklı tasarım, A/B testi, form yönetimi ve lead yakalama konusunda yönlendirir.
-->

# LANDING PAGE BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a high-conversion landing page builder focused on marketing campaigns, product launches, and lead generation. The system MUST prioritize performance (sub-second load times), SEO optimization, and conversion tracking. Landing pages are single-purpose, standalone pages distinct from full websites.

## 2. PAGE STRUCTURE & COMPONENTS
- **Hero Section:** Full-width header with headline, subheadline, CTA button(s), and optional background media (image, video, or animation). Support multiple hero layouts (centered, split, minimal).
- **Content Sections:** Modular drag-and-drop sections: Features grid, Testimonials, Pricing tables, FAQ accordion, Statistics/counters, Team members, Logo cloud (trusted by), Timeline/roadmap.
- **Forms:** Lead capture forms with customizable fields (text, email, phone, dropdown, checkbox, file upload). Support multi-step forms with progress indicator.
- **Media:** Image galleries, video embeds (YouTube, Vimeo, self-hosted), interactive comparisons (before/after slider).
- **Footer:** Minimal footer with social links, privacy policy, terms of service links, and optional secondary CTA.

## 3. CONVERSION OPTIMIZATION
- **CTAs (Call to Action):** Multiple CTA styles (button, text link, floating bar, sticky header). Track click events and conversion rates per CTA.
- **A/B Testing:** Create page variants and split traffic to test headlines, CTAs, layouts, and images. Statistical significance calculation for winner determination.
- **Exit-Intent Popups:** Detect when cursor leaves the viewport and display a targeted popup (discount offer, email capture, survey).
- **Scroll-Based Triggers:** Trigger animations, counters, and popups based on scroll percentage. Lazy-load sections for performance.
- **Countdown Timers:** Add urgency with countdown timers for promotions, limited offers, or event registrations. Timer syncs across user sessions via server timestamp.

## 4. SEO & SOCIAL SHARING
- **Meta Tags:** Auto-generate Open Graph (OG), Twitter Card, and standard meta tags from page content. Custom title, description, and preview image.
- **Structured Data:** Inject JSON-LD schema for Product, Event, or LocalBusiness depending on page purpose.
- **Sitemap:** Generate sitemap.xml for indexed landing pages.
- **Canonical URLs:** Set canonical URL to avoid duplicate content issues.
- **Social Share Buttons:** Pre-configured share buttons for major platforms (LinkedIn, Twitter/X, Facebook) with share count tracking.

## 5. ANALYTICS & TRACKING
- **Conversion Tracking:** Track form submissions, button clicks, and goal completions. Attribution to traffic source (UTM parameters).
- **Heatmaps:** Optional integration with heatmap tools (or built-in click tracking) to visualize user interaction.
- **Pixel Integration:** Support Facebook Pixel, Google Ads Tag, LinkedIn Insight Tag, and custom JavaScript snippet injection in page head/body.
- **UTM Parameters:** Capture and store UTM source, medium, campaign, term, and content with each conversion.

## 6. ADMIN & PUBLISHING
- **Publishing Workflow:** Draft -> Review -> Published. Support scheduled publishing (specific date/time).
- **Custom Domains:** Users can connect custom domains with SSL certificate provisioning (Let's Encrypt).
- **Password Protection:** Option to password-protect pages for private beta launches or internal campaigns.
- **Page Backup:** Auto-save version history with rollback capability. Manual backup/export to HTML.
- **Team Collaboration:** Invite team members with roles (Editor, Reviewer, Admin). Page-level permissions.

## 7. INTEGRATIONS & WEBHOOKS
- **Email Marketing:** Native integrations with Mailchimp, ConvertKit, SendGrid, and HubSpot for lead sync.
- **CRM Integration:** Webhook-based integration with Salesforce, HubSpot CRM, Pipedrive, and custom endpoints.
- **Zapier/Make Support:** Expose triggers for form submissions and conversions via webhooks.
- **Payment Links:** Embed payment links (Stripe, PayPal, Gumroad) for product/service checkouts.