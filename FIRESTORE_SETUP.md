# Firestore Security Rules Setup

## Problem: Missing or insufficient permissions

This error occurs because Firestore has security rules that deny all access by default.

## Solution Options

### Option 1: Development Mode (Quick Fix)

**Use this for testing only!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace with these rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all read/write access to rajaoil collection
    match /rajaoil/{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

⚠️ **Warning**: Anyone with your Firebase config can access your data. Only for development!

---

### Option 2: Production Mode (Recommended)

**Secure your admin panel with authentication**

#### Step 1: Enable Firebase Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider
4. Add your admin user:
   - Click **Add user**
   - Enter email and password
   - Click **Add user**

#### Step 2: Update Firestore Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access rajaoil
    match /rajaoil/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Step 3: Add Authentication to Your App

Install Firebase Auth:
```bash
npm install firebase/auth
```

The app will need to be updated with login functionality (see below for implementation).

---

### Option 3: IP-Based Rules (For Internal Tools)

If your admin panel is only accessed from specific locations:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /rajaoil/{document=**} {
      // Add your specific conditions here
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Quick Start (Recommended)

For immediate testing, use **Option 1** (Development Mode).

For production deployment, implement **Option 2** with authentication.

---

## Testing Your Rules

After updating rules:

1. Wait 30-60 seconds for rules to propagate
2. Refresh your admin panel
3. Try fetching data

If you still see errors:
- Check browser console for detailed error messages
- Verify Firebase config in `.env.local`
- Ensure collection name is exactly `rajaoil` (case-sensitive)
