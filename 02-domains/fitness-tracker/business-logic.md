<!-- 
  [TR] BU DOSYANIN AMACI:
  Fitness takip platformu için temel iş mantığını, antrenman takibi, beslenme yönetimi ve sosyal özellikleri tanımlar.
  AI'ı egzersiz kütüphanesi, hedef sistemi, ilerleme takibi ve kullanıcı etkileşimi konusunda yönlendirir.
-->

# FITNESS TRACKER BUSINESS LOGIC & REQUIREMENTS (ENTERPRISE EDITION)

## 1. CORE DOMAIN FOCUS
This project is a comprehensive fitness tracking platform. Focus areas: Workout planning & logging, nutrition/diet tracking, body measurement progress, goal setting with milestones, social motivation features, and AI-powered recommendations. The system MUST support both gym-based strength training and cardio/endurance activities.

## 2. USER PROFILE & ONBOARDING
- **Fitness Profile:** On signup, users complete a fitness assessment: age, gender, height, weight, activity level (sedentary to very active), fitness goals (lose weight, build muscle, improve endurance, general health), and experience level (beginner, intermediate, advanced).
- **Body Metrics:** Track weight, body fat percentage, muscle mass, BMI, and custom measurements (chest, waist, hips, arms, thighs). Users can log measurements at any frequency with trend visualization.
- **Health Data Integration:** Optional sync with Apple Health, Google Fit, Fitbit, Garmin, and other wearables for automatic activity and health data import.
- **Profile Customization:** Avatar, bio, fitness interests, and privacy settings controlling what data is visible to followers.

## 3. EXERCISE LIBRARY & WORKOUT PLANNING
- **Exercise Database:** Comprehensive library categorized by muscle group (chest, back, legs, shoulders, arms, core, full body), equipment (barbell, dumbbell, machine, bodyweight, cable, kettlebell, resistance band), and type (strength, cardio, flexibility, balance, plyometric).
- **Custom Exercises:** Users can create custom exercises with name, description, target muscles, equipment, and instructional media (images/videos).
- **Workout Templates:** Pre-built workout plans categorized by goal (strength, hypertrophy, endurance, weight loss) and level. Templates are reusable; users can clone and modify them.
- **Workout Builder:** Drag-and-drop interface to create custom workouts by selecting exercises and defining sets, reps, rest intervals, and order.
- **Exercise Substitution:** Suggest alternative exercises targeting the same muscle group when equipment is unavailable.

## 4. WORKOUT LOGGING
- **Active Workout Session:** Start a workout session with real-time timer, rest interval alerts, and exercise-by-exercise logging. Record sets with weight, reps, RPE (Rate of Perceived Exertion 1-10), and notes per set.
- **Cardio Logging:** For cardio exercises, log duration, distance, pace, heart rate (avg/max), and calories burned.
- **Bodyweight & AMRAP:** Support bodyweight exercises (pull-ups, push-ups) and AMRAP (As Many Reps As Possible) / EMOM (Every Minute On the Minute) formats.
- **Superset & Circuit Support:** Group exercises into supersets (paired alternating) or circuits (3+ exercises cycled). Track circuit rounds and rest between rounds.
- **Workout Notes:** Overall workout notes for mood, energy level, perceived difficulty, and general observations.
- **Auto-Calculate 1RM:** Automatically estimate one-rep max based on weight and reps lifted using standard formulas (Epley, Brzycki).

## 5. NUTRITION & DIET TRACKING
- **Food Database:** Integrated food database with macro breakdown (protein, carbs, fats), calories, fiber, sugar, sodium per serving. Support for barcode scanning and custom food entries.
- **Meal Logging:** Log meals throughout the day categorized as breakfast, lunch, dinner, snacks. Each meal contains multiple food items with serving size and quantity.
- **Daily Macro Targets:** Auto-calculate daily calorie and macro targets based on user profile, goals, and activity level. Users can customize or override targets.
- **Water Intake:** Simple water/fluid intake tracking with daily goal (default: 8 glasses / 2 liters) and quick-add presets.
- **Meal Plans:** Pre-built meal plans for different goals (cutting, bulking, maintenance, keto, vegan). Users can create, save, and share custom meal plans.

## 6. PROGRESS TRACKING & ANALYTICS
- **Progress Photos:** Upload front/side/back progress photos with date stamps. Side-by-side comparison view to visualize changes over time.
- **Weight & Measurement Trends:** Interactive charts showing weight, body fat %, and individual measurement changes over custom time ranges (1 week to 1 year).
- **Strength Progression:** Per-exercise strength graphs showing estimated 1RM progression over time. Compare current performance to previous periods.
- **Workout Consistency:** Calendar heatmap showing workout frequency (similar to GitHub contribution graph). Weekly/monthly streak tracking.
- **Personal Records (PRs):** Automatically detect and celebrate new personal records for estimated 1RM, max reps at weight, longest distance, fastest pace, etc.
- **Export Data:** Users can export all their data (workouts, measurements, nutrition) in CSV/JSON format for portability.

## 7. GOALS & CHALLENGES
- **Goal Types:** Support multiple goal types: Weight Goal (target weight by date), Strength Goal (target 1RM for specific exercise), Habit Goal (workout N times per week), Nutrition Goal (hit calorie/macro targets N days per week), Measurement Goal (target body measurement).
- **Goal Tracking:** Visual progress bar toward goal with milestones. Automatic status updates (on-track, at-risk, off-track) based on trajectory.
- **Smart Reminders:** Configurable workout reminders (specific days/times), nutrition logging reminders, and inactivity nudges.
- **Challenges:** Create or join community challenges (e.g., "30-Day Push-Up Challenge", "Monthly Running Distance"). Track leaderboard rankings and earn completion badges.

## 8. SOCIAL & COMMUNITY FEATURES
- **Follow System:** Follow other users to see their public workouts and achievements in the feed.
- **Activity Feed:** Social feed showing friends' completed workouts (with exercise summary), PRs, goal completions, and challenge participation. Privacy-aware: users control what gets shared.
- **Workout Sharing:** Share completed workouts with notes, photos, and stats. Other users can comment, "like" (fire emoji / kudos), and save workouts to their own templates.
- **Leaderboards:** Gym/global leaderboards for various metrics: most workouts this month, heaviest deadlift, longest streak, most calories burned, etc. Filterable by timeframe and scope (friends, local gym, global).
- **Direct Messaging:** In-app messaging for training partners with support for sharing workouts and meal plans as rich embeds.

## 9. COACH & TRAINER FEATURES (PREMIUM TIER)
- **Coach Dashboard:** Trainers manage multiple clients with dashboard showing each client's recent activity, adherence rate, progress, and upcoming sessions.
- **Program Assignment:** Coaches create and assign workout/nutrition programs to clients with scheduled dates and compliance tracking.
- **Client Check-Ins:** Structured check-in forms (weight, measurements, progress photos, feedback) scheduled weekly/bi-weekly.
- **In-App Communication:** Dedicated coach-client messaging with file sharing (form videos, meal photos).

## 10. ADMIN & SYSTEM CONFIGURATION
- **Content Moderation:** Review reported workouts, comments, and user profiles. Ability to remove inappropriate content and suspend users.
- **Exercise Database Management:** Admin CRUD for the global exercise library including adding new exercises with videos and descriptions.
- **Analytics Dashboard:** Platform metrics: DAU/MAU, total workouts logged, average session duration, popular exercises, subscription revenue, churn rate.
- **Subscription Management:** Tier management (Free, Pro, Premium/Coach), pricing configuration, promotional codes, and billing integration.