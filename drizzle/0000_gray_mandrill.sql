CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bales` (
	`id` text PRIMARY KEY NOT NULL,
	`supplier_id` text NOT NULL,
	`category` text NOT NULL,
	`weight_kg` real NOT NULL,
	`estimated_items` integer NOT NULL,
	`received_at` text NOT NULL,
	`location_id` text,
	`status` text NOT NULL,
	`received_by` text NOT NULL,
	FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bale_status" CHECK("bales"."status" in ('stored','sorting','sorted'))
);
--> statement-breakpoint
CREATE INDEX `bale_location` ON `bales` (`location_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `claim_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`live_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`source` text NOT NULL,
	`source_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text NOT NULL,
	`raw_text` text NOT NULL,
	`extraction` text,
	FOREIGN KEY (`live_id`) REFERENCES `lives`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `batch_live` ON `claim_batches` (`live_id`);--> statement-breakpoint
CREATE TABLE `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`live_id` text NOT NULL,
	`line` integer NOT NULL,
	`handle` text NOT NULL,
	`item_code` text NOT NULL,
	`time` text NOT NULL,
	`milliseconds` integer,
	`error` text,
	`outcome` text NOT NULL,
	`reason` text NOT NULL,
	`order_id` text,
	FOREIGN KEY (`batch_id`) REFERENCES `claim_batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`live_id`) REFERENCES `lives`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_winner_per_item` ON `claims` (`item_code`) WHERE "claims"."outcome" = 'won';--> statement-breakpoint
CREATE UNIQUE INDEX `live_claim_line` ON `claims` (`live_id`,`line`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`handle` text NOT NULL,
	`phone` text NOT NULL,
	`is_member` integer NOT NULL,
	`deposit_balance` integer NOT NULL,
	`joined_at` text NOT NULL,
	CONSTRAINT "balance_nonnegative" CHECK("customers"."deposit_balance" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_handle_unique` ON `customers` (`handle`);--> statement-breakpoint
CREATE TABLE `deposit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `deposit_customer` ON `deposit_ledger` (`customer_id`);--> statement-breakpoint
CREATE TABLE `live_drafts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_history` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`status` text NOT NULL,
	`grade` text,
	`price` integer,
	`location_id` text,
	`actor_id` text,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `history_item_date` ON `inventory_history` (`item_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `invoice_events` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`occurred_at` text NOT NULL,
	`actor` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_order_id_unique` ON `invoices` (`order_id`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`bale_id` text NOT NULL,
	`category` text NOT NULL,
	`condition` text NOT NULL,
	`grade` text,
	`price` integer,
	`status` text NOT NULL,
	`location_id` text,
	`available_at` text,
	`sold_at` text,
	`outbound_at` text,
	`sorted_at` text NOT NULL,
	`sorted_by` text NOT NULL,
	`laundry_at` text,
	`order_id` text,
	FOREIGN KEY (`bale_id`) REFERENCES `bales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "item_status" CHECK("items"."status" in ('laundry','available','reserved','sold','outbound','returned','written-off')),
	CONSTRAINT "item_price" CHECK("items"."price" is null or "items"."price" > 0)
);
--> statement-breakpoint
CREATE INDEX `item_sold` ON `items` (`sold_at`);--> statement-breakpoint
CREATE INDEX `item_outbound` ON `items` (`outbound_at`);--> statement-breakpoint
CREATE INDEX `item_status_idx` ON `items` (`status`);--> statement-breakpoint
CREATE INDEX `item_location` ON `items` (`location_id`);--> statement-breakpoint
CREATE TABLE `live_items` (
	`live_id` text NOT NULL,
	`item_id` text NOT NULL,
	PRIMARY KEY(`live_id`, `item_id`),
	FOREIGN KEY (`live_id`) REFERENCES `lives`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lives` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`platform` text NOT NULL,
	`host_id` text NOT NULL,
	`status` text NOT NULL,
	`claims_processed` integer NOT NULL,
	`promotion_channels` text NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "live_status" CHECK("lives"."status" in ('draft','published','completed'))
);
--> statement-breakpoint
CREATE INDEX `live_host_date` ON `lives` (`host_id`,`scheduled_at`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text NOT NULL,
	`kind` text NOT NULL,
	CONSTRAINT "location_kind" CHECK("locations"."kind" in ('bale','rack'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locations_code_unique` ON `locations` (`code`);--> statement-breakpoint
CREATE TABLE `login_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`failures` integer NOT NULL,
	`window_at` integer NOT NULL,
	`locked_until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`action` text NOT NULL,
	`from_state` text NOT NULL,
	`to_state` text NOT NULL,
	`actor` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `movement_entity_date` ON `movements` (`entity_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `order_lines` (
	`order_id` text NOT NULL,
	`item_id` text NOT NULL,
	`category` text NOT NULL,
	`grade` text NOT NULL,
	`price` integer NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`order_id`, `item_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "line_price" CHECK("order_lines"."price" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_lines_item_id_unique` ON `order_lines` (`item_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`live_id` text,
	`created_at` text NOT NULL,
	`subtotal` integer NOT NULL,
	`member_discount` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`live_id`) REFERENCES `lives`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_money" CHECK("orders"."subtotal" >= 0 and "orders"."member_discount" >= 0 and "orders"."total" = "orders"."subtotal" - "orders"."member_discount" and "orders"."total" >= 0),
	CONSTRAINT "order_status" CHECK("orders"."status" in ('awaiting-payment','paid','packed','shipped','completed')),
	CONSTRAINT "order_payment" CHECK("orders"."payment_status" in ('unpaid','pending','approved'))
);
--> statement-breakpoint
CREATE INDEX `order_customer` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `packing` (
	`order_id` text PRIMARY KEY NOT NULL,
	`code_matches` integer NOT NULL,
	`condition_matches` integer NOT NULL,
	`packed` integer NOT NULL,
	`packed_at` text,
	`packed_by` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`submitted_at` text NOT NULL,
	`status` text NOT NULL,
	`proof` text,
	`reviewed_at` text,
	`reviewed_by` text,
	`rejection_reason` text,
	`balance_before` integer,
	`balance_after` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payment_amount" CHECK("payment_attempts"."amount" >= 0),
	CONSTRAINT "payment_method" CHECK("payment_attempts"."method" in ('transfer','deposit')),
	CONSTRAINT "payment_status" CHECK("payment_attempts"."status" in ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_approved_payment` ON `payment_attempts` (`order_id`) WHERE "payment_attempts"."status" = 'approved';--> statement-breakpoint
CREATE TABLE `picked_items` (
	`order_id` text NOT NULL,
	`item_id` text NOT NULL,
	PRIMARY KEY(`order_id`, `item_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `price_rules` (
	`category` text NOT NULL,
	`grade` text NOT NULL,
	`price` integer NOT NULL,
	PRIMARY KEY(`category`, `grade`),
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "rule_positive" CHECK("price_rules"."price" > 0)
);
--> statement-breakpoint
CREATE TABLE `operation_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`body_hash` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`bale_id` text NOT NULL,
	`category` text NOT NULL,
	`condition` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`bale_id`) REFERENCES `bales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text NOT NULL,
	`title` text NOT NULL,
	`date_time` text NOT NULL,
	`description` text NOT NULL,
	FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`courier` text NOT NULL,
	`tracking_number` text NOT NULL,
	`handed_over_at` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipments_order_id_unique` ON `shipments` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `courier_tracking_unique` ON `shipments` (`courier`,`tracking_number`);--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`created_at` text NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `strategies_month_unique` ON `strategies` (`month`);--> statement-breakpoint
CREATE TABLE `strategy_recipients` (
	`strategy_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`strategy_id`, `user_id`),
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_name_unique` ON `suppliers` (`name`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`original_name` text NOT NULL,
	`mime` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	CONSTRAINT "user_role" CHECK("users"."role" in ('owner','admin','penyortir','live-host','packing'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);