# Project Report: AI Activity Tracker & Checklist Web App

**Project Name:** Tracker / My Checklist  
**Developer:** Samarth Kamble  
**Deployment Platform:** Vercel (Production Cloud)  
**Repository:** GitHub (`My_Checklist`)  

---

## 1. Executive Summary & Project Overview

**My Checklist (Tracker)** is an AI-powered personal activity tracking and productivity web application. The application allows users to log their daily activities through natural conversational English (e.g., *"I completed my EL project today at 4"*).

The built-in Google Gemini AI extracts structured metadata (Subject, Activity description, Date, and Time), confirms the action conversationally, persists the record into Firebase Cloud Firestore, organizes activities into an interactive visual document log, and provides one-click export into Google Docs and PDF formats.

---

## 2. Technologies & Tools Used

| Category | Technology / Library | Role in Project |
|---|---|---|
| **Frontend Framework** | React 19 & Vite 8 | Component-driven UI with lightning-fast HMR and optimized production bundles. |
| **Styling & Design** | Tailwind CSS | Modern dark-mode gradient aesthetic with mobile-first responsive layouts. |
| **Authentication** | Firebase Authentication | Secure Google Sign-In (OAuth 2.0 popup) and Email/Password authentication. |
| **Cloud Database** | Firebase Cloud Firestore | Real-time NoSQL database storing user-isolated activity entries and chat messages. |
| **Artificial Intelligence** | Google Gemini AI (`@google/generative-ai`) | NLP using `gemini-3.5-flash-lite` with automated fallback array to parse messages into structured JSON. |
| **Hosting & CI/CD** | Vercel & GitHub | Continuous Deployment pipeline auto-triggered on git push with edge caching. |
| **Export & Documents** | HTML MIME Doc & Print API | Generates downloadable Word/Google Docs (`.doc`) files and formatted PDF reports ready for Google Drive. |

---

## 3. Step-by-Step Implementation Workflow

1. **Project Scaffolding:** Set up a clean React + Vite application with Tailwind CSS, establishing a clean component architecture (`LoginPage`, `ChatPage`, `ViewDoc`, `ExportModal`).
2. **Firebase Configuration:** Configured Firebase SDK client (`firebase.js`), initialized Auth providers (GoogleAuthProvider), and configured Firestore database instances.
3. **Gemini AI Integration:** Built `gemini.js` with structured prompt engineering enforcing strict JSON output for zero-friction entity extraction.
4. **Real-time Data Hooks:** Created `useEntries.js` to handle real-time Firestore synchronization with optimistic in-memory sorting.
5. **Security & Data Isolation:** Authored `firestore.rules` ensuring every user can only read and write their own data (`request.auth.uid == userId`).
6. **Continuous Deployment to Vercel:** Linked GitHub repository to Vercel, resolved routing with `vercel.json`, and configured environment variable injection.
7. **Document Generation & Google Drive Export:** Created `ExportModal.jsx` enabling instant `.doc` downloads and PDF printing with direct links to Google Drive root.

---

## 4. Problems Faced, Root Causes & Detailed Solutions

### Issue 1: `auth/api-key-not-valid`
- **Symptom:** Firebase threw an invalid API key error on the initial login screen.
- **Root Cause & Solution:** The project's `.env` file originally had placeholder text (`your_firebase_api_key`). We gathered the true web credentials from Firebase Project Settings and populated the `.env` file.

### Issue 2: `auth/configuration-not-found`
- **Symptom:** Google Sign-In popup failed immediately upon clicking "Continue with Google".
- **Root Cause & Solution:** In Firebase Console under *Authentication > Sign-in method*, Google sign-in was disabled by default. Enabling Google Sign-In and setting the project support email resolved the error.

### Issue 3: `auth/invalid-continue-uri`
- **Symptom:** Authentication was rejected with an invalid continue URI exception even with localhost whitelisted.
- **Root Cause & Solution:** `VITE_FIREBASE_AUTH_DOMAIN` in `.env` still had the placeholder `your_project.firebaseapp.com` instead of the project ID `my-checklist-30ca5.firebaseapp.com`. Correcting this and adding `http://localhost:5173` to Google Cloud Console OAuth Authorized JavaScript origins resolved it.

### Issue 4: Blank White Screen on Vercel (`auth/invalid-api-key`)
- **Symptom:** The live deployed Vercel site rendered a blank screen; browser console showed uncaught `FirebaseError`.
- **Root Cause & Solution:** Vite bakes `import.meta.env.VITE_*` variables into the JavaScript bundle at *build time*. The initial deployment ran before environment variables were added in Vercel. We added all 7 environment variables into Vercel Settings (targeting Production) and triggered a clean rebuild without build cache.

### Issue 5: `auth/unauthorized-domain` on Vercel
- **Symptom:** Logging into the deployed Vercel URL failed with an unauthorized domain error.
- **Root Cause & Solution:** Firebase Auth blocks logins from unrecognized domains. We added the production Vercel domain to *Firebase Console > Authentication > Settings > Authorized Domains* and Google Cloud Console OAuth origins.

### Issue 6: Model 404 & High Latency (`gemini-2.0-flash`)
- **Symptom:** Chat returned *"Something went wrong. Please check your Gemini API key"*, and responses were taking 20+ seconds or failing.
- **Root Cause & Solution:** `gemini-2.0-flash` was deprecated and returned HTTP 404. We upgraded to `gemini-3.5-flash-lite`, added a multi-model fallback array with 7-second timeouts, and unblocked the UI by executing Firestore database writes in the background.

### Issue 7: Data Lost Upon Page Refresh & Firestore Rules Lockdown
- **Symptom:** Refreshing the browser wiped the conversation and failed to load saved activity entries.
- **Root Cause & Solution:**
  1. Default Firestore rules were set to `allow read, write: if false;`, blocking all reads and writes. We replaced them with authenticated user-isolated rules (`request.auth.uid == userId`).
  2. Chat messages were previously stored only in local component state. We implemented persistence syncing messages to Firestore subcollection `users/{uid}/messages` with browser localStorage caching.

---

## 5. Final Deliverables

- **Live Production App:** Fully operational on Vercel with responsive mobile and desktop support.
- **Instant AI Logging:** Real-time extraction of subject, activity, date, and time within 1–2 seconds.
- **Persistent Activity Log:** Survives page reloads across any device.
- **Comprehensive Exporting:** Native `.doc` and PDF generation with direct integration into Google Drive root.
