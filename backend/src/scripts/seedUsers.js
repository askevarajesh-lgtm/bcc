require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcc_seo';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for seeding users...');

    const demoUsers = [
      {
        email: 'superadmin@gmail.com',
        password: '#India123',
        role: 'superadmin',
        workspaceId: new mongoose.Types.ObjectId('60d0fe4f5311236168a10000')
      },
      {
        email: 'admin@gmail.com',
        password: '#India123',
        role: 'admin',
        workspaceId: new mongoose.Types.ObjectId('60d0fe4f5311236168a10000')
      },
      {
        email: 'agency@gmail.com',
        password: '#India123',
        role: 'agency',
        workspaceId: new mongoose.Types.ObjectId('60d0fe4f5311236168a10000')
      },
      {
        email: 'client@gmail.com',
        password: '#India123',
        role: 'client',
        workspaceId: new mongoose.Types.ObjectId('60d0fe4f5311236168a10000')
      }
    ];

    for (const u of demoUsers) {
      // Remove existing entries to ensure fresh state
      await User.deleteOne({ email: u.email });
      
      // Create and save new instance
      const newUser = new User(u);
      await newUser.save();
      console.log(`Seeded user: ${u.email} (${u.role})`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
