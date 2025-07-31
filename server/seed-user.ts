import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function createDefaultUser() {
  console.log("🌱 יוצר משתמשים בסיסיים...");

  // List of users to create
  const defaultUsers = [
    {
      username: "admin",
      password: "admin123",
      email: "admin@example.com",
      fullName: "מנהל המערכת",
      role: "admin" as const,
    },
    {
      username: "employee", 
      password: "emp123",
      email: "employee@example.com",
      fullName: "עובד המערכת",
      role: "user" as const,
    },
    {
      username: "manager",
      password: "manager123", 
      email: "manager@example.com",
      fullName: "מנהל צוות",
      role: "manager" as const,
    },
    {
      username: "testuser",
      password: "test123",
      email: "testuser@example.com", 
      fullName: "משתמש בדיקה",
      role: "user" as const,
    }
  ];

  for (const userData of defaultUsers) {
    // Check if user exists
    const userExists = await db.select().from(users).where(eq(users.username, userData.username)).limit(1);

    if (userExists.length === 0) {
      try {
        const newUser = await db
          .insert(users)
          .values(userData)
          .returning();
        console.log(`✅ משתמש ${userData.username} נוצר בהצלחה`);
      } catch (error) {
        console.error(`❌ שגיאה ביצירת משתמש ${userData.username}:`, error);
      }
    } else {
      console.log(`ℹ️ משתמש ${userData.username} כבר קיים`);
    }
  }
}