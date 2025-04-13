// prisma/seed.js
const { PrismaClient } = require('@prisma/client'); // Use require
const fs = require('fs/promises'); // Use require
const path = require('path'); // Use require

// *** Adjust path and ensure auth.js uses module.exports ***
// Make sure src/utils/auth.js exports hashPassword using module.exports = { hashPassword, ... }
// Or if auth.js uses ES Modules (export), you might need dynamic import() or different setup.
// Assuming CommonJS export from auth.js for simplicity here:
// const { hashPassword } = require('../src/utils/auth'); // Relative path likely works fine

const prisma = new PrismaClient();

// --- Configuration ---
const SEED_DATA_PATH = path.join(__dirname, 'seed-data', 'hotels.json');
// Use environment variables for sensitive defaults if possible, otherwise hardcode carefully
const DEFAULT_OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || 'owner@flynext.com';
const DEFAULT_OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || 'password123'; // Load from .env

async function main() {
  // const { hashPassword } = await import('../src/utils/auth.js');
  console.log(`Start seeding ...`);

  // 1. Clean up previous data (Optional but recommended)
  console.log('Deleting existing hotel data (if any)...');
  try {
      // Order matters: Delete dependent records first if cascade isn't set everywhere needed
      await prisma.itinerary.deleteMany({}); // Depends on Booking
      await prisma.booking.deleteMany({}); // Depends on RoomType and Hotel
      await prisma.roomType.deleteMany({}); // Depends on Hotel
      await prisma.hotel.deleteMany({}); // Now safe to delete hotels
      console.log('Existing hotel, room type, and booking data deleted.');
  } catch (error) {
       console.warn("Could not delete all previous data (might be first run):", error.message);
  }

  // Delete specific owner if needed (use with caution)
  // try {
  //    await prisma.user.deleteMany({ where: { email: DEFAULT_OWNER_EMAIL } });
  //    console.log('Deleted previous default owner.');
  // } catch (error) { /* Ignore if not found */ }


  // 2. Create or Find Default Owner User
  console.log(`Ensuring default owner user ${DEFAULT_OWNER_EMAIL} exists...`);
  let owner = await prisma.user.findUnique({ where: { email: DEFAULT_OWNER_EMAIL } });
  if (!owner) {
      if (!DEFAULT_OWNER_PASSWORD) {
           console.error("Error: Default owner password is not set. Cannot create owner.");
           process.exit(1);
      }
      // const hashedPassword = await hashPassword(DEFAULT_OWNER_PASSWORD);
      const hashedPassword = "password123"; // Replace with actual hash function call
      owner = await prisma.user.create({
          data: {
              email: DEFAULT_OWNER_EMAIL,
              password: hashedPassword,
              firstName: 'Default',
              lastName: 'Owner',
              phoneNumber: '0000000000', // Dummy phone number
          },
      });
      console.log(`Created owner user with ID: ${owner.id}`);
  } else {
       console.log(`Owner user ${DEFAULT_OWNER_EMAIL} already exists with ID: ${owner.id}`);
  }
  const ownerId = owner.id;

  // 3. Read Hotel Seed Data
  console.log(`Reading hotel seed data from ${SEED_DATA_PATH}...`);
  let hotelsData = [];
  try {
      const jsonData = await fs.readFile(SEED_DATA_PATH, 'utf-8');
      hotelsData = JSON.parse(jsonData);
       if (!Array.isArray(hotelsData)) throw new Error("Seed data is not a JSON array.");
      console.log(`Read ${hotelsData.length} hotel records from JSON.`);
  } catch (error) {
       console.error(`Error reading or parsing ${SEED_DATA_PATH}:`, error);
       console.log('Cannot proceed without valid seed data. Stopping seed.');
       // Exit gracefully if seed data is essential and missing/invalid
       await prisma.$disconnect();
       process.exit(1); // Exit script if file error
  }


  // 4. Create Hotels and Room Types
  console.log(`Creating ${hotelsData.length} hotels...`);
  let createdCount = 0;
  for (const hotelData of hotelsData) {
    // Basic check for essential hotel data
    if (!hotelData || !hotelData.name || !hotelData.address || !hotelData.location) {
        console.warn("Skipping hotel record due to missing name, address, or location:", hotelData);
        continue;
    }

    try {
        const roomTypesInput = Array.isArray(hotelData.roomTypes) ? hotelData.roomTypes : [];

         // Sanitize room type data before nested create
         const sanitizedRoomTypes = roomTypesInput.map(rt => {
             // Basic check for essential room data
             if (!rt || !rt.name || rt.pricePerNight == null || rt.availableRooms == null) {
                 console.warn(`Skipping room type due to missing data for hotel "${hotelData.name}":`, rt);
                 return null; // Mark as null to filter out later
             }
             const price = Number(rt.pricePerNight);
             const rooms = parseInt(String(rt.availableRooms), 10); // Ensure integer

             return { // Return object structure expected by Prisma create nested write
                 name: String(rt.name), // Ensure string
                 amenities: (Array.isArray(rt.amenities) ? rt.amenities : [])
                             .map(a => String(a).trim()) // Ensure strings/trim
                             .filter(Boolean),
                 pricePerNight: !isNaN(price) && price >= 0 ? price : 0, // Default price to 0 if invalid
                 availableRooms: !isNaN(rooms) && rooms >= 0 ? rooms : 0, // Default rooms to 0 if invalid
                 images: (Array.isArray(rt.images) ? rt.images : []) // Prisma expects Json, pass array
                           .map(img => String(img).trim()) // Ensure strings/trim
                           .filter(url => url && url.length > 10 && (url.startsWith('http') || url.startsWith('/'))),
             };
         }).filter(Boolean); // Filter out any null entries from failed sanitization


        // Prepare hotel data
        const hotelCreateData = {
            name: String(hotelData.name),
            address: String(hotelData.address),
            location: String(hotelData.location),
            starRating: hotelData.starRating ? Number(hotelData.starRating) : null,
            logoUrl: hotelData.logoUrl || null,
             // Prisma expects JSON for the 'images' field, so pass the array directly
            images: (Array.isArray(hotelData.images) ? hotelData.images : [])
                       .map(img => String(img).trim())
                       .filter(url => url && url.length > 10 && (url.startsWith('http') || url.startsWith('/'))),
            ownerId: ownerId,
            roomTypes: {
                create: sanitizedRoomTypes, // Use the sanitized room types array
            },
        };

        const hotel = await prisma.hotel.create({ data: hotelCreateData });
        createdCount++;
        console.log(`(${createdCount}/${hotelsData.length}) Created hotel: ${hotel.name} (ID: ${hotel.id}) with ${sanitizedRoomTypes.length} room types.`);

    } catch (e) {
         console.error(`Error creating hotel "${hotelData.name}":`, e.message);
         // Log the problematic data for easier debugging
         // console.error("Problematic hotel data:", JSON.stringify(hotelData, null, 2));
         // Continue to next hotel even if one fails
    }
  }

  console.log(`Seeding finished. Created ${createdCount} hotels.`);
}

main()
  .catch((e) => {
    console.error("Seeding script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting Prisma Client...");
    await prisma.$disconnect();
  });