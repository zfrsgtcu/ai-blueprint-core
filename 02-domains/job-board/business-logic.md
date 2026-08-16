<!-- 
  [TR] BU DOSYANIN AMACI:
  İş ilanı platformu için temel iş mantığını, başvuru yönetimini ve eşleştirme algoritmalarını tanımlar.
  AI'ı iş ilanları, özgeçmiş yönetimi, eşleştirme ve işe alım süreçleri konusunda yönlendirir.
-->

# JOB BOARD BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a modern job board and recruitment platform. Focus areas: Job listing management, applicant tracking (ATS), resume/CV parsing, smart job matching, and employer branding. The system MUST serve both job seekers and employers/recruiters.

## 2. JOB LISTING MANAGEMENT
- **Job Types:** Full-time, Part-time, Contract, Freelance, Internship, Temporary, Remote/Hybrid/On-site.
- **Job Categories:** Industry-based categories (Technology, Healthcare, Finance, Education, etc.) with subcategories.
- **Listing Structure:** Each job MUST include: title, company, location (or remote), description (Markdown), requirements, responsibilities, benefits, salary range, application URL/email, and expiration date.
- **Listing Statuses:** Draft, Published, Paused, Filled, Expired, Archived. Expired/paused jobs are hidden from search.
- **Promoted/Featured Listings:** Support paid promotions where featured listings appear at top of search results with a "Featured" badge.
- **Listing审批 (Approval):** New listings from unverified employers may require manual or auto-approval before going public.

## 3. SEARCH & DISCOVERY
- **Full-Text Search:** Index job title, company name, description, and required skills. Support filtering by: location (radius-based), job type, category, salary range, experience level, date posted.
- **Saved Searches:** Users can save search criteria and receive email alerts when new matching jobs are posted.
- **Keyword Suggestions:** Auto-complete and suggest relevant job titles, skills, and locations during search.
- **Related Jobs:** On a job detail page, show related positions based on category, skills, and company.

## 4. APPLICANT TRACKING SYSTEM (ATS)
- **Application Lifecycle:** Applied -> Under Review -> Screening -> Interview -> Offer -> Hired -> Rejected. Custom stages configurable by employer.
- **Resume Parsing:** Automatically parse uploaded resumes (PDF, DOCX) to extract: name, email, phone, skills, experience, education, and certifications.
- **Cover Letters:** Support optional cover letter submission with formatting.
- **Application Notes:** Employers can add internal notes, ratings, and tags to each applicant profile.
- **Bulk Actions:** Employers can change status, send messages, or reject multiple applicants at once.
- **Interview Scheduling:** Integrated calendar with available time slots. Send automated interview invitations with calendar links (Google Meet, Zoom, etc.).

## 5. COMPANY & EMPLOYER FEATURES
- **Company Profile:** Company page with logo, banner, description, culture, benefits, team photos, and social links.
- **Multiple Users:** Company accounts can have multiple team members with roles (Admin, HR, Hiring Manager, Viewer).
- **Branded Career Page:** Generate a customizable subdomain career page (e.g., company.jobboard.com) showing all active listings.
- **Analytics Dashboard:** Employers can view: total views, applications per job, source tracking, time-to-hire, and applicant demographics.

## 6. JOB SEEKER FEATURES
- **User Profile:** Professional profile with skills, experience, education, certifications, portfolio links, and preferred job preferences.
- **Resume Builder:** Built-in resume builder with templates. Auto-fill from profile data. Export to PDF.
- **Job Alerts:** Email/push notifications for new jobs matching saved searches and profile preferences.
- **Saved Jobs:** Bookmark jobs for later viewing.
- **Application History:** Track all submitted applications with current statuses.

## 7. NOTIFICATIONS & COMMUNICATIONS
- **Email Templates:** Application confirmation, status change, interview invitation, rejection (with feedback), new applicant alert to employer.
- **In-App Messaging:** Secure messaging system between employers and candidates, preserving privacy until both parties engage.
- **Push Notifications:** Real-time alerts for application updates and new job matches.

## 8. ADMIN & MODERATION
- **Listing Moderation:** Review flagged or reported listings, approve pending listings, manage spam.
- **User Management:** Suspend employer or candidate accounts for policy violations.
- **Payment & Subscription:** Handle featured listing payments (one-time) or employer subscription plans (monthly/yearly).
- **Platform Analytics:** Total listings, active users, application volume, featured listing revenue, and system performance metrics.