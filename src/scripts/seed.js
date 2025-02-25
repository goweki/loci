const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const saltRounds = +process.env.BCRYPT_SALTROUNDS;

const usersData = [
  {
    name: "Admin Loci",
    tel: "2547213334944",
    email: "admin@goweki.com",
    password: "pass1234",
    role: "admin",
  },
  {
    name: "Client Loci",
    email: "client@goweki.com",
    password: "pass1234",
    role: "client",
    devices: [
      {
        deviceID: "dev-001",
        deviceSN: "SN12345",
        notifications: [
          {
            date: new Date("2024-01-01T10:00:00Z"),
            type: "info",
            message: "detection",
          },
          {
            date: new Date("2024-02-15T12:30:00Z"),
            type: "warning",
            message: "detection",
          },
          {
            date: new Date("2024-02-15T12:30:00Z"),
            type: "critical",
            message: "detection",
          },
        ],
        deviceType: "sensor",
      },
      {
        deviceID: "dev-002",
        deviceSN: "SN67890",
        notifications: [
          {
            date: new Date("2024-01-01T10:00:00Z"),
            type: "info",
            message: "movement",
          },
          { date: new Date("2024-02-15T12:30:00Z"), message: "low power" },
        ],
        deviceType: "camera",
      },
    ],
  },
  {
    name: "User Loci",
    email: "user@goweki.com",
    password: "pass1234",
    role: "client",
  },
];

async function seed() {
  if (!saltRounds) {
    throw new Error("missing env variable BCRYPT_SALTROUNDS");
  }

  console.log("SEEDING....");

  // Clear existing data
  await prisma.user.deleteMany({});
  await prisma.device.deleteMany({});

  // Insert users without devices
  const usersToInsert = await Promise.all(
    usersData.map(async ({ devices, ...user }) => ({
      ...user,
      password: await bcrypt.hash(user.password, saltRounds), // Hash password securely
    }))
  );

  const userInsertResult = await prisma.user.createMany({
    data: usersToInsert,
  });
  console.log("✅ Users inserted!", userInsertResult);

  // Insert devices separately and link them to users
  const devicesToInsert = [];

  for (const user of usersData) {
    if (user.devices && user.devices.length > 0) {
      const user_ = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (user_) {
        const ownerId = user_.id;
        user.devices.forEach((device) => {
          devicesToInsert.push({ ...device, ownerId });
        });
      }
    }
  }

  if (devicesToInsert.length > 0) {
    const insertedDevices = await prisma.device.createMany({
      data: devicesToInsert,
    });
    console.log("✅ Devices inserted!", insertedDevices);
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
