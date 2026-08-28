# ✈ OnePlay1 — Live Multiplayer Aviator Crash Game

A complete, production-grade real-time multiplayer **Aviator Crash Game** with server-authoritative live game synchronization, betting, auto-cashout, manual cashout, EasyPaisa/JazzCash/Bank deposit & withdrawal with admin approvals, permanent user player IDs, and an admin panel.

---

## 🌟 Key Features

1. **Synchronized Multiplayer Live Game**:
   - ALL connected players see the exact same game round, the same live multiplier growth, and the same crash point simultaneously via WebSockets.
   - Provably-fair algorithm using HMAC-SHA256 with verifiable server seeds and hashes.

2. **Betting & Auto-Cashout**:
   - 2 simultaneous betting slots (Bet #1 and Bet #2) just like 1win Aviator.
   - Quick preset buttons (50, 100, 500, 1000, 5000 PKR).
   - Auto-cashout toggle with custom multiplier target.
   - Real-time potential profit calculation on the cashout button.

3. **Deposit & Withdrawal (Pakistan Specific)**:
   - Methods: **EasyPaisa**, **JazzCash**, and **Bank Transfer**.
   - Admin uploadable QR codes and account details.
   - Transaction ID + Screenshot proof upload with image preview.
   - Admin manual approval / rejection with instant balance credits & user notifications.

4. **Pakistan Standard Time Clock & Multi-Currency Converter**:
   - Prominent Pakistan Time clock (UTC+5: HH:MM:SS) updating in real time.
   - Real-time currency selector (PKR ₨, INR ₹, USD $, EUR €, AED) with live rates.

5. **Player Account & Security**:
   - Auto-generated **Permanent Player ID** (e.g. `OP-XXXXXX`).
   - Profile management with circular photo cropper (`react-easy-crop`).
   - In-app notification inbox from admin.

6. **Admin Panel (`/admin`)**:
   - **Credentials**: Username `Noman`, Password `@Nomankhan1`
   - **Dashboard**: Live system analytics, total users, volume, and engine state.
   - **User Control**: Search, temporary/permanent ban with custom reason message, balance adjustments, and direct notifications.
   - **Deposit & Withdraw Approval**: View uploaded payment screenshots in full resolution, approve/reject with notes.
   - **Game & Crash Control**:
     - Instant crash force (e.g. set next round to crash at 1.00x or 1.25x).
     - Timed scheduled crashes (set exact clock time for specific multiplier crash).
   - **Site & Theme Customizer**: Change website name, tagline, background, buttons (Green/Red), and QR codes live.

---

## 🚀 How to Run

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017/oneplay1` (or change `MONGODB_URI` in `server/.env`)

### 1. Install Dependencies

#### Server:
```bash
cd server
npm install
```

#### Client:
```bash
cd client
npm install
```

### 2. Start Applications

#### Terminal 1 (Backend Server):
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 2 (React Frontend):
```bash
cd client
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 🔑 Default Credentials

- **Admin Username**: `Noman`
- **Admin Password**: `@Nomankhan1`
- **Admin URL**: `http://localhost:3000/admin`
- **New Player Bonus**: Every newly registered player receives **1,000 PKR** welcome balance.
