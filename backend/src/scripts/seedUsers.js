require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/auth/user.model');

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcc_seo';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for seeding users...');

    // Clear existing data
    await User.deleteMany({});

    const superAdmin = {
      name: 'Supreme Super Admin',
      email: 'superadmin@gmail.com',
      password: '#India123',
      role: 'supreme_super_admin'
    };

    const newUser = new User(superAdmin);
    await newUser.save();
    console.log(`Seeded user: ${superAdmin.email} (${superAdmin.role})`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
