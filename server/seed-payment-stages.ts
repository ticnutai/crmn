import { storage } from "./storage";
import type { InsertPaymentStage } from "@shared/schema";

export async function seedPaymentStages() {
  try {
    // Get existing clients to reference
    const clients = await storage.getAllClients();
    if (clients.length === 0) {
      console.log("No clients found, skipping payment stages seeding");
      return;
    }

    const client = clients[0]; // Use first client for demo data

    const samplePaymentStages: InsertPaymentStage[] = [
      {
        clientId: client.id,
        stageName: "מקדמה",
        plannedAmount: "5000.00",
        paidAmount: "5000.00",
        status: "paid",
        dueDate: new Date("2024-01-15"),
        paidDate: new Date("2024-01-15"),
        notes: "מקדמה ראשונה לפרויקט",
      },
      {
        clientId: client.id,
        stageName: "תשלום ביניים",
        plannedAmount: "7500.00",
        paidAmount: "3000.00",
        status: "partial",
        dueDate: new Date("2024-02-15"),
        notes: "תשלום ביניים לאחר השלמת 50% מהעבודה",
      },
      {
        clientId: client.id,
        stageName: "תשלום סופי",
        plannedAmount: "7500.00",
        paidAmount: "0.00",
        status: "pending",
        dueDate: new Date("2024-03-15"),
        notes: "תשלום סופי בהשלמת הפרויקט",
      },
    ];

    for (const stage of samplePaymentStages) {
      try {
        await storage.createPaymentStage(stage);
        console.log(`Created payment stage: ${stage.stageName}`);
      } catch (error) {
        console.log(`Payment stage ${stage.stageName} already exists or error:`, error);
      }
    }

    console.log("Payment stages seeding completed");
  } catch (error) {
    console.error("Error seeding payment stages:", error);
  }
}