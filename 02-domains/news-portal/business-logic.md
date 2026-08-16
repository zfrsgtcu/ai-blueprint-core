<!-- 
  [TR] BU DOSYANIN AMACI:
  Haber portalı / dijital gazete platformu için temel iş mantığını tanımlar.
  AI'ı haber yönetimi, kategorizasyon, yazar yönetimi, abonelikler ve içerik dağıtımı konusunda yönlendirir.
-->

# NEWS PORTAL BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a full-featured digital news portal and content publishing platform. Focus areas: Article management, editorial workflow, multimedia content, subscription/monetization, and real-time news delivery. The system MUST support high-traffic scenarios with caching and CDN strategies.

## 2. ARTICLE & CONTENT MANAGEMENT
- **Article Structure:** Each article MUST include: headline, subheadline, byline/author, body (Markdown/Rich Text), featured image, category, tags, publish date, and read time estimate.
- **Content Types:** News article, Editorial/Opinion, Interview, Photo essay, Video story, Podcast episode, Live blog (real-time updates), Data-driven/Interactive article.
- **Series & Collections:** Group related articles into series (e.g., "Investigation Series") or curated collections/playlists.
- **Article Statuses:** Draft -> Under Review -> Scheduled -> Published -> Updated -> Archived. Support for breaking news badges and pinned articles.
- **Version History:** Track all edits with diff view. Rollback to previous versions if needed.
- **Auto-Save:** Draft articles auto-save every 30 seconds to prevent content loss.

## 3. EDITORIAL WORKFLOW
- **Role-Based Editorial Pipeline:** Reporter -> Editor -> Senior Editor -> Publisher. Each step can approve, request changes, or reject.
- **Collaborative Editing:** Multiple authors can collaborate on an article. Real-time presence indicators. Comment/annotation system for editors.
- **Fact-Checking:** Optional fact-check step in workflow. Fact-checkers can annotate claims in the article.
- **Content Calendar:** Editorial calendar view showing scheduled articles by date, category, and author. Drag-and-drop rescheduling.
- **Deadline Management:** Set deadlines for articles with automated reminders to authors and editors.

## 4. CATEGORIES & TAXONOMY
- **Hierarchical Categories:** e.g., World > Europe > UK, Technology > AI > Machine Learning. Articles can belong to multiple categories.
- **Tags:** Free-form tagging for internal organization. Tags are visible on article pages for navigation.
- **Sections:** Front page, World, Business, Technology, Science, Health, Sports, Entertainment, Opinion, Culture. Each section has a dedicated homepage/landing page.
- **Section Editors:** Assign editors to specific sections. Section editors have approval authority for their section's content.

## 5. MULTIMEDIA & EMBEDS
- **Image Management:** Upload with auto-generated thumbnails (small, medium, large). Support for image galleries within articles. Captions and alt text required for accessibility.
- **Video Integration:** Embed YouTube, Vimeo, or self-hosted videos. Video transcripts for SEO and accessibility.
- **Audio/Podcasts:** Upload podcast episodes with show notes, chapters/timestamps, and RSS feed generation.
- **Interactive Elements:** Support for embedded charts (DataWrapper, Flourish), maps, timelines, and calculators via iframes or custom blocks.

## 6. SUBSCRIPTIONS & PAYWALL
- **Tier Models:** Free (limited articles/month), Premium (unlimited access), Premium+ (ad-free + exclusive content), Enterprise (team/org subscriptions).
- **Metered Paywall:** Track article views per user session/period. Show teaser content before paywall triggers. Soft paywall (can be bypassed via social media) vs. hard paywall.
- **Subscription Management:** Stripe/Billing integration with recurring payments. Coupon codes, free trials, and promotional pricing.
- **Gifting:** Allow subscribers to gift articles or subscriptions to non-subscribers.
- **Reader Revenue:** Optional donation/tip system for readers who prefer not to subscribe.

## 7. NEWSLETTER & DISTRIBUTION
- **Newsletter:** Digest emails (daily/weekly) with top stories by category. Automated generation from editorial picks or algorithmic selection.
- **RSS Feeds:** Generate RSS 2.0 and Atom feeds per category, author, and tag.
- **Push Notifications:** Breaking news alerts via web push (and optionally mobile push via Firebase/APNs).
- **AMP & Instant Articles:** Generate Google AMP and Facebook Instant Articles versions of each article for faster mobile delivery.
- **Social Sharing:** Auto-generated social media cards (Twitter/X, LinkedIn, Facebook). One-click sharing with pre-formatted text.

## 8. COMMENTS & ENGAGEMENT
- **Comment System:** Threaded comments with upvoting/downvoting. Comment sorting (newest, oldest, best). User badges (verified, top contributor, staff).
- **Community Guidelines:** Comment moderation queue. Auto-hold for new users, flagged keywords, and excessive links.
- **Reader Polls:** Embed polls within articles or sidebar. Real-time results display.
- **Reactions:** Quick emoji reactions on articles (like, love, insightful, surprised, sad, angry) for lightweight engagement.

## 9. SEO & ANALYTICS
- **SEO Optimization:** Auto-generate meta titles, descriptions, canonical URLs, and structured data (NewsArticle schema). XML sitemap generation.
- **Analytics Integration:** First-party analytics (page views, unique visitors, time on page, scroll depth). Integration with Google Analytics, Chartbeat, or similar.
- **A/B Headlines:** Test multiple headlines on the same article to measure click-through rates.
- **Referral Tracking:** Track traffic sources (social, search, direct, newsletter, referral).

## 10. ADMIN & SYSTEM
- **User Management:** Manage reporters, editors, admins. Two-factor authentication for staff accounts.
- **Role Permissions:** Granular permissions per section, content type, and editorial action.
- **System Monitoring:** Performance dashboards, CDN cache hit rates, page load times, error logging.
- **GDPR Compliance:** User data export, account deletion, cookie consent management.
- **Backup & Disaster Recovery:** Automated database and media backups. Disaster recovery plan for content restoration.