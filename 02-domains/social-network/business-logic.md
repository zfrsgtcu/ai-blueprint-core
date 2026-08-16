<!-- 
  [TR] BU DOSYANIN AMACI:
  Sosyal ağ / sosyal medya platformu için temel iş mantığını tanımlar.
  AI'ı kullanıcı etkileşimleri, içerik akışı, gerçek zamanlı mesajlaşma ve topluluk yönetimi konusunda yönlendirir.
-->

# SOCIAL NETWORK BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a full-featured social networking platform connecting users through posts, stories, messaging, and community interactions. Focus areas: Social feed algorithm, real-time chat, content sharing, user profiles, groups/communities, and platform moderation. The system MUST handle high concurrency with real-time updates at scale.

## 2. USER PROFILES & AUTHENTICATION
- **Profile Structure:** Display name, username (@handle), bio, avatar, cover photo, location, website, join date. Optional: pronouns, relationship status, education, employment, and interests.
- **Account Types:** Personal account, Creator/Influencer account (with analytics), Business/Brand account (with promotions).
- **Verification:** Verified badge for notable accounts (celebrities, brands, public figures). Verification request workflow with document review.
- **Privacy Settings:** Public profile vs. Private account (follower approval required). Custom profile visibility for specific sections (posts, friends/following list, photos).
- **Account Deactivation:** Soft delete (deactivate) with reactivation option. Hard delete after 30-day grace period.

## 3. SOCIAL FEED & CONTENT
- **Post Types:** Text post, Photo (single or album), Video (upload or link), Link share (with preview card), Poll, Check-in (location tag), Event invite, Live video (streaming).
- **Feed Algorithm:** Chronological feed (Recent) and Algorithmic feed (For You). Algorithm considers: relevance, engagement, recency, connection strength, content type preferences.
- **Interaction Types:** Like (heart), Comment, Share (repost with/without quote), Bookmark/Save, Follow hashtag/topic.
- **Reactions:** Extended reactions (Like, Love, Laugh, Surprised, Sad, Angry) similar to Facebook reactions.
- **Content Formatting:** Rich text (bold, italic, lists), hashtags (#topic), mentions (@username), emojis support. Link preview with Open Graph metadata.
- **Stories:** Ephemeral content (photos/videos) that disappears after 24 hours. Story reactions and replies. Story highlights (permanent collections).
- **Drafts:** Save posts as drafts before publishing. Schedule posts for future publishing.

## 4. CONNECTIONS & SOCIAL GRAPH
- **Connection Types:** Follow (one-way), Friend (two-way acceptance), Subscribe (for creator accounts), Block (prevent all interaction).
- **Follower/Following:** Public follower count with follower/following list (respecting privacy settings). Mutual followers indicator.
- **Friend Suggestions:** Algorithm suggesting new connections based on mutual friends, shared interests, location, and contact sync.
- **Follow Hashtags & Topics:** Users can follow hashtags and topics to see related content in their feed.
- **Close Friends:** Custom lists for sharing content with a subset of followers (e.g., Close Friends story).

## 5. MESSAGING & REAL-TIME COMMUNICATION
- **Direct Messages (DM):** One-on-one and group chats. Message types: Text, Image, Video, Voice note, GIF, Sticker, File share.
- **Chat Features:** Typing indicator, read receipts (read/unread), message reactions, reply to specific message, forward message, pin messages.
- **Message Status:** Sent -> Delivered -> Read. Failed message retry with network recovery.
- **Group Chats:** Create group with name, avatar, description. Participant limit (e.g., 250). Admin roles (creator, admin, member).
- **End-to-End Encryption:** Optional encrypted chats (Signal Protocol) for private conversations.
- **Message Requests:** Incoming messages from non-contacts go to "Requests" folder to prevent spam.
- **Broadcast Channels:** One-way broadcast lists (admin posts, followers see). Replaces traditional newsletter functionality.

## 6. GROUPS & COMMUNITIES
- **Group Types:** Public (anyone can join/see), Private (visible, request to join), Secret (invite-only, not searchable).
- **Group Features:** Group feed (posts only visible to members), group events, group rules/pinned post, member list, admin/mod roles.
- **Group Moderation:** Join requests approval. Member removal and ban. Post approval for restricted groups.
- **Group Analytics:** For admins: member growth, top posters, engagement metrics.

## 7. NOTIFICATIONS & ACTIVITY
- **Notification Types:** Like, Comment, Mention, Follow, Friend request, Message, Group invite, Event reminder, Live video start, Story reply, Tagged in post.
- **Notification Channels:** In-app notification center, Push notifications (web + mobile), Email digest (configurable frequency).
- **Mute Controls:** Mute notifications from specific users, posts, or groups. Snooze notifications (1 hour, 24 hours, until tomorrow).
- **Activity Log:** View own activity history (posts, likes, comments, follows). Filterable by type and date.

## 8. SEARCH & DISCOVERY
- **Global Search:** Search across users, posts, hashtags, groups, and topics. Search filters by type, date, and location.
- **Trending Topics:** Real-time trending hashtags and topics based on engagement velocity. Location-based trends.
- **Explore Page:** Curated content discovery based on user interests, trending content, suggested users, and popular hashtags.
- **People Discovery:** Suggested users to follow based on interests, mutual connections, and location.

## 9. MODERATION & SAFETY
- **Content Moderation:** Automated detection of prohibited content (hate speech, violence, nudity, spam) using ML filters. Human review queue for flagged content.
- **User Reporting:** Report posts, comments, messages, profiles, or groups with reason categories. Anonymous reporting option.
- **Blocking:** Block users from all interaction (cannot view profile, send messages, or comment on posts).
- **Restrict:** Soft block where restricted user can still see content but their comments are only visible to them.
- **Sensitive Content:** Content warnings/blur for potentially sensitive media. Age restriction for mature content.
- **Appeal System:** Users can appeal content takedowns or account suspensions. Review process with clear timelines.

## 10. ADMIN & PLATFORM MANAGEMENT
- **Dashboard:** Daily active users (DAU), Monthly active users (MAU), new signups, content metrics, report resolution rate, system health.
- **User Management:** Search users, view account details, suspend/ban accounts, restrict features per user.
- **Content Management:** Remove violating content, review reported content queue, manage trending topics (remove abusive hashtags).
- **Analytics:** Platform-wide engagement metrics, growth trends, popular content categories, geographic distribution.
- **Feature Flags:** Gradual rollouts of new features. A/B testing framework for feed algorithm and UI changes.

## 11. API & INTEGRATIONS
- **Public API:** REST API for third-party app development. OAuth 2.0 authentication. Rate limiting per app.
- **Webhooks:** Event-based webhooks for integrations (new post, new follower, mention).
- **Embed:** Embeddable post widgets for external websites. oEmbed support.
- **Social Login Integration:** OAuth provider for other apps (Login with SocialNetwork).