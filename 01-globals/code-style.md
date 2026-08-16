<!-- 
  PURPOSE OF THIS FILE:
  Establishes code style, naming conventions, and folder structure rules. 
  It prevents the model from making arbitrary naming decisions 
  (e.g., mixing camelCase and PascalCase) and turning the project into spaghetti code.
-->

# NAMING CONVENTIONS AND CODE STYLE

1. **FILES, FOLDERS, AND ASSETS:** All folders, files, and media assets MUST strictly use `kebab-case`.
2. **VARIABLES AND FUNCTIONS:** Use `camelCase`. Function names MUST start with a verb indicating their action. Boolean variables should be prefixed with `is`, `has`, or `should`.
3. **COMPONENTS, CLASSES, AND MODELS:** Use `PascalCase` for React/Vue/Astro components, ES6 Classes, Interfaces, and DTOs.
4. **CONSTANTS:** Global constants and environment variable keys MUST use `UPPER_SNAKE_CASE`.
5. **NO MAGIC NUMBERS:** Do NOT use unexplained "magic numbers" or hardcoded strings in the middle of business logic. Extract them into named constants at the top of the file.
6. **COMMENTS AND DOCUMENTATION:** Do NOT comment on obvious code. Explain the "Why", not the "What". Only complex business logic or specific workarounds require explanatory comments.
7. **CSS CLASS NAMING:** For custom CSS, use BEM methodology (block__element--modifier). For utility-first frameworks (Tailwind), prefer utility classes over custom CSS. Avoid inline styles except for dynamic values.
8. **IMPORT SORTING:** Imports MUST be grouped in this order: 1) External libraries, 2) Internal modules, 3) Relative imports. Use ESLint import/order rule.
9. **FILE EXTENSIONS:** Use .ts / .tsx for TypeScript, .js / .jsx for JavaScript. Always include file extensions in import statements (except when using Node.js type:module with default resolution).
10. **ENVIRONMENT VARIABLES PREFIX:** All environment variables MUST be prefixed according to framework (e.g., VITE_ for Vite, NEXT_PUBLIC_ for Next.js client-side, NUXT_ for Nuxt). Never expose secrets to the client.