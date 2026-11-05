# Backend order and payment APIs

All routes below are under `/api`. Cart, order, and payment history routes require a signed-in customer. Coupon and order-management routes require an admin.

## Checkout and orders

- `POST /orders/validate` checks the shipping address, cart stock, current prices, and optional coupon. The response includes subtotal, shipping, discount, total, unavailable items, and changed prices.
- `POST /orders` creates an order. Send `shippingAddress`, `paymentMethod` (`cod` or `razorpay`), and optionally `couponCode`. If the validation response contains changed prices, send `confirmPriceChanges: true` after the customer accepts them.
- `GET /orders` returns the signed-in customer's order history. Use `page` and `pageSize` for pagination.
- `GET /orders/:id` returns order details, tracking information, and payment transactions.
- `POST /orders/:id/cancel` cancels an order that has not shipped.
- `GET /orders/:id/invoice` downloads a PDF invoice.
- `GET /orders/admin` lists all orders for admins.
- `PATCH /orders/:id/status` lets an admin update fulfillment status. Send `{ "status": "processing" }`, for example; include `trackingNumber` when available.

The order response contains `orderNumber`, item snapshots, subtotal, shipping charge, discount, total, order status, and payment status. Set `SHIPPING_CHARGE` in the server environment; it defaults to `0`.

## Coupons

Admins can manage coupon codes through:

- `GET /coupons`
- `POST /coupons`
- `PATCH /coupons/:id`
- `DELETE /coupons/:id`

Coupon `type` is `percentage` or `fixed`. A percentage coupon can also have `maximumDiscount`; `minimumSubtotal`, `maxUses`, `startsAt`, and `expiresAt` are optional.

## Razorpay payments

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` on the server. Never send the secret values to the client.

- `POST /payments/orders` with `{ "orderId": "..." }` creates a Razorpay payment order.
- `POST /payments/verify` accepts `gatewayOrderId`, `gatewayPaymentId`, and `signature` from Razorpay Checkout and verifies the signature and captured payment with Razorpay.
- `GET /payments/status/:orderId` refreshes payment status from Razorpay.
- `GET /payments/history` returns the customer's transactions.
- `POST /orders/:id/refund` lets an admin request a full or partial refund; send `amount` in rupees to request a partial refund.
- `POST /payments/webhook` receives Razorpay payment and refund updates. Configure this URL in the Razorpay dashboard and use the same webhook secret.

Online payments reserve stock for `STOCK_RESERVATION_MINUTES` (15 minutes by default). A server timer and order/payment requests release stock for expired reservations. COD stock is restored if the order is cancelled before shipping.

## IT service requests

Service routes are under `/api/services`:

- `POST /services` creates a request for the signed-in customer. Send `deviceType` and `problemDescription`. Optional `images` can be attached as multipart file fields (JPG, PNG, or WebP; maximum five files per request and 5 MB each).
- `GET /services/history` returns the caller's requests (all requests for admins, assigned requests for technicians).
- `GET /services/:id` returns request details; customers do not see internal technician notes.
- `PATCH /services/:id` updates device details or appends more image files. Customers can edit before technician assignment.
- `POST /services/:id/assign` (admin) assigns `{ "technicianId": "..." }`.
- `POST /services/:id/cancel` lets the customer cancel before diagnosis starts.
- `PATCH /services/:id/status` (admin/assigned technician) updates status and optional message.
- `POST /services/:id/notes` adds a note. Staff may set `internal: true`; internal notes are hidden from customers.
- `PATCH /services/:id/estimate` sets `estimatedCost`.
- `POST /services/:id/approve-estimate` lets the customer approve the estimate and allow work to begin.
- `PATCH /services/:id/final-cost` sets `finalCost`.
- `POST /services/:id/complete` completes a request after its final cost is set.
- `GET /services/:id/tracking` returns status history.
- `GET /services/:id/billing` returns the service bill data and `GET /services/:id/bill` downloads its PDF.
- `POST /services/:id/billing/paid` (admin) marks a completed service bill paid.

Service images use the configured Cloudinary credentials. Service billing records costs and payment status; the paid status endpoint is an admin/manual update and is not a separate payment gateway.

## Corporate and bulk enquiries

Routes are under `/api/bulk-enquiries`. Customers must be signed in to create and act on enquiries; admins and sellers manage enquiries, with sellers limited to enquiries assigned to them.

- `POST /bulk-enquiries` creates a request with company, phone, shipping address, and product IDs/quantities.
- `GET /bulk-enquiries` returns the caller's requests or staff-assigned work. Supports `page`, `pageSize`, `status`, and `search`.
- `GET /bulk-enquiries/:id` returns enquiry and quotation details.
- `PATCH /bulk-enquiries/:id` lets a customer edit an unquoted request.
- `PUT /bulk-enquiries/:id/products` updates requested product quantities for assigned staff.
- `PATCH /bulk-enquiries/:id/status` updates staff-managed enquiry state.
- `POST /bulk-enquiries/:id/assign` (admin) assigns an active admin/seller using `{ "staffId": "..." }`.
- `POST /bulk-enquiries/:id/quotations` creates a draft quote. Include the requested products and `unitPrice` for each, plus optional shipping, discount, notes, and `validDays`.
- `PATCH /bulk-enquiries/:id/quotations/:quotationId` edits a draft quote.
- `GET /bulk-enquiries/:id/quotations/:quotationId/pdf` downloads its PDF.
- `POST /bulk-enquiries/:id/quotations/:quotationId/send` emails the PDF to the customer's account email.
- `POST /bulk-enquiries/:id/quotations/:quotationId/decision` accepts `{ "decision": "accepted" }` or `{ "decision": "rejected" }`.
- `POST /bulk-enquiries/:id/quotations/:quotationId/convert` converts an accepted, unexpired quotation into a COD order and reserves the requested product stock.

## Customers, staff, and notifications

User routes are under `/api/users` and require authentication:

- `GET /users/customers` lists customers with `page`, `pageSize`, and `search`.
- `GET /users/customers/:id/history` returns a customer's orders, service requests, and bulk enquiries.
- `PATCH /users/:id` updates a customer's name, phone, or company.
- `PATCH /users/:id/status` activates or deactivates a user. Deactivation revokes their sessions.
- `GET /users/staff` lists admin, seller, and technician accounts (admin only).
- `POST /users/staff` creates a seller or technician and emails an account verification link.
- `PATCH /users/:id/role` and `PATCH /users/:id/permissions` let an admin manage staff access.
- `GET /users` and `GET /users/:id` are admin-only user listing/detail routes.
- `GET /users/me` and `PATCH /users/me` let a signed-in user view or update their profile.

New customer and staff registrations must verify their email before signing in. Use `POST /auth/resend-verification` with an email to resend the link; old accounts created before verification was added are retained as verified.

Order, payment, service, and quotation updates send email notifications. WhatsApp delivery is optional and requires a provider in the server environment. Set `WHATSAPP_PROVIDER=twilio` with Twilio credentials, or `WHATSAPP_PROVIDER=meta` with a Meta access token and phone number ID. The business WhatsApp number stored in website settings is used to create the `wa.me` contact link and, for Twilio, as the default sender when `WHATSAPP_FROM` is omitted. Customer phone numbers must be present in their profile/order/enquiry to receive WhatsApp messages.

- `GET /notifications/whatsapp-contact` returns the configured business number and contact link.

SMTP must be configured for email. WhatsApp and email delivery failures are logged and do not undo a completed order, payment, service request, or quotation update.

## Analytics and reports

All analytics endpoints require an authenticated admin account and are under `/api/analytics`:

- `GET /overview` returns product/customer/order totals, paid revenue, open orders, combined general and bulk enquiry counts, and pending/completed service counts. Revenue includes fully-paid orders and subtracts processed refunds.
- `GET /sales/monthly?year=2026` returns all 12 months, including zero-sale months. Monthly revenue uses the same net paid revenue calculation.
- `GET /products/top-selling?from=2026-01-01&to=2026-01-31&limit=10` ranks products by quantity in paid orders.
- `GET /products/low-stock?threshold=5` returns active products at or below the requested stock threshold.
- `GET /reports/sales?from=2026-01-01&to=2026-01-31` returns up to 10,000 orders, an all-matching-orders net revenue summary, and a `truncated` flag.
- `GET /reports/services?from=2026-01-01&to=2026-01-31` returns up to 10,000 service requests, all-matching status counts, and paid service-billing totals, plus a `truncated` flag.
- `GET /reports/sales.csv`, `/reports/sales.pdf`, `/reports/services.csv`, and `/reports/services.pdf` export reports. Date filters are optional; the default is the last year. Date ranges may not exceed 366 days. CSV is capped at 10,000 rows and reports `X-Report-Truncated`; PDF is capped at 500 rows.
- `GET /audit-logs?page=1&pageSize=50` lists write attempts, including rejected requests, with actor, route, HTTP status, request ID, and timestamp. Optional `action`, `statusCode`, `from`, and `to` filters are supported. Audit entries expire after one year.

## Backend security and operations

- Helmet security headers, strict credentialed CORS allowlists, NoSQL query sanitization, duplicate-query protection, request IDs, centralized error responses, and per-IP request limits are enabled.
- The default API limit is 300 requests per 15 minutes; authentication is limited to 15 per 15 minutes and payment routes to 30 per minute. Limits use the process's in-memory store; multi-instance deployments should configure a shared rate-limit store before scaling out.
- Configure `FRONTEND_URL` and comma-separated `CORS_ALLOWED_ORIGINS` with the exact production origins. Set `TRUST_PROXY_HOPS` only to the number of trusted reverse proxies in front of the API.
- Service image upload accepts JPG, PNG, and WebP files only, with both MIME and file-signature checks, a 5 MB per-file limit, and at most five files per upload request.
- Razorpay webhook requests retain their raw request body and are accepted only after signature verification.
- Write requests are recorded without request bodies or passwords. A request ID is returned in `X-Request-Id` and is included in audit records and error responses.
- `GET /health` reports API and database readiness.

The configured business contact details are WhatsApp/phone `+91 6267808085` and email `abhinandansoni100@gmail.com`. Startup seeds these values when creating website settings and updates the previous default contacts. Email delivery still requires working SMTP credentials. WhatsApp message delivery requires working Twilio or Meta credentials and provider setup; the contact link works without those credentials. No live provider delivery is claimed or tested by the build/test commands.

Run backend checks from `Server`:

```powershell
npm run build
npm test
```
