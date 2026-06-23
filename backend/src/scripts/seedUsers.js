require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/auth/user.model');
const Agency = require('../modules/accounts/agency.model');
const Brand = require('../modules/accounts/brand.model');

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcc_seo';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for seeding users...');

    // Clear existing data
    await User.deleteMany({});
    await Agency.deleteMany({});
    await Brand.deleteMany({});

    // Create Dummy Agency
    const agency = await Agency.create({
      name: 'Alpha Whitelabel Partners',
      email: 'admin@alpha.agency.com',
      domain: 'alpha.agency.com'
    });

    // Create Dummy Brand
    const brand = await Brand.create({
      name: 'Prestige Estates Direct',
    });

    const demoUsers = [
      // Platform Owner
      {
        email: 'superadmin@gmail.com',
        password: '#India123',
        role: 'supreme_super_admin'
      },
      // Platform Admin
      {
        email: 'admin@gmail.com',
        password: '#India123',
        role: 'admin'
      },
      // Agency Users
      {
        email: 'agencyadmin@gmail.com',
        password: '#India123',
        role: 'agency_super_admin',
        agencyId: agency._id
      },
      {
        email: 'agencymanager@gmail.com',
        password: '#India123',
        role: 'agency_manager',
        agencyId: agency._id
      },
      {
        email: 'agencyclient@gmail.com',
        password: '#India123',
        role: 'agency_client',
        agencyId: agency._id
      },
      // Brand Users
      {
        email: 'brandadmin@gmail.com',
        password: '#India123',
        role: 'brand_super_admin',
        brandId: brand._id
      },
      {
        email: 'brandmanager@gmail.com',
        password: '#India123',
        role: 'brand_manager',
        brandId: brand._id
      },
      {
        email: 'brandteam@gmail.com',
        password: '#India123',
        role: 'brand_team_user',
        brandId: brand._id
      }
    ];

    for (const u of demoUsers) {
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
