CREATE TABLE `performanceMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`totalTrades` int NOT NULL DEFAULT 0,
	`winningTrades` int NOT NULL DEFAULT 0,
	`losingTrades` int NOT NULL DEFAULT 0,
	`totalPnl` int NOT NULL DEFAULT 0,
	`totalFees` int NOT NULL DEFAULT 0,
	`averageWin` int,
	`averageLoss` int,
	`winRate` int,
	`sharpeRatio` int,
	`maxDrawdown` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('BUY','SELL','CLOSE') NOT NULL,
	`type` enum('LONG','SHORT') NOT NULL,
	`entryPrice` int NOT NULL,
	`exitPrice` int,
	`size` int NOT NULL,
	`pnl` int,
	`fee` int NOT NULL,
	`reason` varchar(64) NOT NULL,
	`sharpeRatio` int,
	`volatility` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `performanceMetrics` ADD CONSTRAINT `performanceMetrics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trades` ADD CONSTRAINT `trades_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;