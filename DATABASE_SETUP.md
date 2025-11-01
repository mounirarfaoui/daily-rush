# Database Setup Guide

## Current Status
Currently using **localStorage** (client-side only). Data is stored in the browser and not synced across devices.

## Database Options

### Option 1: Firebase Firestore (Recommended) ⭐
**Pros:**
- Easy integration with Google OAuth (same provider)
- Real-time synchronization
- Free tier (generous limits)
- No backend code needed
- Automatic offline support
- Scalable

**Cons:**
- Requires Firebase account
- Need to configure security rules

### Option 2: Supabase
**Pros:**
- PostgreSQL database (SQL)
- Real-time features
- Free tier available
- Good documentation

**Cons:**
- Requires separate account setup
- More complex initial setup

### Option 3: Custom Backend + Database
**Pros:**
- Full control
- Custom features

**Cons:**
- Requires server hosting
- More complex setup
- Need to manage security

## Recommended: Firebase Firestore Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: **"daily-rush"** (or your choice)
4. Disable Google Analytics (optional, can enable later)
5. Click **"Create project"**

### Step 2: Enable Firestore

1. In Firebase Console, go to **"Build" > "Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll add security rules later)
4. Choose a location (closest to you)
5. Click **"Enable"**

### Step 3: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **Web icon** (`</>`)
4. Register app name: **"Daily Rush Web"**
5. Copy the **firebaseConfig** object

### Step 4: Install Firebase SDK

Add Firebase to your project:
- Option A: CDN (no build step needed)
- Option B: npm (if using build tools)

### Step 5: Update Security Rules

1. Go to **Firestore Database > Rules**
2. Update rules to allow authenticated users only:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's tasks subcollection
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Data Structure

### Users Collection
```
users/{userId}
  - email: string
  - name: string
  - picture: string
  - customName: string (optional)
  - customPicture: string (optional)
  - totalPoints: number
  - createdAt: timestamp
```

### Tasks Subcollection
```
users/{userId}/tasks/{taskId}
  - text: string
  - difficulty: string (easy/medium/hard/expert)
  - completed: boolean
  - pointsEarned: boolean
  - createdAt: timestamp
  - completedAt: timestamp (optional)
```

## Migration from localStorage

The app will:
1. Check for existing localStorage data
2. Migrate to Firebase on first login
3. Sync in real-time after migration

## Quick Setup Steps

### 1. Get Firebase Config

After creating your Firebase project and enabling Firestore:

1. Go to **Project Settings** > **Your apps** > **Web app**
2. Copy the `firebaseConfig` object
3. Open `firebase-config.js` in your project
4. Replace the placeholder values with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",  // Your API key
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### 2. Enable Firebase Authentication

Since you're using Google OAuth:

1. Go to **Authentication** > **Sign-in method**
2. Enable **Google** provider
3. Add your authorized domains (localhost for development)

### 3. Set Firestore Security Rules

Go to **Firestore Database** > **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's tasks subcollection
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

**Important:** After setup, you'll need to integrate Firebase Auth with Google Sign-In. The current implementation uses Google Identity Services directly, so you'll need to:

**Option A:** Continue using Google Identity Services + Firestore (current approach)
- Tasks are linked by user's Google `sub` ID
- No Firebase Auth needed
- Data structure: `users/{googleSub}/tasks/{taskId}`

**Option B:** Switch to Firebase Auth (more integrated)
- Requires additional code changes
- Better security with Firebase rules
- Unified authentication system

The current implementation uses **Option A** which works without Firebase Auth.

