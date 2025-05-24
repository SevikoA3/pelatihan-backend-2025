CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"division" varchar(10) NOT NULL,
	"refresh_token" text,
	"profile_picture_url" text
);
