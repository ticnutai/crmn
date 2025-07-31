import { users, type User, type InsertUser, clients, type Client, type InsertClient, backups, type Backup, type InsertBackup, timeEntries, type TimeEntry, type InsertTimeEntry, invoices, type Invoice, type InsertInvoice, receipts, type Receipt, type InsertReceipt, expenses, type Expense, type InsertExpense, paymentStages, type PaymentStage, type InsertPaymentStage, clientFiles, type ClientFile, type InsertClientFile, messages, type Message, type InsertMessage, notifications, type Notification, type InsertNotification } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, count, desc, like } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Clients
  getClient(id: string, userId?: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>, userId?: string): Promise<Client | undefined>;
  deleteClient(id: string, userId?: string): Promise<boolean>;
  getAllClients(userId?: string): Promise<Client[]>;
  getClientsByStatus(status: string, userId?: string): Promise<Client[]>;

  // Backups
  getBackup(id: string): Promise<Backup | undefined>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  getAllBackups(): Promise<Backup[]>;
  deleteBackup(id: string): Promise<boolean>;

  // Time Entries
  getTimeEntries(userId?: string, clientId?: string, domain?: string, sessionId?: string): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>, userId?: string): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string, userId?: string): Promise<boolean>;

  // Invoices
  getInvoices(userId?: string, clientId?: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>, userId?: string): Promise<Invoice | undefined>;

  // Receipts
  getReceipts(userId?: string, clientId?: string): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;

  // Expenses
  getExpenses(userId?: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;

  // Payment Stages
  getPaymentStages(userId?: string, clientId?: string): Promise<PaymentStage[]>;
  createPaymentStage(paymentStage: InsertPaymentStage): Promise<PaymentStage>;
  updatePaymentStage(id: string, updates: Partial<InsertPaymentStage>, userId?: string): Promise<PaymentStage | undefined>;
  deletePaymentStage(id: string, userId?: string): Promise<boolean>;

  // Client Files
  getClientFiles(clientId: string): Promise<ClientFile[]>;
  createClientFile(clientFile: InsertClientFile): Promise<ClientFile>;
  updateClientFile(id: string, updates: Partial<InsertClientFile>): Promise<ClientFile | undefined>;
  deleteClientFile(id: string): Promise<boolean>;

  // Messages methods
  createMessage(data: InsertMessage): Promise<Message>;
  getMessages(userId: string): Promise<Message[]>;
  markMessageAsRead(id: string): Promise<Message | undefined>;

  // Notifications methods
  createNotification(data: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;

  // Stats
  getStats(): Promise<{
    totalClients: number;
    activeClients: number;
    totalUsers: number;
    totalBackups: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    console.log('Searching for user:', usernameOrEmail);

    // Try to find by username first (most common case)
    if (!usernameOrEmail.includes('@')) {
      const result = await db.select().from(users).where(eq(users.username, usernameOrEmail)).limit(1);
      if (result.length > 0) {
        console.log('Found user by username:', result[0].username);
        return result[0];
      }
    }

    // Try to find by email
    const result = await db.select().from(users).where(eq(users.email, usernameOrEmail)).limit(1);
    if (result.length > 0) {
      console.log('Found user by email:', result[0].email);
      return result[0];
    }

    console.log('User not found:', usernameOrEmail);
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      // First, delete all related time entries
      await db.delete(timeEntries).where(eq(timeEntries.clientId, id));

      // Then delete the client
      const result = await db.delete(clients).where(eq(clients.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  async deleteMultipleClients(ids: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let deletedCount = 0;

    for (const id of ids) {
      try {
        // First, delete all related time entries
        await db.delete(timeEntries).where(eq(timeEntries.clientId, id));

        // Then delete the client
        const result = await db.delete(clients).where(eq(clients.id, id));
        if ((result.rowCount ?? 0) > 0) {
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error deleting client ${id}:`, error);
        errors.push(`Failed to delete client ${id}`);
      }
    }

    return {
      success: errors.length === 0,
      deletedCount,
      errors
    };
  }

  async getAllClients(userId?: string): Promise<Client[]> {
    if (userId) {
      const user = await this.getUser(userId);
      if (user?.role === "admin") {
        return await db.select().from(clients);
      } else {
        return await db.select().from(clients).where(eq(clients.userId, userId));
      }
    }
    return await db.select().from(clients);
  }

  async getClientsByStatus(status: string, userId?: string): Promise<Client[]> {
    if (userId) {
      const user = await this.getUser(userId);
      if (user?.role === "admin") {
        return await db.select().from(clients).where(eq(clients.status, status));
      } else {
        return await db.select().from(clients).where(and(eq(clients.status, status), eq(clients.userId, userId)));
      }
    }
    return await db.select().from(clients).where(eq(clients.status, status));
  }

  // Backups
  async getBackup(id: string): Promise<Backup | undefined> {
    const [backup] = await db.select().from(backups).where(eq(backups.id, id));
    return backup || undefined;
  }

  async createBackup(insertBackup: InsertBackup): Promise<Backup> {
    const [backup] = await db
      .insert(backups)
      .values(insertBackup)
      .returning();
    return backup;
  }

  async getAllBackups(): Promise<Backup[]> {
    return await db.select().from(backups);
  }

  async deleteBackup(id: string): Promise<boolean> {
    const result = await db.delete(backups).where(eq(backups.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Time Entries
  async getTimeEntries(userId?: string, clientId?: string): Promise<TimeEntry[]> {
    const conditions = [];

    if (userId) {
      const user = await this.getUser(userId);
      if (user?.role !== "admin") {
        conditions.push(eq(timeEntries.userId, userId));
      }
    }

    if (clientId) {
      conditions.push(eq(timeEntries.clientId, clientId));
    }

    if (conditions.length === 0) {
      return await db.select().from(timeEntries).orderBy(desc(timeEntries.createdAt));
    }

    return await db
      .select()
      .from(timeEntries)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(timeEntries.createdAt));
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    // Ensure user exists, if not create a default user
    let existingUser;
    try {
      existingUser = await this.getUser(insertTimeEntry.userId);
    } catch (e) {
      existingUser = null;
    }

    if (!existingUser) {
      try {
        await this.createUser({
          username: `user_${insertTimeEntry.userId.slice(0, 8)}`,
          password: "default",
          email: `${insertTimeEntry.userId}@default.com`,
          fullName: "Auto Created User",
          role: "user"
        });
      } catch (createError) {
        console.log("User creation failed, might already exist:", createError);
      }
    }

    const [timeEntry] = await db
      .insert(timeEntries)
      .values(insertTimeEntry)
      .returning();
    return timeEntry;
  }

  async updateTimeEntry(id: string, updates: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db
      .update(timeEntries)
      .set(updates)
      .where(eq(timeEntries.id, id))
      .returning();
    return timeEntry || undefined;
  }

  async deleteTimeEntry(id: string, domain?: string): Promise<boolean> {
    const conditions = [eq(timeEntries.id, id)];

    // Add domain isolation for deletes
    if (domain) {
      conditions.push(eq(timeEntries.domain, domain));
    }

    const result = await db
      .delete(timeEntries)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Invoices
  async getInvoices(clientId?: string): Promise<Invoice[]> {
    if (clientId) {
      return await db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
    }
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: any): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  // Receipts
  async getReceipts(clientId?: string): Promise<Receipt[]> {
    if (clientId) {
      return await db.select().from(receipts).where(eq(receipts.clientId, clientId)).orderBy(desc(receipts.createdAt));
    }
    return await db.select().from(receipts).orderBy(desc(receipts.createdAt));
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const [receipt] = await db
      .insert(receipts)
      .values(insertReceipt)
      .returning();
    return receipt;
  }

  // Expenses
  async getExpenses(userId?: string): Promise<Expense[]> {
    if (userId) {
      return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.createdAt));
    }
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  async createExpense(insertExpense: any): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  // Payment Stages
  async getPaymentStages(userId?: string, clientId?: string): Promise<PaymentStage[]> {
    if (clientId) {
      return await db
        .select()
        .from(paymentStages)
        .where(eq(paymentStages.clientId, clientId))
        .orderBy(desc(paymentStages.createdAt));
    } else if (userId) {
      // אם לא מנהל, הצג רק של הלקוחות שלו
      const userClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId));
      const clientIds = userClients.map(c => c.id);
      if (clientIds.length === 0) {
        return [];
      }
      return await db
        .select()
        .from(paymentStages)
        .where(sql`${paymentStages.clientId} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(desc(paymentStages.createdAt));
    }

    return await db.select().from(paymentStages).orderBy(desc(paymentStages.createdAt));
  }

  async createPaymentStage(paymentStage: InsertPaymentStage): Promise<PaymentStage> {
    const [created] = await db.insert(paymentStages).values(paymentStage).returning();
    return created;
  }

  async updatePaymentStage(id: string, updates: Partial<InsertPaymentStage>, userId?: string): Promise<PaymentStage | undefined> {
    if (userId) {
      // ודא שהמשתמש יכול לעדכן רק שלבי תשלום של הלקוחות שלו
      const userClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId));
      const clientIds = userClients.map(c => c.id);
      if (clientIds.length === 0) {
        return undefined;
      }
      const [updated] = await db
        .update(paymentStages)
        .set(updates)
        .where(and(
          eq(paymentStages.id, id),
          sql`${paymentStages.clientId} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`
        ))
        .returning();
      return updated;
    }

    const [updated] = await db
      .update(paymentStages)
      .set(updates)
      .where(eq(paymentStages.id, id))
      .returning();
    return updated;
  }

  async deletePaymentStage(id: string, userId?: string): Promise<boolean> {
    if (userId) {
      // ודא שהמשתמש יכול למחוק רק שלבי תשלום של הלקוחות שלו
      const userClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, userId));
      const clientIds = userClients.map(c => c.id);
      if (clientIds.length === 0) {
        return false;
      }
      const result = await db
        .delete(paymentStages)
        .where(and(
          eq(paymentStages.id, id),
          sql`${paymentStages.clientId} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`
        ));
      return (result.rowCount ?? 0) > 0;
    }

    const result = await db.delete(paymentStages).where(eq(paymentStages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Stats
  async getStats(): Promise<{
    totalClients: number;
    activeClients: number;
    totalUsers: number;
    totalBackups: number;
  }> {
    const [clientsData, usersData, backupsData] = await Promise.all([
      db.select().from(clients),
      db.select().from(users),
      db.select().from(backups),
    ]);

    return {
      totalClients: clientsData.length,
      activeClients: clientsData.filter(c => c.status === 'active').length,
      totalUsers: usersData.length,
      totalBackups: backupsData.length,
    };
  }

  async ensureBasicUsers() {
    const basicUsers = [
      {
        username: "admin",
        password: "admin123",
        email: "admin@example.com",
        fullName: "מנהל המערכת",
        role: "admin",
      },
      {
        username: "admin2",
        password: "admin123",
        email: "admin@company.com",
        fullName: "מנהל חברה",
        role: "admin",
      },
      {
        username: "user1",
        password: "admin123",
        email: "user1@company.com",
        fullName: "משתמש 1",
        role: "user",
      },
      {
        username: "user2",
        password: "admin123",
        email: "user2@company.com",
        fullName: "משתמש 2",
        role: "user",
      },
      {
        username: "employee",
        password: "admin123",
        email: "employee@company.com",
        fullName: "עובד",
        role: "user",
      },
      {
        username: "client1",
        password: "user123",
        email: "client@test.com",
        fullName: "לקוח לדוגמה",
        role: "client",
      },
    ];

    for (const userData of basicUsers) {
      try {
        // בדיקה אם המשתמש כבר קיים
        const existingUser = await this.getUserByUsernameOrEmail(userData.email);
        if (!existingUser) {
          await this.createUser(userData);
          console.log(`✅ Created basic user: ${userData.username}`);
        }
      } catch (error) {
        console.log(`ℹ️ User ${userData.username} already exists or error:`, error);
      }
    }
  }

  // Client Files implementation
  async getClientFiles(clientId: string): Promise<ClientFile[]> {
    return await db.select().from(clientFiles).where(eq(clientFiles.clientId, clientId));
  }

  async createClientFile(clientFile: InsertClientFile): Promise<ClientFile> {
    const [created] = await db.insert(clientFiles).values(clientFile).returning();
    return created;
  }

  async updateClientFile(id: string, updates: Partial<InsertClientFile>): Promise<ClientFile | undefined> {
    const [updated] = await db.update(clientFiles).set(updates).where(eq(clientFiles.id, id)).returning();
    return updated;
  }

  async deleteClientFile(id: string): Promise<boolean> {
    const deletedResult = await db.delete(clientFiles).where(eq(clientFiles.id, id)).returning();
    return !!deletedResult.length;
  }

  // Messages implementation
  async createMessage(data: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(data).returning();
    return created;
  }

  async getMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const [updated] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  // Notifications implementation
  async createNotification(data: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(data).returning();
    return created;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();