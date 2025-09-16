# 📌 Project Plan: Budget Tracking React App (Firebase)

---

## 🎯 Goal

Build a Budget Tracking Web App using **React + Firebase** where users can:

* Track income and expenses
* Set budgets and goals
* Visualize spending trends

---

## 🏗️ Tech Stack

* **Frontend**: React (Vite or CRA), Tailwind CSS / normal CSS
* **Backend/Database**: Firebase Firestore
* **Authentication**: Firebase Auth (Email/Google)
* **Hosting**: Firebase Hosting
* **Charts**: Recharts or Chart.js

---

## 🚀 Development Phases

### **Phase 1 – MVP (Core Features)**

1. **Setup**

   * Create React app
   * Configure Firebase (Auth + Firestore)
   * Setup project structure

2. **Authentication**

   * User signup/login/logout (Email + Google)
   * Store user data in Firestore by UID

3. **Expense & Income Management**

   * Add income/expense entries (amount, category, date, notes)
   * Store entries in Firestore under user’s collection

4. **Dashboard**

   * Display total income, expenses, and balance
   * Show transaction history (sortable by date)

---

### **Phase 2 – Budget Goals & Visualization**

5. **Budget Goals**

   * Users set monthly/weekly budget limit
   * Progress bar showing % of budget spent

6. **Charts & Analytics**

   * Pie chart for expenses by category
   * Bar/line chart for spending trends

---

### **Phase 3 – Smart Features**

7. **Recurring Expenses**

   * Option to mark expenses as recurring
   * Auto-add them monthly/weekly

8. **Notifications**

   * Alert when user exceeds budget (in-app toast)
   * (Optional) Firebase Cloud Messaging for push notifications

9. **Export & Backup**

   * Export transactions to CSV/PDF
   * (Optional) Sync with Google Drive

---

### **Phase 4 – Advanced Enhancements**

10. **Multi-Currency Support**

* Allow user to select currency
* Store exchange rates in Firestore

11. **Shared Budgets**

* Multiple users collaborate on a shared budget
* Role-based access (Owner, Member)

12. **AI Insights (Optional)**

* Suggest cost-cutting tips
* Example: "You spent 40% on food this month"

13. **Offline Support**

* Firebase offline persistence
* Sync changes when reconnected

---

## ✅ Deliverables

* Functional Budget Tracker app
* Firebase-connected backend
* User-friendly UI with charts
* Scalable codebase for adding future features

---

## 🕒 Timeline (Rough)

* **Week 1**: Phase 1 (MVP)
* **Week 2**: Phase 2 (Budgets + Charts)
* **Week 3**: Phase 3 (Recurring + Notifications + Export)
* **Week 4+**: Phase 4 (Advanced Features)

---

📂 Suggested Folder Structure

```
/src
  /components
  /pages
  /context
  /firebase
  /hooks
  /utils
```
