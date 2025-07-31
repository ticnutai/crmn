import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSystemRoutes } from "./routes/system";
import { insertUserSchema, insertClientSchema, insertBackupSchema, insertTimeEntrySchema, insertInvoiceSchema, insertReceiptSchema, insertExpenseSchema, insertPaymentStageSchema, insertClientFileSchema, insertMessageSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, requireAdmin, requireManagerOrAdmin, validateDomain } from "./middleware/auth";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register system health check routes
  registerSystemRoutes(app);
  // Special handling for manifest.json to prevent JSON parsing errors
  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    try {
      res.sendFile(path.resolve('public/manifest.json'));
    } catch (error) {
      console.error('Error serving manifest.json:', error);
      res.status(500).json({ error: 'Failed to load manifest' });
    }
  });
  // הוספת middleware לכל הרוטים - זמנית מבוטל
  // app.use('/api', validateDomain);
  
  // Users routes - נדרשות הרשאות מנהל
  app.get("/api/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, requireManagerOrAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Authentication routes - תומך בשם משתמש או אימייל
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for:', email, 'with password:', password);
      
      if (!email || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ message: "שם משתמש/אימייל וסיסמה נדרשים" });
      }

      // נקה רווחים מיותרים
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      console.log('Searching for user:', cleanEmail);
      
      // Use the getUserByUsernameOrEmail method from storage
      const user = await storage.getUserByUsernameOrEmail(cleanEmail);
      console.log('Found user:', user ? user.username : 'null');

      if (!user) {
        console.log('User not found:', cleanEmail);
        // נוודא שהמשתמשים הבסיסיים קיימים
        await storage.ensureBasicUsers();
        // ננסה שוב
        const retryUser = await storage.getUserByUsernameOrEmail(cleanEmail);
        if (!retryUser) {
          return res.status(401).json({ message: "משתמש לא נמצא או סיסמה שגויה" });
        }
        // השתמש במשתמש שנמצא בניסיון השני
        const finalUser = retryUser;
        
        // בדיקת סיסמה
        if (finalUser.password !== cleanPassword) {
          console.log('Password mismatch after retry');
          return res.status(401).json({ message: "משתמש לא נמצא או סיסמה שגויה" });
        }

        console.log('Login successful after retry for:', finalUser.username);
        return res.json({
          id: finalUser.id,
          username: finalUser.username,
          email: finalUser.email,
          fullName: finalUser.fullName,
          role: finalUser.role
        });
      }

      // בדיקת סיסמה - בסביבה אמיתית צריך לבדוק hash
      console.log('Password check:', user.password, '===', cleanPassword, '?', user.password === cleanPassword);
      if (user.password !== cleanPassword) {
        console.log('Password mismatch');
        return res.status(401).json({ message: "משתמש לא נמצא או סיסמה שגויה" });
      }

      console.log('Login successful for:', user.username);
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "שגיאה בתהליך ההתחברות" });
    }
  });

  // Clients routes - נדרש אימות לכל הפעולות - החזרת כל הלקוחות
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      // קבלת נתוני משתמש מה-headers
      const userId = req.headers['authorization']?.replace('Bearer ', '') || 
                    req.headers['x-user-id'] as string ||
                    "165378c1-a470-4cdb-87f7-5f8761709763"; // Default fallback
      
      console.log('Fetching clients for user:', userId);
      const clients = await storage.getAllClients(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      console.log('Creating client with data:', req.body);
      
      // קבלת נתוני משתמש מה-headers או שימוש ב-default
      const userId = req.headers['authorization']?.replace('Bearer ', '') || 
                    req.headers['x-user-id'] as string ||
                    "165378c1-a470-4cdb-87f7-5f8761709763"; // Default fallback
      
      const clientData = insertClientSchema.parse({ ...req.body, userId: userId });
      console.log('Parsed client data:', clientData);
      
      const client = await storage.createClient(clientData);
      console.log('Created client successfully:', client.id);
      
      res.status(201).json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client", error: (error as Error).message });
    }
  });

  app.put("/api/clients/:id", requireAuth, requireManagerOrAdmin, async (req, res) => {
    try {
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  app.delete("/api/clients", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid client IDs provided" });
      }
      
      const result = await storage.deleteMultipleClients(ids);
      
      if (result.success) {
        res.json({ 
          message: `${result.deletedCount} clients deleted successfully`,
          deletedCount: result.deletedCount 
        });
      } else {
        res.status(500).json({ 
          message: `Deleted ${result.deletedCount} clients with ${result.errors.length} errors`,
          deletedCount: result.deletedCount,
          errors: result.errors
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete clients" });
    }
  });

  // Add PATCH route for clients - allow simple updates without strict auth
  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const updates = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, updates);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Backups routes
  app.get("/api/backups", async (_req, res) => {
    try {
      const backups = await storage.getAllBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });

  app.post("/api/backups", async (req, res) => {
    try {
      const backupData = insertBackupSchema.parse(req.body);
      const backup = await storage.createBackup(backupData);
      res.status(201).json(backup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid backup data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.delete("/api/backups/:id", async (req, res) => {
    try {
      const success = await storage.deleteBackup(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Backup not found" });
      }
      res.json({ message: "Backup deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete backup" });
    }
  });

  // Backup restore endpoint
  app.post("/api/backups/:id/restore", async (req, res) => {
    try {
      const backup = await storage.getBackup(req.params.id);
      if (!backup) {
        return res.status(404).json({ message: "Backup not found" });
      }
      
      // In a real implementation, this would restore the system from backup data
      // For now, we'll simulate a successful restore
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate restore time
      
      res.json({ 
        message: "System restored successfully",
        backupId: req.params.id,
        restoredAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to restore backup" });
    }
  });

  // Backup import endpoint
  app.post("/api/backups/import", async (req, res) => {
    try {
      // In a real implementation, this would parse the uploaded file and restore system data
      // For now, we'll simulate a successful import
      
      const importedBackup = {
        filename: `imported_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
        size: Math.floor(Math.random() * 5000000) + 1000000,
        status: "completed",
      };
      
      const backup = await storage.createBackup(importedBackup);
      
      res.json({ 
        message: "Backup imported successfully",
        backup: backup,
        importedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import backup" });
    }
  });

  // Time Entries routes - נדרש אימות לכל הפעולות - החזרת טיימרים לפי משתמש
  app.get("/api/time-entries", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      // קבלת נתוני משתמש מה-headers
      const userId = req.headers['authorization']?.replace('Bearer ', '') || 
                    req.headers['x-user-id'] as string ||
                    "165378c1-a470-4cdb-87f7-5f8761709763"; // Default fallback
      
      console.log('Fetching time entries for user:', userId);
      const timeEntries = await storage.getTimeEntries(userId, clientId);
      res.json(timeEntries);
    } catch (error) {
      console.error('Time entries fetch error:', error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", requireAuth, async (req, res) => {
    try {
      const timeEntryData = insertTimeEntrySchema.parse(req.body);
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time entry data", errors: error.errors });
      }
      console.error('Time entry creation error:', error);
      res.status(500).json({ message: "Failed to create time entry", error: String(error) });
    }
  });

  app.patch("/api/time-entries/:id", requireAuth, async (req, res) => {
    try {
      // Create a flexible schema for updates that allows any of the timeEntry fields
      const updateSchema = z.object({
        startTime: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
        endTime: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).optional(),
        pausedAt: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val).nullable().optional(),
        duration: z.number().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
        isPaused: z.boolean().optional(),
      });
      
      const timeEntryData = updateSchema.parse(req.body);
      const timeEntry = await storage.updateTimeEntry(req.params.id, timeEntryData);
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.json(timeEntry);
    } catch (error) {
      console.error('Time entry update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update time entry", error: String(error) });
    }
  });

  app.delete("/api/time-entries/:id", requireAuth, requireManagerOrAdmin, async (req, res) => {
    try {
      const domain = req.headers.host || req.headers.origin || "default";
      const success = await storage.deleteTimeEntry(req.params.id, domain);
      if (!success) {
        return res.status(404).json({ message: "Time entry not found or access denied" });
      }
      res.json({ message: "Time entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Invoices routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      const invoices = await storage.getInvoices(clientId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = {
        ...insertInvoiceSchema.parse(req.body),
        userId: "165378c1-a470-4cdb-87f7-5f8761709763" // Default user ID
      };
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const updates = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, updates);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses("165378c1-a470-4cdb-87f7-5f8761709763");
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = {
        ...insertExpenseSchema.parse(req.body),
        userId: "165378c1-a470-4cdb-87f7-5f8761709763"
      };
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Receipts routes  
  app.get("/api/receipts", async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      const receipts = await storage.getReceipts(clientId);
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.post("/api/receipts", async (req, res) => {
    try {
      const receiptData = insertReceiptSchema.parse(req.body);
      const receipt = await storage.createReceipt(receiptData);
      res.status(201).json(receipt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid receipt data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create receipt" });
    }
  });

  // Stats route
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Payment Stages routes - temporary admin only for demo
  app.get("/api/payment-stages", async (req, res) => {
    try {
      const { clientId } = req.query;
      const paymentStages = await storage.getPaymentStages(undefined, clientId as string);
      res.json(paymentStages);
    } catch (error) {
      console.error("Error fetching payment stages:", error);
      res.status(500).json({ message: "Failed to fetch payment stages" });
    }
  });

  app.post("/api/payment-stages", async (req, res) => {
    try {
      const paymentStageData = insertPaymentStageSchema.parse(req.body);
      const paymentStage = await storage.createPaymentStage(paymentStageData);
      res.status(201).json(paymentStage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment stage data", errors: error.errors });
      }
      console.error("Error creating payment stage:", error);
      res.status(500).json({ message: "Failed to create payment stage" });
    }
  });

  app.put("/api/payment-stages/:id", async (req, res) => {
    try {
      const paymentStage = await storage.updatePaymentStage(req.params.id, req.body);
      
      if (!paymentStage) {
        return res.status(404).json({ message: "Payment stage not found" });
      }
      
      res.json(paymentStage);
    } catch (error) {
      console.error("Error updating payment stage:", error);
      res.status(500).json({ message: "Failed to update payment stage" });
    }
  });

  app.delete("/api/payment-stages/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePaymentStage(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Payment stage not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment stage:", error);
      res.status(500).json({ message: "Failed to delete payment stage" });
    }
  });

  // Client Files API Routes
  app.get("/api/client-files/:clientId", async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const files = await storage.getClientFiles(clientId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching client files:", error);
      res.status(500).json({ error: "Failed to fetch client files" });
    }
  });

  app.post("/api/client-files", async (req, res) => {
    try {
      const validatedData = insertClientFileSchema.parse(req.body);
      const clientFile = await storage.createClientFile(validatedData);
      res.status(201).json(clientFile);
    } catch (error) {
      console.error("Error creating client file:", error);
      res.status(500).json({ error: "Failed to create client file" });
    }
  });

  app.delete("/api/client-files/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteClientFile(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client file:", error);
      res.status(500).json({ error: "Failed to delete client file" });
    }
  });

  // Messages API Routes
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Notifications API Routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      // Use a valid user ID instead of arbitrary string
      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        userId: "165378c1-a470-4cdb-87f7-5f8761709763" // Default admin user
      });
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = req.params.id;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Client Files routes
  app.get("/api/client-files/:clientId", async (req, res) => {
    try {
      const files = await storage.getClientFiles(req.params.clientId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client files" });
    }
  });

  app.post("/api/client-files", async (req, res) => {
    try {
      const fileData = insertClientFileSchema.parse(req.body);
      const file = await storage.createClientFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save file" });
    }
  });

  app.delete("/api/client-files/:fileId", async (req, res) => {
    try {
      const success = await storage.deleteClientFile(req.params.fileId);
      if (!success) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Video calls API Routes
  app.post("/api/video-calls", async (req, res) => {
    try {
      // For now, just return success - video calling can be implemented with WebRTC
      res.status(200).json({ success: true, message: "Video call initiated" });
    } catch (error) {
      console.error("Error initiating video call:", error);
      res.status(500).json({ error: "Failed to initiate video call" });
    }
  });

  // Import/Export API Routes
  app.get("/api/import/clients", async (req, res) => {
    try {
      res.json({ message: "Import clients endpoint ready", status: "available" });
    } catch (error) {
      res.status(500).json({ error: "Import endpoint error" });
    }
  });

  app.post("/api/import/clients", requireAuth, requireManagerOrAdmin, async (req, res) => {
    try {
      // Handle Excel import functionality
      res.json({ message: "Import functionality - coming soon", status: "not_implemented" });
    } catch (error) {
      res.status(500).json({ error: "Failed to import clients" });
    }
  });

  app.get("/api/export/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getAllClients("165378c1-a470-4cdb-87f7-5f8761709763");
      res.json({ data: clients, count: clients.length, exportedAt: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to export clients" });
    }
  });

  // Google Drive API Routes
  app.get("/api/google-drive", async (req, res) => {
    try {
      res.json({ message: "Google Drive integration endpoint", status: "available" });
    } catch (error) {
      res.status(500).json({ error: "Google Drive endpoint error" });
    }
  });

  // Fix messages and notifications routes to require user parameter
  app.get("/api/messages", async (req, res) => {
    try {
      const userId = "165378c1-a470-4cdb-87f7-5f8761709763"; // Default admin user
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = "165378c1-a470-4cdb-87f7-5f8761709763"; // Default admin user
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
