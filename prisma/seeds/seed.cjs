/**
 * Comprehensive Seed Script for CMS Database (Kochi City Edition)
 * Generates 6 months of realistic complaint data for Kochi Municipal Corporation
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Configuration
const MONTHS_OF_DATA = 6;
const COMPLAINTS_PER_MONTH = 50;
const TOTAL_COMPLAINTS = MONTHS_OF_DATA * COMPLAINTS_PER_MONTH;

// Complaint type configurations
const COMPLAINT_TYPES = [
  { name: 'Water Supply', priority: 'HIGH', slaHours: 24 },
  { name: 'Electricity', priority: 'HIGH', slaHours: 12 },
  { name: 'Road Repair', priority: 'MEDIUM', slaHours: 72 },
  { name: 'Waste Management', priority: 'MEDIUM', slaHours: 48 },
  { name: 'Street Lighting', priority: 'LOW', slaHours: 48 },
  { name: 'Drainage', priority: 'HIGH', slaHours: 24 },
  { name: 'Air Pollution', priority: 'MEDIUM', slaHours: 48 },
  { name: 'Noise Pollution', priority: 'LOW', slaHours: 72 }
];
 
// Ward configurations for Kochi
const WARDS = [
  { name: 'Ward 1 - Fort Kochi', subZones: ['Parade Ground', 'Princess Street', 'Veli'] },
  { name: 'Ward 2 - Mattancherry', subZones: ['Jew Town', 'Palace Road', 'Chullickal'] },
  { name: 'Ward 3 - Edappally', subZones: ['Lulu Mall Area', 'Toll Junction', 'Ponekkara'] },
  { name: 'Ward 4 - Vyttila', subZones: ['Mobility Hub', 'Gold Souk', 'Kaniyampuzha'] },
  { name: 'Ward 5 - Palarivattom', subZones: ['Pipeline Road', 'Bypass Junction', 'Thammanam'] },
  { name: 'Ward 6 - Ernakulam Central', subZones: ['MG Road', 'Marine Drive', 'High Court Junction'] }
];

// Status distribution weights
const STATUS_WEIGHTS = {
  CLOSED: 0.50,
  RESOLVED: 0.20,
  IN_PROGRESS: 0.15,
  ASSIGNED: 0.10,
  REGISTERED: 0.03,
  REOPENED: 0.02
};

// Priority distribution
const PRIORITY_WEIGHTS = {
  LOW: 0.30,
  MEDIUM: 0.45,
  HIGH: 0.20,
  CRITICAL: 0.05
};

// Helper functions
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

function weightedRandom(weights) {
  const items = Object.keys(weights);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= weights[item];
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function calculateSLAStatus(submittedOn, deadline, resolvedOn, currentStatus) {
  if (currentStatus === 'RESOLVED' || currentStatus === 'CLOSED') {
    return 'COMPLETED';
  }
  const now = new Date();
  const daysRemaining = (deadline - now) / (1000 * 60 * 60 * 24);
  if (daysRemaining < 0) return 'OVERDUE';
  if (daysRemaining <= 1) return 'WARNING';
  return 'ON_TIME';
}

function generateComplaintDescription(type) {
  const descriptions = {
    'Water Supply': ['No water supply in the area for the past 2 days', 'Low water pressure affecting multiple households', 'Pipe burst near main junction'],
    'Electricity': ['Frequent power cuts in the locality', 'Power outage for more than 6 hours', 'Transformer sparking'],
    'Road Repair': ['Large pothole causing accidents', 'Road surface completely damaged', 'Manhole cover missing'],
    'Waste Management': ['Garbage not collected for 3 days', 'Overflowing dustbins attracting pests', 'Illegal dumping in vacant lot'],
    'Street Lighting': ['Street lights not working for a week', 'Multiple street lights damaged', 'Light pole leaning dangerously'],
    'Drainage': ['Blocked drainage causing waterlogging', 'Sewage overflow in residential area', 'Foul smell from drain'],
    'Air Pollution': ['Industrial smoke affecting air quality', 'Construction dust pollution', 'Burning of plastic waste'],
    'Noise Pollution': ['Loud music from commercial establishment', 'Construction noise during restricted hours']
  };
  return randomElement(descriptions[type] || ['General complaint regarding ' + type]);
}

function generateLocation(wardName, subZone) {
  const landmarks = ['Near St. Francis Church', 'Near Jewish Synagogue', 'Near Lulu Mall', 'Near Vyttila Hub', 'Near Marine Drive Walkway', 'Opposite Town Hall'];

  // Base coordinates for each ward in Kochi
  const wardCoordinates = {
    'Ward 1 - Fort Kochi': { lat: 9.9658, lng: 76.2421 },
    'Ward 2 - Mattancherry': { lat: 9.9573, lng: 76.2599 },
    'Ward 3 - Edappally': { lat: 10.0244, lng: 76.3079 },
    'Ward 4 - Vyttila': { lat: 9.9696, lng: 76.3218 },
    'Ward 5 - Palarivattom': { lat: 10.0034, lng: 76.3071 },
    'Ward 6 - Ernakulam Central': { lat: 9.9816, lng: 76.2797 }
  };

  const baseCoords = wardCoordinates[wardName] || { lat: 9.9312, lng: 76.2673 };

  // Add small random variation (±0.01 degrees, roughly ±1km)
  const lat = baseCoords.lat + (Math.random() - 0.5) * 0.02;
  const lng = baseCoords.lng + (Math.random() - 0.5) * 0.02;

  return {
    area: subZone,
    landmark: randomElement(landmarks),
    address: `${randomInt(1, 999)}, ${subZone}, ${wardName}, Kochi`,
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6))
  };
}

// Main seeding function
async function main() {
  console.log('🌱 Starting comprehensive database seeding for Kochi City...\n');
  const startTime = Date.now();

  try {
    // Step 0: System Configuration
    console.log('⚙️  Creating System Configuration...');
    const systemConfigs = [
      { key: 'APP_NAME', value: 'KMC CMS', description: 'Application name for Kochi Municipal Corporation', type: 'application' },
      { key: 'APP_LOGO_URL', value: '/logo.png', description: 'URL for the application logo', type: 'application' },
      { key: 'APP_LOGO_SIZE', value: 'large', description: 'Size of the application logo', type: 'application' },
      { key: 'COMPLAINT_ID_PREFIX', value: 'KMC', description: 'Prefix for complaint IDs', type: 'complaint' },
      { key: 'COMPLAINT_ID_START_NUMBER', value: '1', description: 'Starting number for complaint ID sequence', type: 'complaint' },
      { key: 'COMPLAINT_ID_LENGTH', value: '5', description: 'Length of the numeric part in complaint IDs', type: 'complaint' },
      { key: 'DEFAULT_SLA_HOURS', value: '48', description: 'Default SLA time in hours', type: 'system' },
      { key: 'ADMIN_EMAIL', value: 'admin@kochi.gov.in', description: 'Administrator email address', type: 'administration' },
      { key: 'AUTO_ASSIGN_COMPLAINTS', value: 'true', description: 'Automatically assign complaints to ward officers', type: 'system' },
      { key: 'MAP_DEFAULT_LAT', value: '9.9312', description: 'Default map center latitude (Kochi)', type: 'mapping' },
      { key: 'MAP_DEFAULT_LNG', value: '76.2673', description: 'Default map center longitude (Kochi)', type: 'mapping' },
      { key: 'MAP_SEARCH_PLACE', value: 'Kochi, Kerala, India', description: 'Place context appended to searches', type: 'mapping' },
      { key: 'CONTACT_HELPLINE', value: '+91-484-2369007', description: 'Helpline phone number', type: 'contact' },
      { key: 'CONTACT_EMAIL', value: 'secretary@kochicorporation.co.in', description: 'Official support email', type: 'contact' },
      { key: 'CONTACT_OFFICE_ADDRESS', value: 'Kochi Municipal Corporation, PB No. 1016, Ernakulam, Kochi - 682011, Kerala, India', description: 'Official office address', type: 'contact' },
      { key: 'NOTIFICATION_SETTINGS', value: '{"email":true,"sms":false}', description: 'Notification preferences', type: 'notification' },
      { key: 'CITIZEN_REGISTRATION_ENABLED', value: 'true', description: 'Allow citizen self-registration', type: 'citizen' }
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value, description: config.description, type: config.type, isActive: true },
        create: { key: config.key, value: config.value, description: config.description, type: config.type, isActive: true }
      });
    }
    console.log(`✅ Created ${systemConfigs.length} system configuration entries\n`);

    // Step 1: Create Wards and SubZones
    console.log('📍 Creating Wards and SubZones...');
    const wardMap = new Map();
    const subZoneMap = new Map();

    for (const wardData of WARDS) {
      const ward = await prisma.ward.upsert({
        where: { name: wardData.name },
        update: {},
        create: { name: wardData.name, description: `${wardData.name} area`, isActive: true }
      });
      wardMap.set(wardData.name, ward);

      for (const subZoneName of wardData.subZones) {
        const existingSubZone = await prisma.subZone.findFirst({
          where: { wardId: ward.id, name: subZoneName }
        });

        let subZone;
        if (existingSubZone) {
          subZone = await prisma.subZone.update({
            where: { id: existingSubZone.id },
            data: { description: `${subZoneName} area`, isActive: true }
          });
        } else {
          subZone = await prisma.subZone.create({
            data: { name: subZoneName, wardId: ward.id, description: `${subZoneName} area`, isActive: true }
          });
        }
        subZoneMap.set(`${wardData.name}:${subZoneName}`, subZone);
      }
    }
    console.log(`✅ Created ${wardMap.size} wards and ${subZoneMap.size} sub-zones\n`);

    // Step 2: Create Complaint Types
    console.log('📋 Creating Complaint Types...');
    const complaintTypeMap = new Map();

    for (const typeData of COMPLAINT_TYPES) {
      const complaintType = await prisma.complaintType.upsert({
        where: { name: typeData.name },
        update: { priority: typeData.priority, slaHours: typeData.slaHours },
        create: {
          name: typeData.name,
          description: `Issues related to ${typeData.name.toLowerCase()}`,
          priority: typeData.priority,
          slaHours: typeData.slaHours,
          isActive: true
        }
      });
      complaintTypeMap.set(typeData.name, complaintType);
    }
    console.log(`✅ Created ${complaintTypeMap.size} complaint types\n`);

    // Step 3: Create Users
    console.log('👥 Creating Users...');

    const adminPassword = await hashPassword('admin@123');
    const admin = await prisma.user.upsert({
      where: { email: 'admin@kochi.gov.in' },
      update: {},
      create: {
        email: 'admin@kochi.gov.in',
        fullName: 'System Administrator (Kochi)',
        password: adminPassword,
        role: 'ADMINISTRATOR',
        phoneNumber: '+919876543210',
        isActive: true,
        language: 'en'
      }
    });

    const citizens = [];
    for (let i = 1; i <= 20; i++) {
      const citizen = await prisma.user.upsert({
        where: { email: `citizen${i}@example.com` }, // Keeping generic email for demo simplicity
        update: {},
        create: {
          email: `citizen${i}@example.com`,
          fullName: `Citizen User ${i}`,
          password: await hashPassword('password123'),
          role: 'CITIZEN',
          phoneNumber: `+9198765432${String(i).padStart(2, '0')}`,
          isActive: true,
          language: 'en'
        }
      });
      citizens.push(citizen);
    }

    const wardOfficers = [];
    let officerIndex = 1;
    for (const [wardName, ward] of wardMap) {
      const officer = await prisma.user.upsert({
        where: { email: `wardofficer${officerIndex}@kochi.gov.in` },
        update: {},
        create: {
          email: `wardofficer${officerIndex}@kochi.gov.in`,
          fullName: `Ward Officer ${officerIndex}`,
          password: await hashPassword('password123'),
          role: 'WARD_OFFICER',
          wardId: ward.id,
          phoneNumber: `+9198000000${String(officerIndex).padStart(2, '0')}`,
          isActive: true,
          language: 'en'
        }
      });
      wardOfficers.push(officer);
      officerIndex++;
    }

    const maintenanceTeam = [];
    let teamIndex = 1;
    for (const [wardName, ward] of wardMap) {
      for (let i = 0; i < 2; i++) {
        const member = await prisma.user.upsert({
          where: { email: `maintenance${teamIndex}@kochi.gov.in` },
          update: {},
          create: {
            email: `maintenance${teamIndex}@kochi.gov.in`,
            fullName: `Maintenance Team ${teamIndex}`,
            password: await hashPassword('password123'),
            role: 'MAINTENANCE_TEAM',
            wardId: ward.id,
            phoneNumber: `+9197000000${String(teamIndex).padStart(2, '0')}`,
            isActive: true,
            language: 'en'
          }
        });
        maintenanceTeam.push(member);
        teamIndex++;
      }
    }

    console.log(`✅ Created 1 admin, ${citizens.length} citizens, ${wardOfficers.length} ward officers, ${maintenanceTeam.length} maintenance team members\n`);

    // Step 4: Generate Complaints
    console.log(`📝 Generating ${TOTAL_COMPLAINTS} complaints over ${MONTHS_OF_DATA} months...\n`);

    const now = new Date();

    // Find the highest existing complaint ID (KMC prefix) to avoid duplicates
    const existingComplaints = await prisma.complaint.findMany({
      where: {
        complaintId: {
          startsWith: 'KMC'
        }
      },
      select: { complaintId: true },
      orderBy: { complaintId: 'desc' },
      take: 1
    });

    let complaintCounter = 1;
    if (existingComplaints.length > 0) {
      const lastId = existingComplaints[0].complaintId;
      const lastNumber = parseInt(lastId.replace('KMC', ''));
      complaintCounter = lastNumber + 1;
      console.log(`   ℹ️  Found existing complaints, starting from KMC${String(complaintCounter).padStart(5, '0')}\n`);
    }

    const complaints = [];

    for (let i = 0; i < TOTAL_COMPLAINTS; i++) {
      const daysAgo = randomInt(0, 180);
      const submittedOn = addDays(now, -daysAgo);

      const complaintTypeData = randomElement(COMPLAINT_TYPES);
      const complaintType = complaintTypeMap.get(complaintTypeData.name);
      const wardData = randomElement(WARDS);
      const ward = wardMap.get(wardData.name);
      const subZoneName = randomElement(wardData.subZones);
      const subZone = subZoneMap.get(`${wardData.name}:${subZoneName}`);

      const citizen = randomElement(citizens);
      const priority = weightedRandom(PRIORITY_WEIGHTS);
      const deadline = addHours(submittedOn, complaintTypeData.slaHours);
      const status = weightedRandom(STATUS_WEIGHTS);

      let assignedOn = null;
      let resolvedOn = null;
      let closedOn = null;
      let wardOfficerId = null;
      let maintenanceTeamId = null;

      const assignedWardOfficer = wardOfficers.find(wo => wo.wardId === ward.id);
      const wardMaintenanceTeam = maintenanceTeam.filter(mt => mt.wardId === ward.id);

      if (status !== 'REGISTERED') {
        assignedOn = addHours(submittedOn, randomInt(1, 6));
        wardOfficerId = assignedWardOfficer?.id || null;

        if (status !== 'ASSIGNED') {
          maintenanceTeamId = randomElement(wardMaintenanceTeam)?.id || null;

          if (status === 'RESOLVED' || status === 'CLOSED' || status === 'REOPENED') {
            const willBreachSLA = Math.random() < 0.3;
            if (willBreachSLA) {
              resolvedOn = addHours(deadline, randomInt(1, complaintTypeData.slaHours));
            } else {
              const percentageOfSLA = 0.5 + Math.random() * 0.4;
              resolvedOn = addHours(submittedOn, Math.floor(complaintTypeData.slaHours * percentageOfSLA));
            }

            if (status === 'CLOSED') {
              closedOn = addDays(resolvedOn, randomInt(1, 7));
            } else if (status === 'REOPENED') {
              resolvedOn = null;
              closedOn = null;
            }
          }
        }
      }

      const slaStatus = calculateSLAStatus(submittedOn, deadline, resolvedOn || closedOn, status);
      const location = generateLocation(wardData.name, subZoneName);
      const complaintId = `KMC${String(complaintCounter).padStart(5, '0')}`;
      complaintCounter++;

      const complaint = await prisma.complaint.create({
        data: {
          complaintId,
          title: `${complaintTypeData.name} Issue in ${subZoneName}`,
          description: generateComplaintDescription(complaintTypeData.name),
          type: complaintTypeData.name,
          complaintTypeId: complaintType.id,
          status,
          priority,
          slaStatus,
          wardId: ward.id,
          subZoneId: subZone.id,
          area: location.area,
          landmark: location.landmark,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          contactName: citizen.fullName,
          contactEmail: citizen.email,
          contactPhone: citizen.phoneNumber,
          isAnonymous: Math.random() < 0.1,
          submittedById: citizen.id,
          wardOfficerId,
          maintenanceTeamId,
          submittedOn,
          assignedOn,
          resolvedOn,
          closedOn,
          deadline,
          rating: status === 'CLOSED' ? randomInt(3, 5) : null
        }
      });

      complaints.push(complaint);

      if ((i + 1) % 50 === 0) {
        console.log(`   ✓ Generated ${i + 1}/${TOTAL_COMPLAINTS} complaints`);
      }
    }

    console.log(`\n✅ Successfully generated ${complaints.length} complaints\n`);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('═══════════════════════════════════════');
    console.log(`✨ Seeding completed successfully in ${duration}s!`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
