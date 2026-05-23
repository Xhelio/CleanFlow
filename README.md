# 🌪️ CleanFlow Laundry Booking & POS

CleanFlow is a modern Single Page Application (SPA) laundry management, booking, and POS platform. It features a complete multi-actor simulation flow (Customer, Admin, and Courier), dynamic QRIS payment using a free API, and a dual-database design with automatic offline **LocalStorage fallback** if Supabase credentials are not configured.

Developed with **Vite, Vanilla JS, and Vanilla CSS** for maximum performance, responsiveness, and premium visual aesthetics.

---

## ✨ Key Features
- **Multi-Role Simulation**: Simulate the complete laundry workflow across three distinct dashboards side-by-side:
  - **Customer Portal**: Booking laundry (kiloan/satuan), address management, voucher application (`BARU20`), digital invoices, and order tracking.
  - **Admin Dashboard**: Live revenue charts, stock management (raw materials), assigning couriers, weighing items, and order status updates.
  - **Courier Interface**: Active tasks, geolocation mockup, and **digital signature canvas** for proof-of-delivery/pickup.
- **Dynamic QRIS Payment**: Scannable QR codes generated on-the-fly via a free QRServer API, including a premium loading state.
- **Auto-Hide Header**: Intelligent sticky navbar that hides when scrolling down to maximize screen estate, and reappears when scrolling up. Optimized with drawer navigation on mobile.
- **WhatsApp Notification Simulator**: Dynamic toast system simulating instant courier assignments and status alerts sent via WhatsApp.
- **Robust Unit Testing**: Core business logic (price calculations, mappers, and authorization) tested and verified with **Vitest & jsdom**.

---

## 🛠️ Tech Stack
- **Core**: HTML5, Vanilla JavaScript (ES Module)
- **Styling**: Vanilla CSS (Variables, Glassmorphic UI, responsive layouts)
- **Database / Backend**: Supabase (PostgreSQL)
- **Offline Fallback**: Browser `localStorage`
- **Testing**: Vitest, jsdom
- **Bundler / Build Tool**: Vite

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v16.x or newer recommended).

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (you can copy `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*Note: If you leave the `.env` values blank or set to defaults, the application will automatically enter **LocalStorage Fallback Mode** (indicated by a yellow icon in the browser).*

### 4. Supabase SQL Schema Setup
If you are using Supabase, copy the SQL script from [supabase_schema.sql](file:///e:/Script/WebLaundry/supabase_schema.sql) and run it in your Supabase **SQL Editor** to initialize the following tables:
- `cf_users` (Roles: `admin`, `courier`, `customer`)
- `services` (Laundry categories: kiloan/satuan)
- `treatments` (Cuci lipat, cuci setrika, setrika saja)
- `durations` (Reguler, Ekspres, Flash)
- `addresses` (Customer addresses)
- `orders` (Transactions)
- `inventory` (Supplies)

### 5. Running Locally
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 🧪 Running Unit Tests
We use **Vitest** under a simulated **jsdom** browser environment to run all unit tests:
```bash
# Run unit tests once
npm run test

# Run tests in interactive watch mode
npm run test:watch
```

---

## ☁️ Deployment
This project is fully ready for deployment on **Vercel** or any static hosting platform. Every push to the `main` branch on GitHub triggers an automatic deployment if integrated.

Remember to add the environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in your hosting provider's dashboard.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).