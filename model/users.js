import { pgTable, serial, varchar, text, foreignKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  division: varchar("division", { length: 10 }).notNull(),
  refresh_token: text("refresh_token"),
  profile_picture_url: text("profile_picture_url"),
});
