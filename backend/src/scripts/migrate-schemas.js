require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import models
const User = require('../modules/auth/user.model');
const Agency = require('../modules/accounts/agency.model');
const Brand = require('../modules/accounts/brand.model');

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to Database. Starting migration...');

    // 1. Migrate Agencies
    const agencies = await Agency.find();
    console.log(`Found ${agencies.length} agencies to migrate.`);

    for (let agency of agencies) {
      let adminUser = await User.findOne({ agencyId: agency._id, role: { $in: ['agency_super_admin', 'agency_admin'] } });
      
      if (!adminUser) {
        console.log(`No admin found for agency: ${agency.name}. Creating dummy user...`);
        adminUser = new User({
          name: agency.name + ' Admin',
          email: agency.email || `admin@${agency._id}.dummy.com`,
          role: 'agency_super_admin',
        });
      }

      // Merge fields into admin user
      adminUser.companyName = agency.name;
      adminUser.logo = agency.logo;
      adminUser.domain = agency.domain;
      adminUser.plan = agency.plan;
      adminUser.status = agency.status;
      adminUser.allowedUsers = agency.allowedUsers;
      adminUser.mrr = agency.mrr;

      await adminUser.save();

      // Make it self-referencing
      adminUser.agencyId = adminUser._id;
      await adminUser.save();

      // Update other users belonging to this agency
      await User.updateMany(
        { agencyId: agency._id, _id: { $ne: adminUser._id } },
        { $set: { agencyId: adminUser._id } }
      );

      console.log(`Migrated agency: ${agency.name}`);
    }

    // 2. Migrate Brands
    const brands = await Brand.find();
    console.log(`Found ${brands.length} brands to migrate.`);

    for (let brand of brands) {
      let adminUser = await User.findOne({ brandId: brand._id, role: { $in: ['brand_super_admin', 'brand_admin'] } });

      if (!adminUser) {
        console.log(`No admin found for brand: ${brand.name}. Creating dummy user...`);
        adminUser = new User({
          name: brand.name + ' Admin',
          email: `admin@${brand._id}.dummy.com`,
          role: 'brand_super_admin',
        });
      }

      // Merge fields
      adminUser.companyName = brand.name;
      adminUser.logo = brand.logo;
      adminUser.isDirect = brand.isDirect;
      adminUser.packageName = brand.packageName;
      adminUser.features = brand.features;
      adminUser.status = brand.status;

      await adminUser.save();

      adminUser.brandId = adminUser._id;
      await adminUser.save();

      // Update other users
      await User.updateMany(
        { brandId: brand._id, _id: { $ne: adminUser._id } },
        { $set: { brandId: adminUser._id } }
      );

      console.log(`Migrated brand: ${brand.name}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
