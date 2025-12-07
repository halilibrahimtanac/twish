ALTER TABLE `twishes` ADD `has_media` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `twishes` ADD `media_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `twishes` ADD `first_media_url` text;--> statement-breakpoint
ALTER TABLE `twishes` ADD `media_preview` text;