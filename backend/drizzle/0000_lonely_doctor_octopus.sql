CREATE TABLE `test_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','in_progress','completed','archived') NOT NULL DEFAULT 'draft',
	`complexity` int NOT NULL DEFAULT 1,
	`is_automated` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `test_items_id` PRIMARY KEY(`id`)
);
