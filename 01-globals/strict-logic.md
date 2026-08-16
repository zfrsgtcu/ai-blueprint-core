<!-- 
  PURPOSE OF THIS FILE:
  Defines universal code logic and state management rules. 
  It prevents the model from mutating data and enforces clean code principles 
  such as Error Handling and Early Returns (Guard Clauses).
-->

# UNIVERSAL LOGIC AND STATE MANAGEMENT RULES

These rules apply strictly to ALL frameworks and architectures.

1. **IMMUTABILITY AND STATE MUTATION:** NEVER mutate a state variable, array, or object directly. Always create a new reference using spread operators (`...`), `.filter()`, or `.map()` before updating state. When using Immer (or similar) in state libraries (Redux Toolkit, Zustand, Pinia), mutable-style code is allowed ONLY inside Immer's produce function. Outside, strict immutability applies.
2. **ARRAY OPERATIONS:** When searching, deleting, or conditionally rendering arrays, you MUST use `.filter()`, `.map()`, or `.reduce()`. Empty state handling must be tied to strict conditional rendering.
3. **EARLY RETURNS (GUARD CLAUSES):** Avoid deeply nested `if/else` blocks. Use early returns (Guard Clauses) at the top of functions to handle edge cases, null values, or errors immediately.
4. **SAFE OBJECT ACCESS:** Always use Optional Chaining (`?.`) and Nullish Coalescing (`??`) for deep object properties.
5. **ASYNC/AWAIT AND ERROR HANDLING:** Prefer try/catch with async/await. If you must use promise chains, ALWAYS end with `.catch()` and handle errors. Never ignore rejected promises.
6. **MEMORY LEAK PREVENTION:** Any event listener, WebSocket connection, or interval/timeout created in a component MUST be cleared/removed when the component unmounts or is destroyed.
7. **EFFECT DEPENDENCY ARRAYS:** All reactive effects (React useEffect, Vue watch, Svelte $effect) MUST have correct dependency arrays. ESLint rules for exhaustive-deps must be enforced to prevent stale closures and infinite loops.
8. **MEMOIZATION:** Expensive computations, callbacks, and large objects passed to child components MUST be memoized using useMemo / useCallback (React), computed (Vue), or derived (Svelte) to prevent unnecessary re-renders.