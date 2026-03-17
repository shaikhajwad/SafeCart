# TRACK

## Current Version

- v0.3.0 (staging)

## Completed Modules

- [x] Identity & OTP
- [x] Organizations
- [ ] Payments (SSLCOMMERZ)
- [ ] Logistics (Paperfly)
- [ ] Disputes

## API Endpoints

- [x] `POST /api/auth/otp/send`
- [x] `POST /api/auth/otp/verify`
- [ ] `POST /api/webhooks/payments/sslcommerz/ipn`
- [ ] `POST /api/orders/{id}/payments/initiate`

## Features Implemented

- [x] Seller creates checkout link
- [ ] Buyer pays via payment link
- [ ] Courier booking

## Pending Tasks

- [ ] Add idempotency middleware
- [ ] Add payment reconciliation job
- [ ] Add order state machine guards

## Known Issues

- 2026-03-18: Staging OTP send rate limit too strict for shared IP networks.
