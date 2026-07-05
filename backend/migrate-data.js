require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

async function migrateData() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB.');
    const db = mongoose.connection.db;

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const collectionName = file.replace('.json', '');
      const filePath = path.join(dataDir, file);
      
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.warn(`Could not parse ${file}. Skipping.`);
        continue;
      }

      if (Array.isArray(data) && data.length > 0) {
        // Drop existing collection to prevent duplicates if ran multiple times
        try {
          await db.collection(collectionName).drop();
        } catch (e) {
          // Ignore if collection doesn't exist
        }

        const result = await db.collection(collectionName).insertMany(data);
        console.log(`Migrated ${result.insertedCount} records to '${collectionName}' collection.`);
      } else if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
        // For single object files like appSettings.json or whatsappConfig.json
        try {
          await db.collection(collectionName).drop();
        } catch (e) {}

        await db.collection(collectionName).insertOne(data);
        console.log(`Migrated 1 object to '${collectionName}' collection.`);
      } else {
        console.log(`Skipped '${collectionName}': No data found.`);
      }
    }

    console.log('Data migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
