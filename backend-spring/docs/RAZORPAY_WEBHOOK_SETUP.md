# Razorpay webhook secret (RAZORPAY_WEBHOOK_SECRET)

## What it is

Razorpay signs each webhook request with **HMAC-SHA256** using a **webhook secret** that is shown when you create the webhook in the Razorpay Dashboard. Your API uses the same secret (`app.payments.razorpay.webhook-secret` / env **`RAZORPAY_WEBHOOK_SECRET`**) to verify `X-Razorpay-Signature`. If the secret is missing, callbacks return **503** so unverified traffic never touches fee logic.

## How to set it

1. **Dashboard:** [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Account & Settings** → **Webhooks** → **Add New Webhook**.
2. **URL:** `https://<your-api-host>/api/v1/fees/webhooks/razorpay` (no auth header; signature only).
3. **Events:** enable at least **`payment.captured`** (and optionally **`payment.failed`** for attempt status).
4. After saving, Razorpay shows the **secret** (or lets you regenerate it). Copy it once.
5. **Deploy:** set environment variable:
   - `RAZORPAY_WEBHOOK_SECRET=<paste secret>`
6. **Local dev:** same in `.env` or IDE run config; use [ngrok](https://ngrok.com/) (or similar) to expose localhost so Razorpay can POST to you.

## Checkout 400 on `api.razorpay.com/v2/standard`

If your **own** API returns `providerOrderId` like `RAZORPAY-ORDER-xxxxxxxx`, that is **not** a Razorpay order. The browser widget will get **400** from Razorpay. Real ids look like `order_xxxxxxxxxxxxxx`.

- Set **`RAZORPAY_KEY`** and **`RAZORPAY_SECRET`** on the server (same account and **test vs live** mode as the publishable key shown to the app).
- The server must successfully **POST `/v1/orders`**; if that fails, fix credentials / amount / network — do not open Checkout with a synthetic order id.

## Order notes (multi-tenant)

When you create Razorpay **Orders** from your app, put **`tenant_id`** and **`fee_payment_attempt_id`** (or internal attempt id) in **order notes**. The webhook processor uses these to resolve the row if more than one attempt could share routing metadata. Single-tenant or unique `order_id` per attempt is still resolved by **`provider_order_id`** on `fee_payment_attempts`.
