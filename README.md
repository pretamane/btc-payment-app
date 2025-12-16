# ₿ BTCPay Node.js Integration Demo

A production-ready Node.js integration for **BTCPay Server**, demonstrating secure Bitcoin payment processing, real-time webhook handling, and a seamless e-commerce checkout flow.

This project simulates a digital storefront ("CyberShop") where users can purchase a "Cyberpunk Hoodie" using Bitcoin. It handles the full lifecycle: order creation, invoice generation, payment redirection, and real-time status updates via webhooks and polling.

## 🚀 Features

- **Full Payment Flow**: Product selection -> Checkout -> BTCPay Invoice -> Confirmation.
- **Mock E-commerce Backend**:
  - Simulates inventory checks and order management.
  - In-memory "database" for tracking orders.
- **BTCPay Server Integration**:
  - Uses the **Greenfield API v1** to generate invoices.
  - Secure **Webhook Verification** (using HMAC-SHA256) to handle payment updates (Paid, Expired, Invalid).
- **Real-time UI**: Frontend polls the backend to update the user immediately when a payment is confirmed.

## 🛠️ Prerequisites

- **Node.js** (v14+)
- **NPM**
- A **BTCPay Server** instance (Self-hosted or [hosted](https://btcpay.directory/)).
- A generic **Bitcoin Wallet** connected to your BTCPay store.

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pretamane/btc-payment-app.git
   cd btc-payment-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory. **Never commit this file.**

```bash
touch .env
```

Add the following configuration variables:

```ini
# Server Configuration
PORT=3000

# BTCPay Server Configuration
# Your BTCPay Server URL (e.g., https://mainnet.demo.btcpayserver.org)
BTCPAY_URL=https://your-btcpay-instance.com

# API Key generated in BTCPay (Settings > Access Tokens)
# Permissions required: btcpay.store.cancreateinvoice
BTCPAY_API_KEY=your_api_key_here

# The Store ID you are accepting payments for
BTCPAY_STORE_ID=your_store_id_here

# Webhook Secret (Settings > Webhooks > Create Webhook)
# Used to verify that callbacks are actually from BTCPay
BTCPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

## 🏃‍♂️ Usage

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

3. **Test the Flow:**
   - Click "Add to Cart".
   - Fill in mock details on the Checkout page.
   - Click "Pay with Bitcoin".
   - You will be redirected to the BTCPay invoice page.
   - Pay the invoice (or use a testnet wallet).
   - Watch the order status update automatically on the final page.

## 📂 Project Structure

```
├── public/              # Static Frontend Assets
│   ├── index.html       # Landing Page
│   ├── checkout.html    # Checkout Form
│   ├── order-status.html# Status & Polling Page
│   ├── script.js        # Frontend Logic (Fetch APIs)
│   └── style.css        # Styles
├── server.js            # Main Express Backend
├── package.json         # Dependencies & Metadata
└── .env                 # Secrets (Excluded from Git)
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Creates a new order in the mock DB. |
| `POST` | `/api/orders/:id/pay` | Generates a BTCPay invoice for the order. |
| `GET` | `/api/orders/:id` | Returns the current status of an order. |
| `POST` | `/webhook` | Receives payment callbacks from BTCPay. |

## 🔒 Security Note

- **Environment Variables**: Always use `.env` for API Keys and Secrets.
- **Webhook Signature**: The `/webhook` endpoint verifies the `BTCPay-Sig` header to prevent spoofing attacks.
- **HTTPS**: In production, ensure your server is running behind HTTPS (e.g., Nginx, LetsEncrypt) so that BTCPay can send webhooks to you securely.

---
*Built for educational purposes.*
