<!-- 
  [TR] BU DOSYANIN AMACI:
  Profesyonel portfolyo sitesi oluşturma platformu için temel iş mantığını tanımlar.
  AI'ı proje sergileme, yetenek vitrini ve işe alım odaklı portfolyo yönetimi konusunda yönlendirir.
-->

# PORTFOLIO BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a professional portfolio builder for creatives, developers, designers, photographers, and agencies. Focus areas: Project showcase, visual storytelling, client management, and professional branding. The system MUST prioritize visual aesthetics, performance, and SEO for discoverability.

## 2. PROFILE & BRANDING
- **User Profile:** Full name, professional title/tagline, bio (Markdown), avatar/photo, location, availability status (available for hire, open to opportunities, not available).
- **Professional Links:** GitHub, LinkedIn, Dribbble, Behance, personal website, Stack Overflow, Medium, Dev.to, etc.
- **Resume/CV:** Built-in resume builder with structured sections (experience, education, skills, certifications). Export to PDF with professional templates.
- **Skills Showcase:** Visual skill bars or tag cloud with proficiency levels. Categories: Frontend, Backend, Design, Tools, Languages.
- **Service Offerings:** List of services offered (e.g., Web Development, UI Design, Consulting) with brief descriptions and starting price (optional).

## 3. PROJECT SHOWCASE
- **Project Structure:** Each project MUST have: title, description, role, timeline, technologies used, live URL, source code URL, featured image, gallery (images/videos), and case study content.
- **Project Types:** Web app, Mobile app, Design/UI, Branding, Photography, Writing, Art/Illustration, Video, Research, Open Source, Side project.
- **Rich Case Studies:** Support detailed case study format: Challenge -> Approach -> Solution -> Results. Include metrics/outcomes (e.g., "Increased conversion by 30%").
- **Project Tags:** Filterable tags for technology, industry, and project type. Tags power the portfolio's filtering UI.
- **Embed Support:** Embed live demos (iframes), code snippets (highlighted), Figma prototypes, YouTube/Vimeo videos, and CodePen/StackBlitz embeds.

## 4. GALLERY & MEDIA
- **Media Types:** Images (with lightbox viewer), videos (self-hosted or embedded), audio (podcasts, music samples), documents (PDFs, case study downloads).
- **Image Optimization:** Auto-generated responsive image sizes. WebP conversion. Lazy loading. Image captions and alt text.
- **Lightbox Viewer:** Full-screen media viewer with swipe navigation (mobile), zoom, and slideshow mode.
- **Before/After Slider:** Interactive slider for design comparisons (e.g., redesign projects).

## 5. CLIENT TESTIMONIALS
- **Testimonial Structure:** Client name, company, position, photo, testimonial text, linked project. Optional video testimonial.
- **Rating Display:** Star rating (1-5) for client satisfaction. Aggregate rating shown on profile.
- **Request Testimonials:** Send automated email requests to past clients with a link to submit feedback.

## 6. CONTACT & INQUIRY
- **Contact Form:** Customizable contact form with fields (name, email, subject, message, budget, timeline). Spam protection (honeypot + rate limiting).
- **Inquiry Management:** Dashboard to manage incoming inquiries. Mark as read, reply, archive, or flag as spam.
- **Booking Integration:** Optional integration with calendar (Calendly, Cal.com) for scheduling discovery calls.

## 7. PORTFOLIO THEMES & CUSTOMIZATION
- **Theme Library:** Professionally designed themes for different professions (Developer, Designer, Photographer, Writer, Agency).
- **Customization Options:** Color scheme (primary, secondary, accent), typography (Google Fonts), layout (grid, masonry, list), animation preferences.
- **Custom CSS:** Advanced customization via custom CSS injection.
- **Layout Components:** Hero (fullscreen, minimal, split), Project grid (filterable, load-more/pagination), About section, Timeline, Stats counter, Contact section, Footer.

## 8. SEO & ANALYTICS
- **SEO:** Auto-generated meta tags for each project and profile pages. Open Graph and Twitter Card support. XML sitemap. Structured data (Person, CreativeWork schemas).
- **Custom Domain:** Connect custom domain with SSL. Subdomain hosting (username.portfolio.com).
- **Analytics:** Page view tracking per project. Referral source tracking. Optional Google Analytics integration.
- **Social Proof:** Display badges for GitHub stars, Dribbble likes, Behance appreciations (via API integration).

## 9. ADMIN & SETTINGS
- **Portfolio Management:** Create/Edit/Delete projects. Reorder projects (drag-and-drop). Duplicate projects.
- **Password Protection:** Private portfolios or password-protected projects (for NDAs or unreleased work).
- **Export/Backup:** Export portfolio as static site or JSON data. Automatic version backups.
- **Multi-Language:** Support for multilingual portfolios with content translation.