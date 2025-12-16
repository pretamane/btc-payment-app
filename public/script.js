async function initiatePayment() {
    const btn = document.getElementById('pay-btn');
    const errorMsg = document.getElementById('error-msg');

    btn.disabled = true;
    btn.innerText = "Processing...";
    errorMsg.style.display = 'none';

    const customer = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value
    };

    try {
        // 1. Create Order
        const orderRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ id: 'hoodie-001', quantity: 1 }],
                customer: customer,
                currency: 'USD'
            })
        });

        if (!orderRes.ok) throw new Error('Failed to create order');
        const orderData = await orderRes.json();
        const orderId = orderData.orderId;

        // 2. Initiate Payment (Get Invoice)
        const payRes = await fetch(`/api/orders/${orderId}/pay`, { method: 'POST' });

        if (!payRes.ok) throw new Error('Failed to initiate payment');
        const payData = await payRes.json();

        // 3. Redirect to BTCPay
        window.location.href = payData.checkoutLink;

    } catch (err) {
        console.error(err);
        errorMsg.innerText = "Error: " + err.message;
        errorMsg.style.display = 'block';
        btn.disabled = false;
        btn.innerText = "Pay with Bitcoin";
    }
}

async function pollOrderStatus(orderId) {
    const badge = document.getElementById('status-badge');
    const message = document.getElementById('message');
    const loader = document.getElementById('loader');
    const homeBtn = document.getElementById('home-btn');

    const check = async () => {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            const order = await res.json();

            badge.className = `status-badge status-${order.status}`;
            badge.innerText = order.status.replace('_', ' ').toUpperCase();

            if (order.status === 'paid') {
                message.innerText = "Payment Confirmed! Your hoodie is on the way.";
                loader.style.display = 'none';
                homeBtn.style.display = 'block';
                return; // Stop polling
            } else if (order.status === 'expired') {
                message.innerText = "Invoice expired. Please try again.";
                loader.style.display = 'none';
                homeBtn.style.display = 'block';
                return; // Stop polling
            }

            // Keep polling
            setTimeout(check, 3000);

        } catch (err) {
            console.error("Polling error", err);
        }
    };

    check();
}
