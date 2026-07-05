const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const defaultUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/release-management';
    
    try {
      // First try to connect to a local MongoDB instance with a short timeout
      const conn = await mongoose.connect(defaultUri, { serverSelectionTimeoutMS: 2000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (localErr) {
      console.log('Local MongoDB not running. Falling back to in-memory database...');
      // If it fails, spin up an in-memory MongoDB
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`In-Memory MongoDB Connected at ${inMemoryUri}`);
    }

    // Ensure default admin user exists
    const User = require('../models/userModel');
    const adminExists = await User.findOne({ empId: 'admin' });
    if (!adminExists) {
      await User.create({ 
        name: 'Admin', 
        empId: 'admin', 
        email: 'admin@example.com',
        password: 'password123', 
        role: 'Super Admin', 
        status: 'Active' 
      });
      console.log('Created default admin user: admin / password123');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
