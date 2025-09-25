# 💰 SpendWise - Smart Personal Finance Manager

A modern, feature-rich personal finance management application built with React, Firebase, and intelligent email notifications. Track expenses, manage budgets, and stay on top of your financial health with automated alerts.

## 🌟 Live Demo

**🔗 [Visit SpendWise](https://spend-wise-sigma-ivory.vercel.app)**

## ✨ Key Features

### 📊 **Expense Tracking**

- Add, edit, and categorize transactions
- Support for both online and cash payments
- Real-time balance calculations
- Transaction history with filtering and search

### 💳 **Multi-Account Management**

- Separate tracking for online and cash balances
- Balance adjustment tools with audit trails
- Automatic balance synchronization

### 📧 **Smart Email Alerts**

- **Low Balance Alerts** - When total balance drops below ₹1,000
- **Critical Balance Alerts** - When balance falls below ₹500
- **Daily Expense Alerts** - When daily spending exceeds ₹2,000
- **Balance Adjustment Confirmations** - Email receipts for all balance changes
- Beautiful HTML email templates with professional styling

### 📈 **Analytics & Insights**

- Visual spending charts and graphs
- Category-wise expense breakdown
- Monthly and weekly spending trends
- Budget goal tracking and progress monitoring

### 🎯 **Budget Management**

- Set and track budget goals
- Category-wise budget allocation
- Progress indicators and alerts
- Spending pattern analysis

### 🔄 **Recurring Transactions**

- Set up automatic recurring expenses
- Monthly subscription tracking
- Salary and income automation
- Smart scheduling system

### 📱 **Responsive Design**

- Mobile-first responsive interface
- Touch-friendly controls
- Optimized for all screen sizes
- Progressive Web App capabilities

### 🔐 **Security & Authentication**

- Firebase Authentication integration
- Secure user data management
- Real-time data synchronization
- Privacy-focused design

## 🛠️ Technology Stack

### **Frontend**

- **React 19** - Modern UI library with latest features
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Recharts** - Responsive chart library

### **Backend & Database**

- **Firebase Firestore** - NoSQL cloud database
- **Firebase Authentication** - User management
- **Firebase Security Rules** - Data protection

### **Email System**

- **Gmail SMTP** - Reliable email delivery
- **Nodemailer** - Email sending library
- **Custom HTML Templates** - Professional email design

### **Deployment & Hosting**

- **Vercel** - Serverless deployment platform
- **Vercel Functions** - API endpoints
- **GitHub Integration** - Continuous deployment

### **Additional Libraries**

- **jsPDF** - PDF report generation
- **XLSX** - Excel export functionality
- **React Router** - Client-side routing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project setup
- Gmail account for email notifications

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/atharvabaodhankar/SpendWise.git
   cd SpendWise
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Email Configuration
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_APP_PASSWORD=your_16_character_app_password
   ```

4. **Firebase Setup**

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Copy configuration to `.env` file

5. **Gmail SMTP Setup**

   - Enable 2-Step Verification on your Google Account
   - Generate an App Password for Gmail
   - Add credentials to `.env` file

6. **Start Development Server**

   ```bash
   npm run dev
   ```

7. **Build for Production**
   ```bash
   npm run build
   ```

## 📧 Email Alert System

SpendWise features a comprehensive email notification system that keeps users informed about their financial activities:

### **Alert Types**

- **🟡 Low Balance Alert** - Triggered when total balance < ₹1,000
- **🔴 Critical Balance Alert** - Triggered when total balance < ₹500
- **📊 Daily Expense Alert** - Triggered when daily expenses > ₹2,000
- **⚖️ Balance Adjustment Confirmation** - Sent after any balance modification

### **Email Features**

- Professional HTML templates with responsive design
- Real-time delivery via Gmail SMTP
- Detailed transaction summaries
- Actionable recommendations
- Mobile-friendly formatting

### **Configuration**

The email system automatically triggers based on user actions:

- Adding transactions that affect balance thresholds
- Making balance adjustments
- Exceeding daily spending limits

## 🏗️ Project Structure

```
SpendWise/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── context/            # React context providers
│   ├── firebase/           # Firebase configuration
│   ├── utils/              # Utility functions & email alerts
│   └── assets/             # Static assets
├── api/                    # Vercel serverless functions
│   ├── send-gmail-alert.js # Email notification API
│   └── test-email.js       # Email testing endpoint
├── public/                 # Public assets
└── docs/                   # Documentation files
```

## 🔧 API Endpoints

### **Email Notifications**

- `POST /api/send-gmail-alert` - Send various types of email alerts
- `POST /api/test-email` - Test email functionality

### **Request Examples**

```javascript
// Balance Alert
{
  "type": "low_balance",
  "userEmail": "user@example.com",
  "data": { "balance": 750 }
}

// Balance Adjustment Confirmation
{
  "type": "balance_adjustment",
  "userEmail": "user@example.com",
  "data": {
    "reason": "Initial setup",
    "onlineAdjustment": 5000,
    "cashAdjustment": 2000,
    "previousOnlineBalance": 0,
    "previousCashBalance": 0,
    "newOnlineBalance": 5000,
    "newCashBalance": 2000
  }
}
```

## 🎨 Features Showcase

### **Dashboard Overview**

- Real-time balance display
- Recent transactions list
- Quick action buttons
- Spending insights

### **Transaction Management**

- Add income/expense with categories
- Edit and delete transactions
- Bulk operations support
- Advanced filtering options

### **Analytics Dashboard**

- Interactive charts and graphs
- Category-wise spending breakdown
- Monthly/weekly trends
- Export capabilities (PDF, Excel)

### **Budget Planning**

- Set category-wise budgets
- Track progress with visual indicators
- Receive alerts when approaching limits
- Historical budget performance

## 🚀 Deployment

### **Vercel Deployment**

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### **Environment Variables (Vercel)**

Add these in your Vercel project settings:

- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password
- All Firebase configuration variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Atharva Baodhankar**

- GitHub: [@atharvabaodhankar](https://github.com/atharvabaodhankar)
- LinkedIn: [Atharva Baodhankar](https://linkedin.com/in/atharvabaodhankar)

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Vercel for hosting and serverless functions
- Tailwind CSS for styling framework
- Recharts for data visualization
- Gmail SMTP for email delivery

---

⭐ **Star this repository if you found it helpful!**
