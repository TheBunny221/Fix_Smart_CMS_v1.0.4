import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Static IDs provided in requirements
const USER_ID = "cmjqw957o0005rhvvwqsq9kje";
const WARD_ID = "cmjqqzdag00159kyoxm2lnqu5";
const SUB_ZONE_ID = "cmjqr3nnd00179k14hsawa7d8";

const COMPLAINT_TITLES = [
  "Garbage not collected",
  "Street light not working",
  "Water leakage on main road",
  "Potholes causing traffic",
  "Illegal dumping near park"
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const COMPLAINT_CATEGORY = "Civic Issue";

async function main() {
  console.log('Start seeding complaints...');

  // Ensure database connection
  await prisma.$connect();

  try {
    for (let i = 0; i < 5; i++) {
      const title = COMPLAINT_TITLES[i];
      // Cycle through priorities
      const priority = PRIORITIES[i % PRIORITIES.length];
      // Generate a unique complaint ID (e.g., KSC10000, KSC10001, etc.)
      const uniqueId = `KSC${10000 + i}`; 
      
      // Calculate timestamps relative to now to ensure a logical timeline
      // Complaint created 2 hours ago
      const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000); 
      // Registered status log at creation time
      const registeredAt = createdAt;
      // In Progress status log 1 hour after creation
      const inProgressAt = new Date(createdAt.getTime() + 1 * 60 * 60 * 1000);
      // Resolved status log 2 hours after creation (now)
      const resolvedAt = new Date(); // roughly now

      console.log(`Creating complaint ${i + 1}/5: ${title} (${uniqueId})`);

      // Create the complaint
      const complaint = await prisma.complaint.create({
        data: {
          complaintId: uniqueId,
          title: title,
          description: `This is a detailed description for the issue: "${title}". It has been observed in the Main Market Area and requires attention.`,
          type: COMPLAINT_CATEGORY,
          priority: priority, // CAST to Enum if not automatically handled, but Prisma client handles string matching to Enum
          status: 'RESOLVED', // Final status as per simulation
          wardId: WARD_ID,
          subZoneId: SUB_ZONE_ID,
          submittedById: USER_ID,
          area: "Main Market Area",
          contactPhone: "9876543210",
          address: "123 Civic Lane, Sector 4",
          submittedOn: createdAt,
          updatedAt: resolvedAt,
        }
      });

      console.log(`  - Created Complaint ID: ${complaint.id}`);

      // Create Status Logs
      // 1. REGISTERED
      await prisma.statusLog.create({
        data: {
          complaintId: complaint.id,
          userId: USER_ID,
          fromStatus: null, // Initial state has no previous status
          toStatus: 'REGISTERED',
          comment: 'Complaint registered successfully.',
          timestamp: registeredAt
        }
      });
      console.log(`  - Logged status: REGISTERED`);

      // 2. IN_PROGRESS
      await prisma.statusLog.create({
        data: {
          complaintId: complaint.id,
          userId: USER_ID,
          fromStatus: 'REGISTERED',
          toStatus: 'IN_PROGRESS',
          comment: 'Maintenance team has been assigned and work started.',
          timestamp: inProgressAt
        }
      });
      console.log(`  - Logged status: IN_PROGRESS`);

      // 3. RESOLVED
      await prisma.statusLog.create({
        data: {
          complaintId: complaint.id,
          userId: USER_ID,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'RESOLVED',
          comment: 'Issue has been resolved and verified.',
          timestamp: resolvedAt
        }
      });
      console.log(`  - Logged status: RESOLVED`);
    }

    console.log('Seeding finished successfully.');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
