# Traceability

| FR | Route(s) | Service |
|---|---|---|
| FR-01 | `POST /api/auth/login` | shared auth |
| FR-02 | `GET /api/auth/me` | shared auth |
| FR-03 | `POST /api/bales`, `GET /api/bales` | S1 |
| FR-04 | `POST /api/items` | S1 |
| FR-05 | `PATCH /api/items/:id/grade-price` | S1, S6 |
| FR-06 | `GET /api/pricing/suggest` | S6 |
| FR-07 | `PATCH /api/items/:id/ready`, `GET /api/laundry` | S1 |
| FR-08 | `GET /api/items`, `GET /api/items/:kode` | S1 |
| FR-09 | `POST /api/promotions`, `PATCH /api/promotions/:id` | S9 |
| FR-10 | `POST /api/promotions/:id/publish` | S9, S7 |
| FR-11 | `POST /api/live/sessions`, `PATCH /api/live/sessions/:id/close` | S10 |
| FR-12 | `POST /api/live/sessions/:id/claims` | S10 |
| FR-13 | `POST /api/live/sessions/:id/claims/import` | S10 |
| FR-14 | `GET /api/live/sessions/:id/claims` | S10 |
| FR-15 | `POST /api/contracts/live-claim/claim` | S10 |
| FR-16 | `GET /api/live/sessions` | S10 |
| FR-17 | `GET /api/orders`, `GET /api/orders/:id` | S2, S12 |
| FR-18 | `GET|POST|PATCH /api/customers` | S3 |
| FR-19 | `POST /api/orders/:id/invoice` | S12, S4 |
| FR-20 | `POST /api/invoices/:id/payments` | S12, S4 |
| FR-21 | `POST /api/payments/:id/validate` | S12, S4 |
| FR-22 | `POST /api/orders/:id/payment-reminder` | S12, S7 |
| FR-23 | `GET /api/packing/queue`, `POST /api/orders/:id/quality-check` | S12 |
| FR-24 | `POST /api/orders/:id/pack` | S12, S7 |
| FR-25 | `POST /api/orders/:id/handover` | S12, S5 |
| FR-26 | `POST /api/shipments/:orderId/status`, `GET /api/shipments/:orderId/tracking` | S12, S5 |
| FR-27 | `GET /api/notifications`, `GET /api/notifications/me` | S7 |
| FR-28 | `GET /api/reports/overview` | S8 |
| FR-29 | `GET /api/reports/sales`, `GET /api/reports/stock` | S8 |
| FR-30 | `GET|POST /api/strategies` | S11 |
| FR-31 | `GET /api/audit` | shared audit |
| FR-32 | `POST /api/bales/:id/start-sorting` | S1 |
| FR-33 | `GET|POST|PATCH /api/locations` | S1 |
| FR-34 | `POST /api/stock/move`, `GET /api/stock/movements` | S1 |
| FR-35 | `POST /api/stock-counts`, `POST /api/stock-counts/:id/submit` | S1 |
| FR-36 | `GET /api/stock-counts/:id/reconcile` | S1 |
| FR-37 | `POST /api/stock-counts/:id/approve` | S1 |
| FR-38 | `GET /api/warehouse/summary` | S1 |
| FR-39 | `GET /api/warehouse/aging` | S1 |
| FR-40 | `GET /api/warehouse/shipped-out`, `GET /api/packing/queue` | S1, S12 |

Tracked: **40 / 40 FR**.

## Implemented phases

- Phase 1: FR-01, FR-02, and shared audit/auth foundations.
- Phase 2: FR-03 through FR-08, FR-32, FR-33, and the S6 pricing portion of FR-06.
- Phase 3: FR-34 through FR-40 — stock move, stock movements, full stock opname (create, record item, submit, reconcile, approve with write-off and location correction), warehouse summary/aging/shipped-out.
- Phase 4: FR-09, FR-10, FR-16 through FR-18, FR-27 — S3 Member (CRUD, deposit, member status), S2 Order (list, detail, status transitions, StatusLog), S7 Notification (send, list all, list per user), S9 Promotion (create with items, update, publish with broadcast, reminder).
- Phase 5: FR-11 through FR-16 — S10 Live Selling (open/close session, single claim, CSV import sorted by time), LiveClaimContract (atomic reservation via updateMany in $transaction, 20 concurrent claims → exactly 1 winner, StatusLog for all claim statuses, claimResult via S7).
