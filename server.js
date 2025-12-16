require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// BTCPay Configuration
const BTCPAY_URL = process.env.BTCPAY_URL;
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;
const WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET;

// Mock Database
const orders = {};

// --- API Endpoints ---

// 1. Create Order (Simulate Cart & Inventory)
app.post('/api/orders', (req, res) => {
    const { items, customer, currency } = req.body;

    // Simulate Inventory Check (Mock logic)
    // In a real app, you'd check DB stock levels here.
    const isStockAvailable = true;
    if (!isStockAvailable) {
        return res.status(400).json({ error: 'Item out of stock' });
    }

    // Calculate Total (Mock logic - assuming 1 item for simplicity)
    // In reality, sum up item prices from DB.
    const amount = 10; // Fixed price for "Cyberpunk Hoodie"

    const orderId = crypto.randomUUID();
    orders[orderId] = {
        id: orderId,
        status: 'created', // created, pending_payment, paid, expired
        items,
        amount,
        currency: currency || 'USD',
        customer,
        createdAt: new Date(),
        invoiceId: null
    };

    console.log(`Order Created: ${orderId}`);
    res.json({ orderId, amount, currency: orders[orderId].currency });
});

// 2. Initiate Payment (Create Invoice)
app.post('/api/orders/:id/pay', async (req, res) => {
    const order = orders[req.params.id];
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    try {
        const payload = {
            amount: order.amount,
            currency: order.currency,
            metadata: {
                orderId: order.id, // CRITICAL: Link Invoice to Order
                customerName: order.customer.name
            },
            checkout: {
                speedPolicy: "MediumSpeed",
                expirationMinutes: 15,
                monitoringMinutes: 15,
                paymentMethods: ["BTC"],
                redirectURL: `http://localhost:${port}/order-status.html?orderId=${order.id}`
            }
        };

        const response = await axios.post(
            `${BTCPAY_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`,
            payload,
            {
                headers: {
                    'Authorization': `token ${BTCPAY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Dev only
            }
        );

        order.invoiceId = response.data.id;
        order.status = 'pending_payment';

        console.log(`Invoice Created for Order ${order.id}: ${order.invoiceId}`);

        res.json({
            invoiceId: response.data.id,
            checkoutLink: response.data.checkoutLink
        });

    } catch (error) {
        console.error('Error creating invoice:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// 3. Get Order Status (Polling)
app.get('/api/orders/:id', (req, res) => {
    const order = orders[req.params.id];
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
});

// --- Webhook Handler ---

app.post('/webhook', (req, res) => {
    const signature = req.headers['btcpay-sig'];
    const body = JSON.stringify(req.body);

    if (!signature || !WEBHOOK_SECRET) {
        console.warn('Webhook received without signature or secret');
        // return res.status(403).send('Unauthorized'); // Uncomment in prod
    } else {
        const expectedSignature = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return res.status(403).send('Invalid signature');
        }
    }

    const event = req.body;
    const invoiceId = event.invoiceId;

    // Find order by invoiceId
    // In a real DB, you'd do: db.orders.findOne({ invoiceId })
    const orderId = Object.keys(orders).find(key => orders[key].invoiceId === invoiceId);
    const order = orders[orderId];

    if (!order) {
        console.log(`Webhook received for unknown order (Invoice: ${invoiceId})`);
        return res.status(200).send('OK');
    }

    console.log(`Webhook Event: ${event.type} for Order ${order.id}`);

    switch (event.type) {
        case 'InvoiceSettled':
            order.status = 'paid';
            console.log(`✅ Order ${order.id} PAID!`);
            break;
        case 'InvoiceExpired':
            if (order.status !== 'paid') {
                order.status = 'expired';
                console.log(`❌ Order ${order.id} EXPIRED!`);
            }
            break;
        case 'InvoiceInvalid':
            order.status = 'invalid';
            console.log(`⚠️ Order ${order.id} INVALID!`);
            break;
    }

    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
