import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  phno: varchar({ length: 15 }).notNull(),
});

export const cookiesTable = pgTable('cookies', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  websiteCookie: varchar({ length: 255 }).notNull(),
  cookie: varchar({ length: 255 }).notNull(),
  createdAt: integer().notNull(),
});
