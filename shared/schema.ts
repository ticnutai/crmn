import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  notes: text("notes"), // הערות על המשתמש
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  address: text("address"),
  price: decimal("price", { precision: 10, scale: 2 }),
  payment: text("payment"),
  status: text("status").notNull().default("active"), // active, inactive, pending
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const backups = pgTable("backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  status: text("status").notNull().default("completed"), // completed, failed, in_progress
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  domain: text("domain").notNull().default("default"), // Add domain isolation
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration").default(0), // in seconds
  description: text("description"),
  notes: text("notes"), // הערות לרשומת שעות עבודה
  isActive: boolean("is_active").default(false),
  isPaused: boolean("is_paused").default(false),
  pausedAt: timestamp("paused_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ILS"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sent, paid, overdue
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});



export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  receiptNumber: varchar("receipt_number", { length: 100 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ILS"),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  receiptDate: timestamp("receipt_date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// טבלת הוצאות
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  expenseNumber: varchar("expense_number", { length: 100 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("ILS"),
  category: varchar("category", { length: 100 }).notNull(), // משרד, נסיעות, ציוד וכו'
  supplier: text("supplier"), // ספק
  description: text("description"),
  expenseDate: timestamp("expense_date").notNull(),
  receiptImage: text("receipt_image"), // Base64 של התמונה
  isVatDeductible: boolean("is_vat_deductible").default(true),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// טבלת שלבי תשלום
export const paymentStages = pgTable("payment_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  stageName: varchar("stage_name", { length: 100 }).notNull(), // שם השלב
  plannedAmount: decimal("planned_amount", { precision: 10, scale: 2 }).notNull(), // הסכום המתוכנן
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"), // הסכום ששולם
  dueDate: timestamp("due_date"), // תאריך יעד
  paidDate: timestamp("paid_date"), // תאריך תשלום בפועל
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, partial, paid, overdue
  notes: text("notes"), // הערות
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().optional(),
  phone: z.string().optional(),
});

// Client Files table for storing uploaded files with persistent storage
export const clientFiles = pgTable('client_files', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  clientId: varchar('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  uploadedBy: varchar('uploaded_by').references(() => users.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  description: text('description'),
  tags: text('tags').array(),
  isPublic: boolean('is_public').default(false),
  driveFileId: text('drive_file_id'),
  fileData: text('file_data'), // Base64 encoded file data for persistent storage
});

// Cloud Folders table
export const cloudFolders = pgTable("cloud_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  folderName: text("folder_name").notNull(),
  driveId: text("drive_id"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientFileSchema = createInsertSchema(clientFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertBackupSchema = createInsertSchema(backups).omit({
  id: true,
  createdAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
  endTime: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
  pausedAt: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
  domain: z.string().optional(), // Domain for tenant isolation
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
}).extend({
  receiptDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  userId: true,
}).extend({
  expenseDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
});

export const insertPaymentStageSchema = createInsertSchema(paymentStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
  paidDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertClientFile = z.infer<typeof insertClientFileSchema>;
export type ClientFile = typeof clientFiles.$inferSelect;

export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertPaymentStage = z.infer<typeof insertPaymentStageSchema>;
export type PaymentStage = typeof paymentStages.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // Add relations if needed
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, video-call, voice-call
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, warning, success, error
  isRead: boolean("is_read").default(false),
  hasSound: boolean("has_sound").default(true),
  soundType: text("sound_type").default("default"), // default, urgent, gentle
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const clientsRelations = relations(clients, ({ many }) => ({
  timeEntries: many(timeEntries),
  invoices: many(invoices),
  receipts: many(receipts),
  paymentStages: many(paymentStages),
}));

export const backupsRelations = relations(backups, ({ many }) => ({
  // Add relations if needed
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  client: one(clients, {
    fields: [timeEntries.clientId],
    references: [clients.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  receipts: many(receipts),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  client: one(clients, {
    fields: [receipts.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [receipts.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentStagesRelations = relations(paymentStages, ({ one }) => ({
  client: one(clients, {
    fields: [paymentStages.clientId],
    references: [clients.id],
  }),
}));

export interface Stats {
  totalClients: number;
  activeClients: number;
  totalUsers: number;
  totalBackups: number;
}
