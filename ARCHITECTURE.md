# Zaraff Collection Backend Architecture

## Service Catalog

| ID | Service | Type | Model owned | Calls |
|---|---|---|---|---|
| S1 | Inventory | Entity | Location, Bale, Item, StockMovement, StockCount, StockCountLocation, StockCountItem | - |
| S2 | Order | Entity | Order, OrderItem | - |
| S3 | Member | Entity | Customer | - |
| S4 | Payment | Entity | Invoice, Payment | - |
| S5 | Shipment | Entity | Shipment, ShipmentEvent | - |
| S6 | Pricing | Entity | PricingRule, DiscountRule | - |
| S7 | Notification | Utility | NotificationLog | - |
| S8 | Reporting | Utility | - | S1, S2, S4, S5 |
| S9 | Promotion | Entity | Promotion, PromotionItem | S1, S7 |
| S10 | Live Selling | Task | LiveSession, Claim | S1, S2, S7 |
| S11 | Sales Strategy | Task | Strategy | S8, S7 |
| S12 | Order Fulfillment | Task | PackingRecord | S1, S2, S3, S4, S5, S6, S7 |
| shared | Audit | Infrastructure | StatusLog | available to every service |

## Contract Endpoints

| Contract | Route | Owner | Callback log |
|---|---|---|---|
| LiveClaimContract | `POST /api/contracts/live-claim/claim` | S10 | `claimResult` |
| PaymentContract | `POST /api/contracts/payment/pay` | S12 | `payConfirmed` after approval |
| FulfillmentContract | internal `packOrder` / `packDone` | S12 | `packDone` |
| DeliveryContract | `POST /api/contracts/delivery/status-update` | S12 | `statusUpdate` |

## Role and Module Access

| Module | Roles |
|---|---|
| Lokasi | view: penyortir, admin, pemilik; write: admin, pemilik |
| Gudang, laundry, grade, opname | penyortir; pemilik read only |
| Item tersedia dan detail terbatas | host |
| Promosi | admin, pemilik |
| Live selling | host, admin |
| Pelanggan, tagihan, pembayaran, pengiriman | admin |
| Pesanan | admin, pemilik |
| Pengemasan | pengemas, admin |
| Laporan dan strategi | pemilik |
| Notifikasi sendiri | semua role |
| Audit dan log notifikasi | pemilik, admin |
