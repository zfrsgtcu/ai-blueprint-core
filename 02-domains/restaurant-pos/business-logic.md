<!-- 
  [TR] BU DOSYANIN AMACI:
  Restoran POS / sipariş yönetim sistemi için temel iş mantığını tanımlar.
  AI'ı sipariş akışı, mutfak yönetimi, envanter takibi ve raporlama konusunda yönlendirir.
-->

# RESTAURANT POS BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a comprehensive Point of Sale (POS) and restaurant management system. Focus areas: Order management (dine-in, takeaway, delivery), menu management, kitchen display system, inventory tracking, staff management, and sales analytics. The system MUST support both single-location and multi-chain restaurant operations.

## 2. MENU & PRODUCT MANAGEMENT
- **Menu Structure:** Multiple menus (e.g., Breakfast, Lunch, Dinner, Drinks, Kids). Each menu contains categories (Appetizers, Mains, Desserts). Items can belong to multiple categories.
- **Menu Items:** Name, description, price(s), images, ingredients, allergens, nutritional info, prep time, and availability status.
- **Modifiers & Options:** Items can have modifiers (e.g., size: Small/Medium/Large, add-ons: Extra cheese, toppings) with price adjustments. Nested modifiers supported.
- **Price Variants:** Support for different price lists (Weekday/Weekend, Lunch/Dinner pricing). Tax and service charge configurable per item or category.
- **Daily Specials:** Time-based specials and combo deals. Discounted items with configurable time windows.
- **Menu Scheduling:** Automatically switch between menus based on time of day (e.g., Breakfast 07-11, Lunch 11-17, Dinner 17-23).

## 3. ORDER MANAGEMENT (CORE POS)
- **Order Types:** Dine-in (table number), Takeaway (pickup time), Delivery (address, delivery fee), Online order (from website/app).
- **Order Flow:** Create order -> Add items -> Apply modifiers -> Process payment -> Send to kitchen -> Complete.
- **Split Orders:** Split bill by items, by amount, or evenly among guests. Support separate checks per guest at a table.
- **Order Modifications:** Modify items (swap, add note) before preparation begins. Void items with reason tracking.
- **Order Statuses:** Pending -> Confirmed -> Preparing -> Ready -> Served -> Paid -> Completed. Support for "On Hold" and "Cancelled" statuses.
- **Guest Management:** Track guest count, table occupancy time, and guest preferences/notes.

## 4. TABLE MANAGEMENT
- **Floor Plan:** Visual drag-and-drop table layout. Support zones (indoor, outdoor, bar, VIP).
- **Table States:** Available, Occupied, Reserved, Dirty (needs cleaning), Out of Service.
- **Table Reservations:** Book tables with date/time, party size, special requests, and customer info. Reservation reminders.
- **Waitlist:** Digital waitlist with estimated wait time. SMS notifications when table is ready.
- **Table Transfer:** Move orders between tables with audit trail.

## 5. KITCHEN DISPLAY SYSTEM (KDS)
- **Order Display:** Real-time display of incoming orders in the kitchen. Orders sorted by time received and priority.
- **Station Management:** Route orders to specific kitchen stations (Grill, Cold, Pastry, Bar) based on item categories.
- **Order Progress:** Items marked as "In Progress" and "Completed" by kitchen staff. Front-of-house notified when ready.
- **Timers:** Track prep time per item and total order time. Alerts for orders exceeding expected prep time.
- **Void/Out of Stock:** Kitchen can mark items as unavailable (out of stock), instantly reflected in POS.

## 6. PAYMENT PROCESSING
- **Payment Methods:** Cash, Credit/Debit Card, Mobile Payment (Apple Pay, Google Pay), QR Code payment, Gift Card, Loyalty Points.
- **Split Payment:** Pay with multiple methods (e.g., card + cash). Split bill among multiple payers.
- **Tips:** Pre-set tip amounts (%, custom amount) on terminal. Tip pooling configuration for staff.
- **Receipts:** Print thermal receipt (kitchen + customer copy), email receipt, SMS receipt.
- **Refunds:** Full/partial refund processing. Void transactions within configurable time window.

## 7. INVENTORY & SUPPLIER MANAGEMENT
- **Inventory Tracking:** Track ingredient stock levels. Low stock alerts. Automatic stock deduction when orders are completed.
- **Recipe Management:** Define recipes linking menu items to ingredients with quantities (BOM - Bill of Materials).
- **Purchase Orders:** Create POs for suppliers. Track delivery status. Receive and adjust inventory.
- **Stock Adjustments:** Manual stock corrections (waste, theft, spoilage) with reason codes.
- **Cost Tracking:** Track Cost of Goods Sold (COGS) per item. Margin analysis and profitability reports.

## 8. STAFF MANAGEMENT
- **Roles:** Owner, Manager, Head Chef, Cook, Server, Host, Delivery Driver. Granular permissions per role.
- **Shift Management:** Schedule shifts with clock-in/clock-out. Overtime calculation.
- **Time Tracking:** Track employee hours. Integrate with payroll systems.
- **Performance:** Sales per server, order accuracy rate, average order time, customer ratings.

## 9. DELIVERY & ONLINE ORDERS
- **Delivery Zones:** Define delivery zones with distance-based or flat fee structures. Minimum order amount for delivery.
- **Delivery Tracking:** Order assigned to driver. Real-time GPS tracking for customers. Estimated delivery time.
- **Online Ordering:** Integration with website/app for self-ordering. Curbside pickup option.
- **Third-Party Integration:** Integration with Uber Eats, DoorDash, Yemeksepeti, or similar platforms (order relay).

## 10. REPORTING & ANALYTICS
- **Sales Reports:** Daily/Monthly sales summary, peak hours analysis, popular items report, category performance.
- **Financial Reports:** Revenue vs. costs, profit margins, tax reports, tip reports.
- **Labor Reports:** Labor cost percentage, hours worked vs. sales, overtime analysis.
- **Inventory Reports:** Usage reports, waste tracking, stock valuation, reorder suggestions.
- **Customer Insights:** Average spend per guest, return rate, popular order combinations, loyalty program effectiveness.

## 11. LOYALTY & MARKETING
- **Loyalty Program:** Points per spend (configurable rate). Redeem points for discounts or free items. Tiered loyalty (Silver, Gold, Platinum).
- **Gift Cards:** Sell and redeem digital gift cards. Gift card balance checking.
- **Promotions:** Happy hour discounts, BOGO offers, first-order discount, birthday rewards.
- **Customer Database:** Store customer info, order history, preferences, allergies, and notes.

## 12. ADMIN & SYSTEM
- **Multi-Location:** For chains: centralized menu management, location-specific pricing/inventory, cross-location reporting.
- **Offline Mode:** POS MUST work offline with local data sync when connection is restored (critical for POS reliability).
- **Hardware Integration:** Thermal printer, barcode scanner, cash drawer, card terminal integration.
- **Backup & Recovery:** Automated daily backup of sales data. Point-in-time recovery for critical operations.