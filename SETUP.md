# Tracker — Setup Guide

Before you can run the app, you need to set up two things:

---

## Step 1: Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → give it a name (e.g. `tracker-app`) → Continue
3. Disable Google Analytics if you don't need it → **Create project**

### Enable Authentication
1. Left sidebar → **Authentication** → **Get started**
2. **Sign-in method** tab → Enable **Email/Password** → Save
3. Enable **Google** → set your project support email → Save

### Enable Firestore
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll add rules later) → Next → Select region → Done

### Get your config keys
1. Click the **gear icon** → **Project settings**
2. Scroll to **"Your apps"** → click the **web icon `</>`**
3. Register the app (any nickname) → copy the `firebaseConfig` object values

### Add Firestore Security Rules
1. Left sidebar → **Firestore** → **Rules** tab
2. Paste the contents of `firestore.rules` from your project folder
3. Click **Publish**

---

## Step 2: Get a Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"** → copy it

---

## Step 3: Fill in your `.env` file

Open `c:\Users\Samarth Kamble\Desktop\Tracker\.env` and replace the placeholders:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tracker-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tracker-app
VITE_FIREBASE_STORAGE_BUCKET=tracker-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_GEMINI_API_KEY=AIzaSy...
```

---

## Step 4: Run the app

```bash
cd "c:\Users\Samarth Kamble\Desktop\Tracker"
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Step 5 (optional): Add localhost to Firebase Auth

If Google Sign-In gives an error:
1. Firebase Console → **Authentication** → **Settings** tab
2. **Authorized domains** → **Add domain** → `localhost`

---

## Project Structure

```
Tracker/
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
├── .env                  ← your API keys (never commit this)
└── index.html
```
