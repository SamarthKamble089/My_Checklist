# My Checklist — Setup Guide

Before you can run the app, you need to set up two external services: **Firebase** and **Gemini AI**.

---

## Prerequisites

- [Node.js](https://nodejs.org) installed (v18 or later)
- A Google account

---

## Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd My_Checklist
npm install
```

---

## Step 2: Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → give it a name → Continue
3. Disable Google Analytics if you don't need it → **Create project**

### Enable Authentication
1. Left sidebar → **Authentication** → **Get started**
2. **Sign-in method** tab → Enable **Email/Password** → Save
3. Enable **Google** → set your project support email → Save

### Enable Firestore
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in test mode** → Next → Select region → Done

### Add Firestore Security Rules
1. Left sidebar → **Firestore** → **Rules** tab
2. Paste the contents of `firestore.rules` from this project
3. Click **Publish**

### Get your Firebase config keys
1. Click the **⚙️ gear icon** → **Project settings**
2. Scroll to **"Your apps"** → click the **web icon `</>`**
3. Register the app (any nickname) → copy the `firebaseConfig` values

### Add localhost to Authorized Domains
1. Firebase Console → **Authentication** → **Settings** tab
2. **Authorized domains** → **Add domain** → type `localhost` → Add

### Add localhost to Google Cloud OAuth
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Select your Firebase project from the top dropdown
3. Left sidebar → **APIs & Services** → **Credentials**
4. Click your **OAuth 2.0 Client ID**
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
6. Click **Save**

---

## Step 3: Get a Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"** → copy it (free, no credit card needed)

---

## Step 4: Create your `.env` file

Create a file named `.env` in the project root and fill in your values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_GEMINI_API_KEY=AIzaSy...
```

> ⚠️ Make sure `VITE_FIREBASE_AUTH_DOMAIN` is `your-project-id.firebaseapp.com` — not a placeholder!

---

## Step 5: Run the app

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
My_Checklist/
├── src/
│   ├── App.jsx           ← root, handles auth state
│   ├── firebase.js       ← Firebase init
│   ├── gemini.js         ← Gemini AI parsing
│   ├── useEntries.js     ← Firestore entries hook
│   ├── index.css         ← Tailwind base styles
│   └── components/
│       ├── LoginPage.jsx ← login/signup screen
│       ├── ChatPage.jsx  ← main chat UI
│       └── ViewDoc.jsx   ← activity log viewer
├── firestore.rules       ← copy these to Firebase console
├── .env                  ← your API keys (never commit this!)
└── index.html
```
