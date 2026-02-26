# 🧘‍♀️ No Panic (Bez Paniki) — Mental Health AI Assistant (Telegram Mini App)

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/Telegram-Mini_App-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="TWA">
  <img src="https://img.shields.io/badge/Serverless-Google_Apps_Script-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="GAS">
  <img src="https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
</p>

> **⚠️ Medical Disclaimer:** This project is a Proof of Concept built for educational and personal purposes. It does not replace professional psychiatric help. See [DISCLAIMER.md](DISCLAIMER.md) for more details.

## 📖 The Story Behind the Project
I initially built this application as a personal project **to help my brother cope with panic attacks**. I wanted to create an accessible, immediate, and calming tool that he could keep in his pocket (integrated into Telegram). 

It has since evolved into a comprehensive Mental Health application featuring AI support, Cognitive Behavioral Therapy (CBT) practices, mood tracking, and grounding techniques.

*Note: The current UI is in Russian as it was built for my family, but the codebase and documentation are maintained in English.*

## 📱 Features Walkthrough
<div align="center">
  <!-- Add your 3 screenshots here -->
  <img src="screenshot1.png" width="200" alt="Main Dashboard" />
  <img src="screenshot2.png" width="200" alt="AI Chat" />
  <img src="screenshot3.png" width="200" alt="Breathing Exercises" />
</div>

* **🤖 AI Empathy Chat:** Context-aware AI assistant (powered by Gemini 2.5) with voice recognition and TTS (OpenAI).
* **🌬 Grounding & Breathing:** Interactive SVG-based breathing animations (e.g., 4-7-8 technique).
* **🧠 CBT Thought Diary:** A digital tool to log negative thoughts and receive AI-generated alternative rational perspectives.
* **📊 Analytics:** Mood and sleep tracking visualization using native Canvas APIs.

## 🛠 Tech Stack & Architecture

I chose a **Zero-Cost Serverless Architecture** for the MVP to validate the product without infrastructure overhead, while maintaining high security and performance standards.

### Frontend
* **Vanilla JavaScript (ES6+)**: Built without heavy frameworks to ensure maximum performance and minimal bundle size inside the Telegram WebView.
* **CSS3 Custom Properties**: Fully responsive UI with a seamless Light/Dark mode linked to the Telegram client theme (Glassmorphism design).
* **Telegram Web App API**: Deep integration with Telegram's ecosystem.

### Backend (Serverless) & Database
* **Google Apps Script (GAS)**: Acts as a serverless webhook provider handling REST API requests and Telegram Bot events.
* **Firebase Realtime Database**: Fast, NoSQL data storage for user profiles, transaction logs, and chat histories.

### 🧠 Engineering Highlights (Backend)
I focused heavily on security and data integrity in the backend implementation (see `/backend/gas_backend.js`):
1. **Strict Authentication (HMAC-SHA256):** Implemented cryptographic verification of the Telegram `initData` to prevent payload spoofing. Requests without a valid Telegram signature are dropped.
2. **Concurrency Handling:** Used `LockService` (Mutex) to implement atomic operations for balance deductions (`atomicSpendCredit`). This prevents race conditions if a user sends multiple requests simultaneously.
3. **Failover & High Availability:** Built a fallback mechanism (`callGeminiWithFailover`) that automatically switches between free and paid API tiers if rate limits (HTTP 429) are hit.
4. **Caching Layer:** Utilized `CacheService` to minimize expensive database reads and external API calls (e.g., caching channel subscription status).

## 📁 Project Structure
```text
📦 bez-paniki
 ┣ 📂 frontend
 ┃ ┣ 📂 css/styles.css      # UI Kit, Themes, CSS Animations
 ┃ ┣ 📂 js/                 # Modular Vanilla JS (chat, breathing, cbt, etc.)
 ┃ ┗ 📜 index.html          # Main SPA entry point
 ┣ 📂 backend
 ┃ ┗ 📜 gas_backend.js      # Serverless backend (Auth, API integrations, Firebase REST)
 ┣ 📜 DISCLAIMER.md         # Legal Medical Disclaimer
 ┗ 📜 README.md


🚀 Roadmap

i18n Implementation: Extract hardcoded texts into a localization dictionary (EN/DE/RU).

Backend Migration: Port the Google Apps Script logic to a structured Node.js / NestJS backend as the user base grows.

Database Migration: Move from Firebase to PostgreSQL for advanced relational analytics.

