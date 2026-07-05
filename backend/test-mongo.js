require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const uri = "mongodb://MADI:gSnIjfXOhhU7JtHz@ac-7e0ahcw-shard-00-00.2jq39hr.mongodb.net:27017,ac-7e0ahcw-shard-00-01.2jq39hr.mongodb.net:27017,ac-7e0ahcw-shard-00-02.2jq39hr.mongodb.net:27017/release-management?ssl=true&replicaSet=atlas-w0pc8b-shard-0&authSource=admin&retryWrites=true&w=majority";
  console.log('Testing connection to MongoDB...');
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Success! Connected to MongoDB Atlas at ${conn.connection.host}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect to MongoDB:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
