# SpendWise Flutter App 📱

The official cross-platform mobile application for **SpendWise** — Personal Expense Tracking redefined as a high-precision Statement ledger.

Built with **Flutter & Dart**, sharing the same **Firebase Firestore & Authentication backend** as the SpendWise web app for real-time synchronization across all your devices.

---

## 📸 Features

- **🏛️ Dual Balance Tracking**: Unified view of both online/bank balances and physical cash with gradient wallet cards.
- **📊 Real-time Statement Ledger**: Swipe-to-delete transactions, pagination, category tagging, and tabular amount formatting.
- **👥 Social Bill Splitting & Debts**: Add friends by email, send requests, track who owes what, and mark/confirm settled payments.
- **🎯 Monthly Budget Goals**: Dynamic progress bar, passbook-style dotted metrics, and customizable monthly limits.
- **📈 Advanced Analytics**: Category breakdown pie charts, monthly spending bar charts, and detailed data tables using `fl_chart`.
- **🤖 AI Finance Copilot**: Integrated chatbot connecting directly to your Firebase ledger to answer questions and execute actions.
- **🌗 Statement Theme**: Custom dark/light mode adhering to the SpendWise design system (Navy, Slate, Emerald, Rose).
- **📋 Statement Export**: Instant summary generation & clipboard copy for sharing or offline records.

---

## 📂 Project Architecture

```
spendwise_flutter/
├── assets/                               # Static assets and icons
├── lib/
│   ├── main.dart                         # Entry point & AuthGate routing
│   ├── firebase_options.dart             # Firebase initialization configuration
│   ├── theme/
│   │   └── app_theme.dart                # Statement theme (Navy / Emerald / Slate)
│   ├── models/
│   │   └── transaction_model.dart        # Firestore transaction data schema
│   ├── providers/
│   │   ├── auth_provider.dart            # Firebase Auth & Google Sign-In state
│   │   ├── theme_provider.dart           # Light/Dark mode state management
│   │   └── transactions_provider.dart    # Real-time Firestore stream listeners
│   ├── services/
│   │   └── ai_chat_service.dart          # HTTP client for SpendWise Vercel AI API
│   ├── screens/
│   │   ├── splash_screen.dart            # App loading indicator
│   │   ├── home_screen.dart              # Landing page with hero & features
│   │   ├── login_screen.dart             # Email/Password + Google authentication
│   │   ├── signup_screen.dart            # User registration
│   │   ├── dashboard_screen.dart         # Main statement dashboard
│   │   └── analytics_screen.dart         # Pie & bar charts + category tables
│   ├── widgets/
│   │   ├── spendwise_logo.dart           # Custom vector SpendWise monogram
│   │   ├── balance_cards.dart            # Total, Online, and Cash wallet cards
│   │   ├── balance_manager_modal.dart    # Direct balance adjustment modal
│   │   ├── transaction_list_widget.dart  # Dismissible ledger row item list
│   │   ├── add_transaction_sheet.dart    # Expense & income creation form
│   │   ├── budget_widget.dart            # Progress ruler & budget editor
│   │   ├── ai_chat_sheet.dart            # Bottom sheet AI chat interface
│   │   ├── friends_modal.dart            # Friends list, requests, and debts
│   │   ├── settings_modal.dart           # Preferences & alert configurations
│   │   └── initial_balance_setup.dart    # First-time balance onboarder
│   └── utils/
│       └── export_utils.dart             # Text ledger and CSV generator
└── pubspec.yaml                          # Flutter package dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Flutter SDK** (v3.32.0 or higher)
- **Dart SDK** (v3.8.0 or higher)
- Android Studio / Xcode / VS Code with Flutter extension

### 2. Configure Firebase
Run the official FlutterFire CLI inside the `spendwise_flutter` directory to link your Firebase project:

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase for Android, iOS, and Web
flutterfire configure --project=spendwise-a875c
```

### 3. Install Dependencies
```bash
flutter pub get
```

### 4. Run the Application
```bash
# Run on connected Android / iOS device or emulator
flutter run

# Run on Chrome for local web testing
flutter run -d chrome
```

---

## 🔗 Shared Web & Mobile Ecosystem

| Component | Web App (React) | Mobile App (Flutter) |
|---|---|---|
| **Database** | Cloud Firestore (`spendwise-a875c`) | Cloud Firestore (Same project) |
| **Auth** | Firebase Auth (Email/Google) | Firebase Auth (`firebase_auth`) |
| **AI Backend** | `/api/ai-chat` (Vercel Serverless) | `AiChatService` (Calls Vercel API) |
| **Email Service**| `/api/send-email-gmail` | Vercel Serverless Backend |
| **Realtime Sync**| Firestore `onSnapshot` | Firestore `.snapshots()` streams |
