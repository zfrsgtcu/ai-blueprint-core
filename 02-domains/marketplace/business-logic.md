<!-- 
  [TR] BU DOSYANIN AMACI:
  Çok satıcılı pazar yeri platformu için temel iş mantığını tanımlar.
  AI'ı ürün yönetimi, satıcı onboarding, ödeme entegrasyonu ve puanlama sistemleri konusunda yönlendirir.
-->

# MARKETPLACE BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a multi-vendor marketplace platform connecting buyers and sellers. Focus areas: Product catalog management, seller onboarding, order processing, commission/fee structures, review systems, and dispute resolution. The system MUST support both digital and physical goods with varying fulfillment models.

## 2. PRODUCT & CATALOG MANAGEMENT
- **Product Types:** Physical goods (with shipping), Digital goods (downloadable), Services (booking-based), Subscription products (recurring).
- **Product Structure:** Each product MUST have: title, description (Rich text/Markdown), images (up to 10, with auto-generated thumbnails), price, compare-at price (for discounts), SKU, inventory tracking, and variants (size, color, etc.).
- **Categories:** Hierarchical category tree (3 levels max). Products can belong to multiple categories. Category-specific attributes (e.g., "Brand" for electronics, "Size" for clothing).
- **Inventory Tracking:** Real-time inventory count with low-stock alerts. Support for unlimited inventory (digital goods) and backorder/pre-order settings.
- **Bulk Import:** CSV/Excel product import for sellers with validation and error reporting.

## 3. SELLER MANAGEMENT
- **Seller Onboarding:** Registration with business verification (tax ID, business license). KYC (Know Your Customer) compliance for payouts.
- **Seller Dashboard:** Analytics (revenue, orders, visitors), product management, order fulfillment, and payout history.
- **Store Profiles:** Each seller has a customizable store page with bio, banner, policies (shipping, returns), and store ratings.
- **Commission Structure:** Configurable commission rates per category (flat % or tiered). Special promotional fee discounts.
- **Payouts:** Automated payout scheduling (weekly, bi-weekly, monthly). Payout methods: bank transfer, PayPal, Stripe Connect. Minimum payout thresholds.

## 4. BUYER EXPERIENCE
- **Search & Discovery:** Full-text search with filters (category, price range, rating, location, seller). Faceted search with dynamic filter counts.
- **Product Comparisons:** Side-by-side product comparison (up to 4 products). Compare price, specifications, ratings.
- **Wishlists:** Users can create multiple wishlists (e.g., "Birthday Ideas", "Home Office"). Share wishlists via link.
- **Recently Viewed:** Track and display recently viewed products for re-engagement.
- **Follow Sellers:** Users can follow favorite sellers and receive notifications for new products or sales.

## 5. ORDER & CHECKOUT
- **Cart:** Persistent cart across sessions. Save for later feature. Cart-level discounts and coupon codes.
- **Checkout:** Guest checkout option. Address validation (Google Maps/Mapbox integration). Multiple shipping methods per seller.
- **Order Splitting:** Orders with items from multiple sellers are split into sub-orders (one per seller) for fulfillment.
- **Order Statuses:** Pending -> Confirmed -> Processing -> Shipped -> Delivered -> Completed. Support cancellation, return, and refund flows.
- **Digital Fulfillment:** Auto-delivery of digital products upon payment confirmation. Download links with expiration and download limits.

## 6. PAYMENTS & COMMISSION
- **Payment Processing:** Stripe Connect, PayPal Marketplace, or similar platform that supports marketplace payments (direct charges to buyers, auto-splitting to sellers).
- **Commission Calculation:** Platform commission deducted at transaction time. Support for fixed fee + percentage combination.
- **Tax Handling:** Automatic tax calculation based on buyer location (VAT/GST/Sales Tax). Seller tax ID collection for reporting.
- **Dispute Resolution:** Escalation process for order disputes. Admin-mediated resolution with refund/chargeback handling.

## 7. REVIEWS & TRUST
- **Product Reviews:** Rating (1-5 stars) with text review and optional images. Verified purchase badge on reviews.
- **Seller Ratings:** Aggregate seller rating based on product quality, shipping speed, and customer service metrics.
- **Review Moderation:** Auto-flag reviews with offensive language. Manual review queue for flagged content.
- **Q&A System:** Buyers can ask questions about products. Sellers and previous buyers can answer.

## 8. NOTIFICATIONS & COMMUNICATION
- **Buyer Notifications:** Order confirmation, shipping updates, delivery confirmation, review reminders.
- **Seller Notifications:** New order, new review, payout processed, low stock alert, question about product.
- **Messaging System:** Direct buyer-to-seller messaging for order-related inquiries. Preserve chat history per order.

## 9. ADMIN & OPERATIONS
- **Dashboard:** Platform revenue, active sellers, total orders, dispute resolution rate, and growth metrics.
- **Seller Management:** Approve/reject seller applications, review seller documents, manage payouts.
- **Category Management:** CRUD categories with attribute templates.
- **Coupon System:** Platform-wide and seller-specific coupon codes with usage limits and expiry dates.
- **Dispute Panel:** Review and resolve order disputes, manage refunds, issue warnings/suspensions to sellers.