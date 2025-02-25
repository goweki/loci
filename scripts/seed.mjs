import mongoPromise from "../src/lib/mongodb.mjs"; // Adjust path as needed
import bcrypt from "bcrypt";

const saltRounds = process.env.BCRYPT_SALTROUNDS;

async function seedDatabase() {
  if (!saltRounds) {
    console.error("missing environment variable - BCRYPT_SALTROUNDS.");
    return 1;
  }

  try {
    const mongodb = await mongoPromise; // Connect to MongoDB
    const db = mongodb.db("loci-test"); // Replace with your database name
    const userCollection = db.collection("users");

    // Sample data (Hash passwords before insertion)
    const seedUserData = await Promise.all(
      [
        {
          name: "Admin Loci",
          email: "admin@goweki.com",
          password: "pass1234",
          role: "admin",
        },
        {
          name: "Client Loci",
          email: "client@goweki.com.com",
          password: "pass1234",
          role: "client",
        },
        {
          name: "User Loci",
          email: "user@goweki.com",
          password: "pass1234",
          role: "",
        },
      ].map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, +saltRounds), // Hash password
      }))
    );

    // Insert data (Avoid duplicate entries)
    await userCollection.deleteMany({}); // Optional: Clears existing data
    await userCollection.insertMany(seedUserData);

    console.log("✅ Database seeding successful!");
    process.exit(); // Exit script after completion
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
