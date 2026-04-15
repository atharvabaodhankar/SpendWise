# SpendWise 💰

A comprehensive expense tracking application with social bill-splitting features. Built with React, Firebase, and Vite.

## Local Development

Use Vercel's local runtime when you want frontend routes and serverless functions together:

```bash
vercel dev
```

This project overrides the framework preset in `vercel.json` so Vercel owns routing for both the SPA and `/api/*` functions locally.

If you want an exact production-style local runtime from Vercel build output, use:

```bash
npm run dev:vercel
```

## ✨ Features

### 📊 Expense Tracking
- Track income and expenses across multiple categories
- Dual balance management (Online & Cash)
- Historical transaction support (add past expenses without affecting current balance)
- Monthly budget setting and monitoring
- Daily expense alerts
- Balance alerts when funds are low
- Beautiful data visualizations with charts
- PDF and Excel export for transaction reports

### 👥 Friends & Bill Splitting
- **Friend Management**: Add friends by email, send/receive friend requests
- **Social Profiles**: Public display names for easy friend discovery
- **Expense Splitting**: Split bills equally among friends
- **Smart Tracking**: Your transaction shows your share, but wallet balance reflects total paid
- **Email Notifications**: Friends receive instant email alerts when added to a bill
- **Mirror Transactions**: Split expenses automatically appear in friends' dashboards

### 💸 Debt Management
- **Real-time Debt Tracking**: See who owes you and who you owe at a glance
- **"You Owe" Section**: View all debts you need to settle with a "Mark Paid" button
- **"Owed to You" Section**: Track money owed to you with "Confirm Receipt" button
- **Settlement Flow**: 
  1. Debtor marks debt as paid → Status: `pending_confirmation`
  2. Creditor confirms receipt → Debt settled and removed
- **Transaction Integration**: All debts linked to original split transactions

### 🎨 User Experience
- Modern, premium UI with dark/light theme support
- Glassmorphism design elements
- Smooth animations and micro-interactions
- Responsive design for mobile and desktop
- Custom themed modals (including delete confirmation)
- Intuitive navigation with mobile menu

## 🗄️ Firebase Architecture

### Firestore Collections

#### `users`
Public profile information for friend discovery.
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string (optional),
  createdAt: timestamp
}
```
**Security**: Authenticated users can read all; only owner can write own document.

#### `friendRequests`
Tracks pending, accepted, and rejected friend requests.
```javascript
{
  senderId: string,
  senderEmail: string,
  receiverId: string,
  receiverEmail: string,
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: timestamp
}
```
**Security**: Users can only read their own requests (sent or received).

#### `friends` (subcollection)
Path: `/users/{userId}/friends/{friendId}`
```javascript
{
  friendId: string,
  email: string,
  displayName: string,
  createdAt: timestamp
}
```
**Security**: Users can read/write their own friends subcollection.

#### `transactions`
Core expense/income tracking with split support.
```javascript
{
  userId: string,
  amount: number,              // User's share if split, full amount otherwise
  totalPaid: number (optional), // Only present for split bills - total amount paid
  type: 'income' | 'expense',
  category: string,
  description: string,
  date: string (YYYY-MM-DD),
  paymentMethod: 'online' | 'cash' | 'owed',
  isSplit: boolean,
  splitWith: array (optional),  // Deprecated - use debts collection instead
  paidBy: string (optional),    // User ID of payer
  affectCurrentBalance: boolean,
  isBalanceAdjustment: boolean,
  isHistorical: boolean,
  createdAt: timestamp
}
```
**Security**: Users can only access their own transactions.

#### `debts`
Tracks individual debts between users.
```javascript
{
  debtorId: string,      // User who owes money
  creditorId: string,    // User who is owed money
  amount: number,
  description: string,
  transactionId: string, // Reference to original transaction
  status: 'unpaid' | 'pending_confirmation' | 'paid',
  createdAt: timestamp
}
```
**Security**: Read/write access for both debtor and creditor.

#### `currentBalances`
Path: `/currentBalances/{userId}`
```javascript
{
  online: number,
  cash: number,
  lastUpdated: timestamp,
  updatedBy: string
}
```

#### `userPreferences`
Path: `/userPreferences/{userId}`
```javascript
{
  showBalances: boolean,
  displayName: string,
  monthlyBudget: number (optional),
  lowBalanceThreshold: number (optional),
  dailyExpenseLimit: number (optional)
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - public read, owner write
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Friends subcollection
      match /friends/{friendId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null && 
                      (request.auth.uid == userId || request.auth.uid == friendId);
      }
    }
    
    // Friend requests
    match /friendRequests/{requestId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.senderId ||
        request.auth.uid == resource.data.receiverId
      );
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.receiverId;
    }
    
    // Debts collection
    match /debts/{debtId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == resource.data.debtorId ||
        request.auth.uid == resource.data.creditorId
      );
      allow create: if request.auth != null;
    }
    
    // Transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Current balances
    match /currentBalances/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // User preferences
    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## 📧 Email Notifications

The app uses Gmail SMTP via Nodemailer to send email notifications. Supported notification types:

### Friend Request
Sent when someone sends you a friend request.
```
Subject: Friend Request on SpendWise
Body: [SenderName] sent you a friend request on SpendWise!
```

### Bill Split
Sent when someone adds you to a split bill.
```
Subject: You've been added to a bill on SpendWise
Body: [SenderName] added you to a bill of ₹[Amount] for [Description].
Your share: ₹[Split Amount]
```

**Setup**: Configure environment variables:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

**API Endpoint**: `/api/send-email-gmail.js` (Vercel serverless function)

## 🧩 Key Components

### Friend Management
- **`FriendList.jsx`**: Displays all accepted friends
- **`AddFriendModal.jsx`**: Search users by email & send friend requests
- **`FriendRequests.jsx`**: View and manage incoming friend requests
- **`FriendsManagerModal.jsx`**: Tabbed interface combining all friend features + debts
- **`DebtList.jsx`**: Shows "You Owe" and "Owed to You" sections with settlement actions

### Transaction Management
- **`TransactionForm.jsx`**: Add income/expense with split option
- **`TransactionList.jsx`**: Paginated list of all transactions
- **`Dashboard.jsx`**: Main hub with charts, balance, and transaction logic

### UI Elements
- **`DeleteConfirmationModal.jsx`**: Themed confirmation dialog for deletions
- **`SettingsModal.jsx`**: Profile settings including display name
- **`Notification.jsx`**: Toast notifications for user feedback

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Firebase project with Firestore enabled
- Gmail account with App Password (for notifications)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/spendwise.git
cd spendwise
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create `src/firebase.js` with your Firebase config
   - Update Firestore security rules from `firestore.rules`

4. Configure environment variables (`.env`):
```env
GMAIL_USER=spendwise205@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

5. Run development server:
```bash
npm run dev
```

6. (Optional) Run Vercel serverless functions locally:
```bash
vercel dev
```

## 🧪 Testing Email Notifications

Use the included test scripts:

```bash
# Test Gmail connection
node scripts/test-gmail.js recipient@example.com

# Direct test (bypasses Vercel)
node scripts/direct-test.js recipient@example.com
```

## 📱 Usage Flow

### Setting Up Your Profile
1. Sign up / Login
2. Go to Settings → Profile
3. Set your Display Name (visible to friends)

### Adding Friends
1. Click **Friends** icon in navigation
2. Go to "Add Friend" tab
3. Enter friend's email
4. Send request
5. Friend accepts from their "Requests" tab

### Splitting a Bill
1. Click **Add Expense**
2. Enter amount, category, description
3. Toggle **"Split with Friends"**
4. Select friends from your friend list
5. Click **Save Expense**
6. Friends receive email notification & transaction appears in their dashboard

### Settling Debts
1. Go to **Friends** → **Debts** tab
2. **If you owe**: Click "Mark Paid" after paying offline
3. **If owed to you**: Click "Confirm" when you receive payment
4. Debt is removed and settled

## 🎨 UI/UX Highlights

- **Premium Design**: Glassmorphism, smooth gradients, custom CSS variables
- **Responsive**: Mobile-first design with hamburger menu
- **Animations**: Micro-interactions on hover, page transitions
- **Themed Modals**: Consistent design language across all dialogs
- **Smart Balance Display**: Toggle to show/hide balances
- **Export Options**: PDF and Excel reports for all transactions

## 🔒 Security

- Firebase Authentication for user management
- Row-level security rules in Firestore
- Private data (balances, preferences) isolated per user
- Public profiles limited to display name and email
- Friend requests validated on both client and server

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS with CSS custom properties
- **Backend**: Firebase (Firestore, Auth)
- **Serverless**: Vercel Functions
- **Email**: Nodemailer + Gmail SMTP
- **Charts**: Recharts
- **Icons**: Lucide React
- **Export**: jsPDF, xlsx

## 📄 License

MIT License - feel free to use this project for learning or personal use.

## 🙏 Acknowledgments

Built with ❤️ using modern web technologies. Special thanks to the Firebase and React communities.
