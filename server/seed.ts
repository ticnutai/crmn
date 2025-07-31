import { db } from "./db";
import { users, clients, backups } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Add admin user
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "admin",
      password: "admin123",
      email: "admin@example.com",
      fullName: "מנהל המערכת",
      role: "admin",
    })
    .returning();

  console.log("✅ Admin user created:", adminUser.username);

  // Add default users for quick login
  const defaultUsers = [
    {
      username: "employee",
      password: "emp123",
      email: "employee@company.com",
      fullName: "עובד",
      role: "user",
    },
    {
      username: "manager",
      password: "manager123",
      email: "manager@company.com",
      fullName: "מנהל צוות",
      role: "manager",
    },
    {
      username: "testuser",
      password: "test123",
      email: "testuser@company.com",
      fullName: "משתמש בדיקה",
      role: "user",
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
      username: "client1",
      password: "user123",
      email: "client@test.com",
      fullName: "לקוח לדוגמה",
      role: "client",
    },
  ];

  for (const userData of defaultUsers) {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    console.log("✅ Default user created:", user.username);
  }

  // Add sample clients
  const sampleClients = [
    {
      name: "חברת הייטק ישראל",
      email: "contact@hitech.co.il",
      phone: "03-1234567",
      company: "הייטק ישראל בע״מ",
      position: "מנהל טכנולוגיות",
      status: "active",
      notes: "לקוח פוטנציאלי לפרויקט גדול",
    },
    {
      name: "שרה כהן",
      email: "sarah@marketing.co.il",
      phone: "054-9876543",
      company: "קמפיין שיווק",
      position: "מנהלת שיווק",
      status: "active",
      notes: "עובדת על קמפיין חדש",
    },
    {
      name: "דוד לוי",
      email: "david@consulting.com",
      phone: "02-5551234",
      company: "ייעוץ עסקי בע״מ",
      position: "יועץ עסקי",
      status: "pending",
      notes: "מתעניין בשירותי ייעוץ",
    },
  ];

  for (const clientData of sampleClients) {
    const [client] = await db.insert(clients).values({
      ...clientData,
      userId: "default-user",
    }).returning();
    console.log("✅ Client created:", client.name);
  }

  // Add sample backup
  const [backup] = await db
    .insert(backups)
    .values({
      filename: "initial_backup_2025-07-27.json",
      size: 1024567,
      status: "completed",
    })
    .returning();

  console.log("✅ Sample backup created:", backup.filename);
  console.log("🎉 Database seeded successfully!");
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export { seed };