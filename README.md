# TrackMyHours 🕒

An AI-powered attendance and Daily Time Record (DTR) management system designed for seamless employee and intern time tracking. 

TrackMyHours features role-based dashboards, biometric facial recognition for secure clock-ins, automated DTR PDF generation, an integrated AI assistant, and an offline-first demo mode for instant evaluation.

## ✨ Key Features

* **Biometric Liveness Detection:** Utilizes edge-based machine learning (`face-api`) to verify user presence during clock-in/out, preventing spoofing.
* **Automated DTR Generation:** Automatically compiles attendance logs into perfectly formatted, print-ready PDF Daily Time Records.
* **Role-Based Access Control:** Dedicated portals and features for Super Admins, Admins, Employees, and Students/Interns.
* **Integrated AI Chatbot:** Powered by Google's Gemini API, providing users with instant assistance regarding their attendance, profile, and app navigation.
* **Zero-Config Demo Mode:** Automatically seeds rich mock data (users, logs, attendance) into browser storage if no cloud database is provided.
* **1-Click Interviewer Login:** Built-in "Demo Accounts" shortcuts on the login screen for frictionless evaluation.

## 🚀 Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
* **Backend:** Node.js, Express.js (integrated within the Vite build process)
* **AI & Machine Learning:** Google Gemini API (`@google/genai`), `@vladmandic/face-api`
* **Storage:** Supabase (Production), LocalStorage/IndexedDB (Demo Fallback)
* **Utilities:** `jspdf` & `jspdf-autotable` (PDF Generation), `lucide-react` (Icons)

## 🔑 Demo Access

To make testing as easy as possible, the login screen includes **Demo Accounts** buttons. Clicking any of these will instantly populate the credentials and log you in:
* **Admin:** Full access to reports, user management, and activity logs.
* **Student:** Intern view with required hours tracking and DTR downloads.
* **Employee:** Standard employee dashboard with assignment tracking.

## 🛠️ Local Development

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trackmyhours.git
   cd trackmyhours
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your API keys. At a minimum, the AI Chatbot requires a Gemini API Key:
   ```env
   # Required for the AI Chatbot
   GEMINI_API_KEY=your_gemini_api_key_here

   # Optional: For persistent cloud database (defaults to local storage if omitted)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the Development Server:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:3000`.*

## ☁️ Deployment

Because this app utilizes a full-stack architecture (an Express server is required to securely proxy requests to the Gemini API without exposing your API key), it is recommended to deploy to a service that supports Node.js backends.

**Recommended Platforms:** [Render.com](https://render.com), [Railway.app](https://railway.app), or Heroku.

**Deployment Steps:**
1. Connect your repository to the hosting platform.
2. Set the Build Command: `npm run build`
3. Set the Start Command: `npm run start`
4. Add your `GEMINI_API_KEY` to the platform's Environment Variables settings.

