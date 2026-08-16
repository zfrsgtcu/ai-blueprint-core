<!-- 
  [TR] BU DOSYANIN AMACI:
  Forum/topluluk platformu için temel iş mantığını, moderasyon kurallarını ve içerik yönetimini tanımlar.
  AI'ı kategori yapısı, yetkilendirme, spam koruması ve kullanıcı etkileşimi konusunda yönlendirir.
-->

# FORUM COMMUNITY BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a full-featured community forum platform. Focus areas: Thread-based discussions, category management, reputation/karma systems, advanced moderation tools, and rich media embedding. The system MUST support both traditional threaded discussions and Q&A-style formats.

## 2. CATEGORY & THREAD MANAGEMENT
- **Category Hierarchy:** Support nested categories and subcategories (e.g., "Technology > Programming > JavaScript"). Categories have optional moderators assigned.
- **Thread Types:** Support multiple thread types: Discussion (open-ended), Question (Q&A with accepted answer), Poll (voting), Announcement (locked, admin-only).
- **Thread Statuses:** Threads can be open, closed (locked for new replies), archived (read-only), pinned (sticky), or hidden (removed by moderator).
- **Rich Content:** Thread content MUST support Markdown formatting, code syntax highlighting, embedded images (max 5MB), video embeds (YouTube, Vimeo), and link previews.
- **Tags & Flairs:** Threads can have tags (searchable metadata) and flairs (visual badges like "[SOLVED]", "[NSFW]", "[SPOILER]").

## 3. REPLIES & CONVERSATIONS
- **Nested Replies:** Support indented reply chains (threaded view) alongside flat chronological view. Up to 5 levels of nesting.
- **Mentions:** Use @username syntax for user mentions. Mentioned users MUST receive a notification.
- **Quote System:** Allow quoting previous posts with blockquote formatting and attribution.
- **Edit History:** Posts can be edited with a visible edit history (original + last edited timestamp). Edits after a configurable grace period (e.g., 5 min) show "Last edited" badge.
- **Voting System:** Upvote/downvote on posts (threads and replies). Vote counts affect user karma/reputation.

## 4. USER REPUTATION & ROLES
- **Karma System:** Users earn karma points based on upvotes received on their posts. Different categories may have weighted karma multipliers.
- **User Ranks:** Auto-assign ranks based on karma thresholds (e.g., New Member, Regular, Veteran, Elder, Legend). Ranks display as badges next to username.
- **Role-Based Permissions:** Roles: Admin, Global Moderator, Category Moderator, Trusted Member, Member, Restricted. Permissions control: creating threads, editing, deleting, moderating, and accessing private categories.
- **User Profiles:** Public profile with activity stats (post count, join date, badges), bio, and recent activity feed. Support profile customization (avatar, signature, cover image).

## 5. MODERATION & ANTI-SPAM
- **Content Moderation:** Support manual review queue for new users' posts (first N posts require approval). Automatically hold posts with excessive links or flagged keywords.
- **Spam Protection:** Implement rate limiting per user (max N posts per minute). Use CAPTCHA for new user registration. Optional integration with third-party spam filters (Akismet, reCAPTCHA).
- **Report System:** Users can report posts/comments with reason categories (Spam, Harassment, NSFW, Other). Reports go to category moderators and admins.
- **Ban System:** Temporary or permanent user bans. Banned users cannot create/edit posts but can view public content (configurable shadow-ban option).
- **Audit Log:** Full moderation action log (who did what, when, and why) for transparency and compliance.

## 6. SEARCH & DISCOVERY
- **Full-Text Search:** Index thread titles, content, tags, and usernames. Support search filters by category, date range, author, and post type.
- **Trending & Hot Topics:** Algorithm to surface trending discussions based on recent activity, vote velocity, and reply count.
- **Similar Threads:** When creating a new thread, suggest existing similar threads to prevent duplicates.
- **Digest Emails:** Automated weekly/daily digest of top posts from subscribed categories.

## 7. NOTIFICATIONS & ENGAGEMENT
- **Notification Types:** Reply to thread, mention, upvote on post, accepted answer, moderator action, new follower.
- **Notification Channels:** In-app notifications (bell icon), email notifications (configurable frequency), and optional push notifications.
- **Subscription System:** Users can watch/ unwatch categories or individual threads. Watched items trigger notifications for new activity.

## 8. ADMIN & SETTINGS
- **Site Configuration:** Manage forum name, description, logo, custom CSS/theme, legal pages (Terms, Privacy).
- **Category Management:** Full CRUD for categories including ordering, permissions, and moderator assignment.
- **User Management:** User search, role assignment, ban/unban, and account suspension.
- **Statistics Dashboard:** Total users, posts, threads, daily active users, trending categories, and system health metrics.
- **Data Export/Import:** GDPR compliance with user data export. Import/export tools for migration (XML/JSON format).