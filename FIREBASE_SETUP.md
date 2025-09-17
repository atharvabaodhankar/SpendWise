# Firebase Setup Guide for SpendWise

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `spendwise-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and add your project's support email

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll add security rules later)
4. Select your preferred location (choose closest to your users)
5. Click "Done"

## 4. Set Up Security Rules

1. In Firestore Database, go to **Rules** tab
2. Replace the default rules with the content from `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Transactions collection - users can only access their own transactions
    match /transactions/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Budgets collection - users can only access their own budget
    match /budgets/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Recurring transactions collection - users can only access their own recurring transactions
    match /recurringTransactions/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Balance adjustments collection - users can only access their own balance adjustments
    match /balanceAdjustments/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

**Important**: Make sure to update your Firestore security rules to include the `balanceAdjustments` collection rules, otherwise the Balance Manager feature will not work.

## 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select **Web** (</> icon)
4. Register your app with nickname: `spendwise-web`
5. Copy the Firebase configuration object

## 6. Configure Environment Variables

Create a `.env` file in your project root with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 7. Test Authentication

1. Run your app: `npm run dev`
2. Try signing up with email/password
3. Try signing in with Google
4. Check Firebase Console > Authentication > Users to see registered users

## 8. Test Firestore

1. After signing in, try adding a transaction
2. Check Firebase Console > Firestore Database > Data to see the transaction
3. Verify that the `userId` field matches your authenticated user's UID

## 9. Deploy (Optional)

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Vercel

```bash
npm run build
npx vercel --prod
```

## Troubleshooting

### Permission Denied Errors

- Ensure you're signed in before accessing Firestore
- Check that security rules are published
- Verify `userId` field is set correctly in documents

### CORS Errors with Google Auth

- Add your domain to authorized domains in Firebase Console > Authentication > Settings > Authorized domains

### Environment Variables Not Loading

- Ensure `.env` file is in project root
- Restart development server after adding `.env`
- Check that variable names start with `VITE_`

## Security Best Practices

1. **Never expose Firebase config in public repositories** - use environment variables
2. **Always use security rules** - never leave Firestore in test mode for production
3. **Validate data on client and server** - add validation rules in Firestore
4. **Use Firebase Auth** - never store passwords or sensitive data in Firestore
5. **Monitor usage** - set up billing alerts and usage quotas

## Collections Structure

### transactions

```javascript
{
  id: "auto-generated",
  userId: "user-uid",
  type: "income" | "expense",
  amount: number,
  category: string,
  description: string,
  date: "YYYY-MM-DD",
  createdAt: timestamp
}
```

### budgets

```javascript
{
  id: "user-uid", // Document ID is the user's UID
  userId: "user-uid",
  monthlyLimit: number,
  updatedAt: timestamp
}
```

### recurringTransactions

```javascript
{
  id: "auto-generated",
  userId: "user-uid",
  type: "income" | "expense",
  amount: number,
  category: string,
  description: string,
  frequency: "weekly" | "monthly" | "yearly",
  nextExecution: timestamp,
  createdAt: timestamp
}
```

### balanceAdjustments

```javascript
{
  id: "auto-generated",
  userId: "user-uid",
  onlineAdjustment: number,
  cashAdjustment: number,
  reason: string,
  previousOnlineBalance: number,
  previousCashBalance: number,
  date: "YYYY-MM-DD",
  createdAt: timestamp
}
```
