# 💰 SpendWise - Premium Financial Manager

SpendWise is a sophisticated personal finance application that combines powerful tracking capabilities with a stunning, modern user interface. Built with the latest web technologies, it offers a seamless experience for managing expenses, tracking multiple account balances, and staying on top of your financial health with smart, automated alerts.

## 🌟 Live Demo

**🔗 [Visit SpendWise](https://spend-wise-sigma-ivory.vercel.app)**

## ✨ Key Features

### 🎨 **Premium User Experience**
- **Modern Glassmorphism UI**: Beautiful, translucent interface elements with dynamic gradients.
- **Responsive Design**: Flawless experience across desktop, tablet, and mobile devices.
- **Micro-interactions**: Smooth animations and transitions for an engaging feel.

### 📊 **Smart Finance Tracking**
- **Dual Balance System**: Separately track **Online** (Bank/Digital) and **Cash** balances.
- **Real-time Updates**: Instant balance calculations and transaction history.
- **Comprehensive Analytics**: Visual charts for spending breakdown by category and time.
- **Budget Goals**: Set and monitor category-wise budget limits.

### 📧 **Intelligent Email Alerts**
Automated email notifications keep you informed about critical financial events (powered by Gmail SMTP):
- **⚠️ Low Balance Warning**: Sent when total balance drops below **₹1,000**.
- **🚨 Critical Balance Alert**: Sent when total balance drops below **₹500**.
- **📊 Daily Expense Alert**: Sent when daily spending exceeds **₹2,000**.
- **⚖️ Balance Adjustments**: Instant confirmation receipts for any manual balance corrections.

### 🔄 **Advanced Management**
- **Recurring Transactions**: Automate regular expenses like subscriptions.
- **Transaction History**: Filter, search, and manage past transactions.
- **Export Options**: Download reports in PDF or Excel formats.
- **Secure Authentication**: Robust user management via Firebase Auth.

---

## 🛠️ Technology Stack

SpendWise is built with a cutting-edge stack for performance and developer experience:

### **Frontend**
- **React 19**: Leveraging the latest React features for efficient rendering.
- **Vite**: Ultra-fast build tool and development server.
- **Tailwind CSS v4**: The latest utility-first framework for rapid, beautiful styling.
- **Lucide React**: Modern, consistent icon set.
- **Recharts**: Composable charting library for React.

### **Backend & Services**
- **Firebase Firestore**: Real-time NoSQL cloud database.
- **Firebase Authentication**: Secure identity platform.
- **Vercel Functions**: Serverless API endpoints for email dispatch.
- **Nodemailer**: Robust email sending for Node.js applications.

---

## 🚀 Getting Started

Follow these steps to set up SpendWise locally.

### Prerequisites
- Node.js 18+ installed.
- A Firebase project with Firestore and Auth enabled.
- A Gmail account with an App Password for email notifications.

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

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your credentials:

   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Email Service (Gmail SMTP)
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_16_char_app_password
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```
SpendWise/
├── src/
│   ├── components/       # Reusable UI components (Forms, Lists, Charts)
│   ├── pages/           # Main views (Dashboard, Analytics, Auth)
│   ├── context/         # React Context for State (Auth, Notifications)
│   ├── firebase/        # Firebase initialization and config
│   ├── utils/           # Helpers (Email logic, Export functions)
│   └── assets/          # Static images and styles
├── api/                 # Serverless functions (Email sending)
└── public/              # Public assets
```

## 🔧 API Endpoints

The application uses Vercel serverless functions for backend operations:

- **POST** `/api/send-gmail-alert`: Triggers email notifications based on user actions (alerts, confirmations).
- **POST** `/api/test-email`: Utility endpoint to verify SMTP configuration.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author
**Atharva Baodhankar**
- GitHub: [@atharvabaodhankar](https://github.com/atharvabaodhankar)
