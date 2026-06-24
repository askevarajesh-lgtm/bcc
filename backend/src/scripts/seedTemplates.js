const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Template = require('../models/Template');

// Load environment variables from .env file
dotenv.config({ path: __dirname + '/../../.env' });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/m1growth_db";

const websiteTemplates = [
  { name: "Premium Digital", category: "Digital Marketing Agency", type: "website", thumbnailColor: "var(--accent-primary)", featuresCount: 1 },
  { name: "Growth Spark Media", category: "Digital Marketing Agency", type: "website", thumbnailColor: "var(--accent-info)", featuresCount: 1 },
  { name: "Pixel Reach Agency", category: "Digital Marketing Agency", type: "website", thumbnailColor: "var(--accent-secondary)", featuresCount: 1 },
  { name: "Elevate Marketing Group", category: "Digital Marketing Agency", type: "website", thumbnailColor: "var(--accent-warning)", featuresCount: 1 },
  { name: "Apex Realty Partners", category: "Real Estate Company", type: "website", thumbnailColor: "var(--accent-danger)", featuresCount: 1 },
  { name: "Urban Dwelling Properties", category: "Real Estate Company", type: "website", thumbnailColor: "var(--text-primary)", featuresCount: 1 }
];

const storeTemplates = [
  { name: "AutoSphere", category: "Automotive", type: "store", thumbnailColor: "var(--accent-primary)", featuresCount: 1 },
  { name: "DriveNest", category: "Automotive", type: "store", thumbnailColor: "var(--text-primary)", featuresCount: 1 },
  { name: "TurboKart", category: "Automotive", type: "store", thumbnailColor: "var(--accent-warning)", featuresCount: 1 },
  { name: "MotoCraft", category: "Automotive", type: "store", thumbnailColor: "var(--accent-info)", featuresCount: 1 },
  { name: "BabyBloom", category: "Baby & Kids", type: "store", thumbnailColor: "var(--accent-danger)", featuresCount: 1 },
  { name: "TinyTots", category: "Baby & Kids", type: "store", thumbnailColor: "var(--accent-secondary)", featuresCount: 1 }
];

const funnelTemplates = [
  { name: "Lead Gen Pro", category: "Digital Marketing Agency", type: "funnel", thumbnailColor: "var(--accent-primary)", featuresCount: 1 },
  { name: "Webinar Funnel", category: "Digital Marketing Agency", type: "funnel", thumbnailColor: "var(--accent-info)", featuresCount: 1 },
  { name: "Consultation Booking", category: "Business Coaching", type: "funnel", thumbnailColor: "var(--accent-warning)", featuresCount: 1 },
  { name: "Product Launch", category: "E-Commerce", type: "funnel", thumbnailColor: "var(--accent-secondary)", featuresCount: 1 }
];

const formTemplates = [
  { name: "Test Drive Booking", category: "Automotive", type: "form", thumbnailColor: "var(--accent-primary)", featuresCount: 1 },
  { name: "Service Appointment", category: "Automotive", type: "form", thumbnailColor: "var(--text-primary)", featuresCount: 1 },
  { name: "Towing & Roadside", category: "Automotive", type: "form", thumbnailColor: "var(--accent-warning)", featuresCount: 1 },
  { name: "Trade-in Valuation", category: "Automotive", type: "form", thumbnailColor: "var(--accent-info)", featuresCount: 1 },
  { name: "Salon Booking", category: "Beauty & Fashion", type: "form", thumbnailColor: "var(--accent-danger)", featuresCount: 1 },
  { name: "Skincare Consultation", category: "Beauty & Fashion", type: "form", thumbnailColor: "var(--accent-secondary)", featuresCount: 1 }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const allTemplates = [
      ...websiteTemplates,
      ...storeTemplates,
      ...funnelTemplates,
      ...formTemplates
    ];

    console.log('Clearing existing templates...');
    await Template.deleteMany({});

    console.log('Seeding templates...');
    await Template.insertMany(allTemplates);
    
    console.log(`Successfully seeded ${allTemplates.length} templates.`);
  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
