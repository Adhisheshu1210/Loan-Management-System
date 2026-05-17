import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const demoUsers = [
  { name: "Admin", email: "admin@lms.com", phone: "9000000001", password: "Admin@123", role: "ADMIN" as const },
  { name: "Sales", email: "sales@lms.com", phone: "9000000002", password: "Sales@123", role: "SALES" as const },
  { name: "Sanction", email: "sanction@lms.com", phone: "9000000003", password: "Sanction@123", role: "SANCTION" as const },
  { name: "Disbursement", email: "disbursement@lms.com", phone: "9000000004", password: "Disbursement@123", role: "DISBURSEMENT" as const },
  { name: "Collection", email: "collection@lms.com", phone: "9000000005", password: "Collection@123", role: "COLLECTION" as const },
  { name: "Borrower", email: "borrower@lms.com", phone: "9000000006", password: "Borrower@123", role: "BORROWER" as const },
];

async function seed() {
  await connectDatabase();
  await User.deleteMany({ email: { $in: demoUsers.map((user) => user.email) } });
  const records = await Promise.all(
    demoUsers.map(async (user) =>
      User.create({
        ...user,
        password: await hashPassword(user.password),
      }),
    ),
  );
  console.log(`Seeded ${records.length} users`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
