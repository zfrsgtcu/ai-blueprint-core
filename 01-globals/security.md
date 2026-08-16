<!-- 
  PURPOSE OF THIS FILE:
  Enforces strict security standards. 
  It mandates that passwords and API keys are never hardcoded, 
  user inputs are sanitized against SQL Injection or XSS, 
  and unnecessary data exposure is prevented.
-->

# SECURITY AND DATA HANDLING STANDARDS

1. **ENVIRONMENT VARIABLES AND SECRETS:** API keys, Database Connection Strings, JWT Secrets, and external service tokens MUST NEVER be hardcoded. They MUST always be read from `.env` files or the environment process.
2. **PREVENTING CROSS-SITE SCRIPTING (XSS):** All user-generated content MUST be sanitized before being rendered into the DOM. Using `dangerouslySetInnerHTML` (React) or `v-html` (Vue) is STRICTLY FORBIDDEN unless the input is passed through a robust sanitizer library (like DOMPurify).
3. **PREVENTING SQL/NOSQL INJECTION:** You MUST use ORM/QueryBuilders (Entity Framework, Prisma, Mongoose) or Parameterized Queries. String concatenation or template literals for SQL/NoSQL queries are STRICTLY FORBIDDEN.
4. **DATA EXPOSURE PREVENTION:** Never log sensitive user data (passwords, credit card numbers, PII) to the console or file system. Ensure API responses only return the necessary fields.
5. **AUTHENTICATION AND AUTHORIZATION:** Assume every API endpoint is public unless explicitly protected. Always verify the user's role and permissions on the server side before executing database mutations or returning sensitive data.
6. **CSRF PROTECTION:** All state-changing HTTP methods (POST, PUT, DELETE, PATCH) MUST include CSRF tokens. For SPAs, use double-submit cookie pattern or framework-specific anti-forgery tokens.
7. **CONTENT SECURITY POLICY (CSP):** Production builds MUST include strict CSP headers to prevent XSS and data injection. Use 'default-src self' and limit script-src to trusted CDNs.
8. **RATE LIMITING:** Authentication, password reset, and sensitive API endpoints MUST implement rate limiting (e.g., 5 requests per minute per IP) to prevent brute-force attacks.
9. **JWT SECURITY:** JWT tokens MUST be stored in httpOnly cookies (not localStorage or sessionStorage) to prevent XSS theft. Set short expiration (e.g., 15 min) and implement refresh token rotation.
10. **FILE UPLOAD SECURITY:** File uploads MUST validate file type (MIME/extension), limit file size, and scan for malware. Store uploaded files outside the webroot and use random filenames.
11. **HELMET / SECURITY HEADERS:** Use Helmet.js or equivalent middleware to set secure HTTP headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy).