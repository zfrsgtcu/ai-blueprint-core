<!-- 
  [TR] BU DOSYANIN AMACI:
  Gayrimenkul / emlak portalı platformu için temel iş mantığını tanımlar.
  AI'ı mülk listeleme, harita entegrasyonu, sanal turlar ve emlakçı yönetimi konusunda yönlendirir.
-->

# REAL ESTATE PORTAL BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a comprehensive real estate listing portal for property sales, rentals, and commercial leasing. Focus areas: Property listings with rich media, map-based search, agent/broker management, mortgage calculators, and appointment scheduling. The system MUST support both B2C (buyers/renters) and B2B (agents/agencies) workflows.

## 2. PROPERTY LISTINGS
- **Property Types:** Residential (Apartment, House, Villa, Studio, Penthouse), Commercial (Office, Retail, Warehouse, Industrial), Land (Residential plot, Commercial plot, Agricultural), Multi-family (Building, Complex).
- **Listing Purpose:** For Sale, For Rent (long-term), For Rent (short-term/vacation), For Lease.
- **Property Details:** Price (with currency), area (sqm/sqft), bedrooms, bathrooms, floor number, total floors, year built, condition (new, renovated, good, needs work), parking, furnishing status (furnished, semi-furnished, unfurnished).
- **Amenities & Features:** Swimming pool, gym, security, elevator, balcony, garden, central AC, heating, smart home, storage room, etc. Amenities as filterable checkboxes.
- **Rich Media:** Multiple photos (with ordering and cover photo), floor plan images, virtual tour (3D walkthrough URL), video tour (YouTube/Vimeo), drone footage.
- **Listing Statuses:** Active, Under Offer, Sold/Rented, Off Market, Pending. Date of status change is tracked.
- **Price History:** Track price changes over time with dates. Show price trend indicator on listing page.

## 3. MAP-BASED SEARCH & DISCOVERY
- **Interactive Map:** Leaflet/Mapbox/Google Maps integration with property markers. Cluster markers at zoom levels. Heat map for price density.
- **Search Filters:** Location (text autocomplete + radius), property type, purpose, price range (min-max slider), area range, bedrooms, bathrooms, amenities, furnishing, year built, listing date.
- **Draw Search:** Allow users to draw a polygon on the map to search within a custom area.
- **Neighborhood Insights:** Show nearby points of interest (schools, hospitals, supermarkets, metro stations, parks). Walk score, transit score. Crime statistics (if available).
- **Saved Searches:** Users can save search criteria and receive email alerts for new matching properties.

## 4. AGENT & AGENCY MANAGEMENT
- **Agent Profiles:** Name, photo, contact info, license number, languages spoken, specialization areas, experience (years), recent sales, certifications, reviews/ratings.
- **Agency Profiles:** Agency name, logo, cover photo, about, team members (agents), total listings, office locations, website.
- **Agent Dashboard:** Manage listings, track inquiries/scheduled viewings, response rate metrics, and performance analytics.
- **Agent Verification:** Verified badge for agents who have completed identity verification (KYC).
- **Lead Generation:** Agents receive leads from inquiries and viewing requests. Lead tracking with status (new, contacted, qualified, converted, lost).

## 5. VIEWING & APPOINTMENTS
- **Schedule Viewing:** Buyers/renters can request a viewing with preferred date/time range. Agent confirms and sends calendar invite.
- **Virtual Tour Booking:** Schedule a live video tour (via Zoom, Google Meet) with the agent.
- **Instant Viewing:** For select properties, "Available Now" status with instant booking (unlock via one-time code for self-touring).
- **Open House Events:** Agents can schedule open house events with date/time range. Users can RSVP.
- **Appointment Reminders:** Automated reminders (email + push) for scheduled viewings to both agent and client.

## 6. COMPARISON & FINANCIAL TOOLS
- **Property Comparison:** Side-by-side comparison of up to 5 properties. Compare price, area, features, and location.
- **Mortgage Calculator:** Calculate monthly payments based on price, down payment, interest rate, and loan term. Show amortization schedule.
- **Affordability Calculator:** Estimate how much the user can afford based on annual income, existing debts, and down payment.
- **Rental Yield Calculator:** For investment properties, calculate gross rental yield and ROI.
- **NEAR Score:** (Notable, Exceptional, Average, Reasonable) - automated property valuation relative to similar listings in the area.

## 7. FAVORITES & SHORTLIST
- **Favorites:** Users can save/bookmark properties to favorites list.
- **Shortlists:** Users can create named shortlists (e.g., "Properties to Visit", "Investment Picks"). Share shortlist via link.
- **Recently Viewed:** Track and display recently viewed properties.

## 8. NOTIFICATIONS & ENGAGEMENT
- **Buyer Alerts:** New matching listings, price drops, status changes, saved search results.
- **Agent Notifications:** New inquiry, viewing request, message received, listing expiry reminder.
- **In-App Messaging:** Secure messaging between buyers and agents. Template messages for viewing requests and inquiries.
- **Property Share:** Share property listings via social media, email, or copy link. Track share count.

## 9. ADMIN & MODERATION
- **Listing Moderation:** Review and approve/reject property listings. Flag suspicious or duplicate listings.
- **User Management:** Manage agents, agencies, and buyer accounts. Verify agent credentials.
- **Subscription Plans:** Agent/agency subscription tiers (Free: limited listings, Pro: unlimited, Enterprise: agency-wide).
- **Feature Upgrades:** Paid upgrades for featured listings, priority placement, and verified badge.
- **Platform Analytics:** Total listings, active agents, search trends, popular areas, conversion metrics, revenue analysis.