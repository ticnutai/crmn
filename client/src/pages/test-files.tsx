import SimpleFileManager from '@/components/simple-file-manager';
import type { Client } from '@shared/schema';

export default function TestFiles() {
  // Test client object
  const testClient: Client = {
    id: "ff5b8af4-b89d-480b-b2dc-6a0c77015491",
    name: "לקוח בדיקה",
    email: "test@example.com",
    phone: "123456789",
    company: "חברת בדיקה",
    position: "",
    address: "",
    price: null,
    payment: "",
    status: "active",
    notes: "",
    userId: "165378c1-a470-4cdb-87f7-5f8761709763",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">בדיקת מערכת קבצים</h1>
      <SimpleFileManager client={testClient} />
    </div>
  );
}