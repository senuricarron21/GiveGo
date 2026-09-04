# 🎁 GiveGo — Intelligent Material Donation & Dispatch Management Platform
> **Academic Project Submission**: Higher Diploma in Software Engineering (HDSE / HDIT)  
> **Student Author**: GiveGo Core Development Team  
> **Target Production URL**: [https://goooooo-five.vercel.app](https://goooooo-five.vercel.app)

---

## 📌 Project Overview
**GiveGo** is a web-based, real-time donation management platform designed to connect verified donors with verified receivers (Schools, Hospitals, Orphanages, Elder Care Homes, Disaster Relief Organizations). 

The platform provides multi-role personalized dashboards for **Donors**, **Receivers**, and **System Administrators** featuring intelligent word-based matching, multi-step delivery scheduling & negotiation, real-time GPS telemetry radar, and complete admin oversight.

---

## 🏗️ Technical Architecture & File Structure

```
goooooo/
├── index.html               # Universal Authentication & Brand Landing (Single Login Form)
├── register.html            # Role-Specific Registration (Donor / Receiver Org Credentials)
├── dashboard.html           # Main Application UI (Admin, Donor, Receiver Panel Views & Modals)
├── css/
│   └── styles.css           # Design Tokens, Glassmorphism, Responsive Grid & Radar Animations
├── js/
│   ├── firebase-config.js   # Firebase App & Firestore Database SDK Connection Helper
│   ├── auth.js              # Authentication Listener, Session Management & Profile Controller
│   └── app.js               # Core Business Engine, Real-Time Dispatch Telemetry & Chat Engine
└── README.md                # System Specification, API Contracts & HD Architecture Documentation
```

---

## 🔄 Core Business Logic & State Machine

### 1. 🤝 Two-Way Multi-Step Approval & Delivery Workflow
```
[Donor Offer / Receiver Request]
               │
               ▼
   (Pending Approval State)
   ├── Donor Offers to Need ──> Receiver Reviews ──> Receiver Accepts / Declines
   └── Receiver Requests Stock ─> Donor Reviews ────> Donor Accepts / Declines
               │
               ▼ (On Acceptance)
   (Accepted — Pending Delivery Selection)
               │
   Donor Selects Delivery Method:
   ├── Option 1: Self Delivery ──> Donor Pick Date & Time ──> Receiver Accepts / Negotiates
   └── Option 2: Receiver Pick Up ─> Receiver Pick Date & Time ──> Donor Accepts / Negotiates
               │
               ▼ (On Schedule Confirmation)
      (Order Confirmed)
               │
      Donor Clicks "Start Delivery"
               │
               ▼ (Triggers Uber/PickMe Radar)
         (In Transit) ──> [Session ID: DEL-XXXXX] + Live GPS Telemetry Stream
               │
      Donor Marks "Delivered"
               │
               ▼
     Receiver Confirms Receipt
               │
               ▼
        (Completed) ──> Auto-adjusts remaining stock / partial fulfillment
```

---

### 2. 💬 Schedule Negotiation Rejection & Auto-Chat Integration
- If either party declines a proposed date or time schedule, the match status updates to `schedule_negotiating`.
- The system automatically triggers an automated chat entry:  
  `"⚠️ Schedule proposal declined. Let's discuss a suitable date & time here in chat!"`
- The system seamlessly redirects the user into the **Direct Messaging Portal (`#chat`)**.
- A fast **`📅 Propose New Date & Time`** button is displayed inside the chat header for direct re-negotiation.

---

### 3. ⚡ Uber / PickMe Style Live Telemetry Radar
- Initiating a delivery (`startDeliverySession`) launches an animated **Live Dispatch Telemetry Radar**:
  1. `📡 Connecting to GPS Satellite...`
  2. `🧭 Route & Traffic Telemetry Calculated` (Live speed: `24 km/h`, Distance: `3.2 km`, ETA: `~14 Mins`)
  3. `🚚 Delivery Session DEL-XXXXX Dispatched & Live!`
- Real-time GPS coordinates stream via `navigator.geolocation.watchPosition` into Firestore and display on interactive **Google Maps JavaScript API** markers.

---

### 4. 🛡️ Complete Real-Time Admin Oversight
- **Live Active Matches Oversight Table**: Real-time monitoring of all active connections, delivery methods, session IDs, and status badges.
- **Admin Chat Inspector (`👁️ View Live Chat`)**: Read-only inspector allowing administrators to monitor message logs between donors and receivers for compliance and dispute resolution.
- **Admin GPS Radar Monitor (`📍 Monitor GPS Radar`)**: Live map tracking for active delivery sessions.

---

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla JavaScript (ES6+ Modules), Vanilla CSS (Custom Design System & Glassmorphism Tokens)
- **Map & Telemetry**: Google Maps JavaScript API (v3), HTML5 Geolocation API
- **Backend & Database**: Firebase Authentication, Firebase Firestore (Real-Time Document Listeners)
- **Deployment**: Git, GitHub (`main`), Vercel Production Auto-Alias (`goooooo-five.vercel.app`)

---
*Developed for Higher Diploma Software Engineering Final Submission.*
