require('dotenv').config();
const mongoose = require('mongoose');
const MasterItem = require('../modules/masterItems/masterItem.model');

const commercialTerms = `
### Commercial Terms
• Prices are exclusive of GST.
• Minimum engagement period: 9 months.
• Media spends, printing, production, photography, videography, hosting, domains and third-party subscriptions are excluded.
• Unused deliverables cannot be carried forward to subsequent months.
• Additional deliverables outside the package scope will be charged separately.`;

const generateDescription = (name, categories, access) => {
  let desc = `Comprehensive **${name}** package tailored for your brand's growth.\n\n`;
  desc += `**Core Deliverables:**\n`;
  categories.forEach(c => {
    desc += `- ${c.name}: ${c.count}\n`;
  });
  desc += `\n**Included Services & Access:**\n`;
  access.forEach(a => {
    desc += `- ${a.name}: ${a.value}\n`;
  });
  desc += `\n${commercialTerms}`;
  return desc;
};

const systemMasterItems = [
  {
    name: 'Mini',
    price: 50000,
    handlingDuration: '1 Month',
    categories: [
      { name: 'Social Media Creatives', count: 8 },
      { name: 'Reels / Video Editing', count: 1 },
      { name: 'GBP Posts', count: 2 }
    ],
    applicableAccess: [
      { name: 'Strategic Brand Consultation', value: 'Yes' },
      { name: 'Marketing Calendar', value: 'Annual' },
      { name: 'Monthly Strategy Meetings', value: '1' },
      { name: 'Website Maintenance', value: 'Yes' },
      { name: 'SEO Keywords', value: '5' },
      { name: 'Google Business Profile', value: 'Yes' },
      { name: 'Performance Report', value: 'Monthly' },
      { name: 'Monthly KPI Report', value: 'Yes' },
      { name: 'Executive Review', value: 'Quarterly' }
    ]
  },
  {
    name: 'Smart',
    price: 65000,
    handlingDuration: '1 Month',
    categories: [
      { name: 'Social Media Creatives', count: 12 },
      { name: 'Reels / Video Editing', count: 2 },
      { name: 'GBP Posts', count: 4 }
    ],
    applicableAccess: [
      { name: 'Strategic Brand Consultation', value: 'Yes' },
      { name: 'Marketing Calendar', value: 'Annual' },
      { name: 'Monthly Strategy Meetings', value: '1' },
      { name: 'Core Campaigns', value: '1' },
      { name: 'Website Maintenance', value: 'Yes' },
      { name: 'Landing Pages', value: '1' },
      { name: 'Blog Updates', value: '1' },
      { name: 'SEO Keywords', value: '10' },
      { name: 'Google Business Profile', value: 'Yes' },
      { name: 'Meta Campaigns', value: '1' },
      { name: 'Google Ads Campaigns', value: '1' },
      { name: 'Performance Report', value: 'Monthly' },
      { name: 'Monthly KPI Report', value: 'Yes' },
      { name: 'Executive Review', value: 'Quarterly' }
    ]
  },
  {
    name: 'Standard',
    price: 100000,
    handlingDuration: '1 Month',
    categories: [
      { name: 'Social Media Creatives', count: 20 },
      { name: 'Reels / Video Editing', count: 4 },
      { name: 'GBP Posts', count: 8 }
    ],
    applicableAccess: [
      { name: 'Strategic Brand Consultation', value: 'Yes' },
      { name: 'Marketing Calendar', value: 'Annual' },
      { name: 'Monthly Strategy Meetings', value: '2' },
      { name: 'Core Campaigns', value: '2' },
      { name: 'Marketing Video Edit', value: '1' },
      { name: 'Website Maintenance', value: 'Yes' },
      { name: 'Landing Pages', value: '2' },
      { name: 'Blog Updates', value: '2' },
      { name: 'SEO Keywords', value: '20' },
      { name: 'Google Business Profile', value: 'Yes' },
      { name: 'Meta Campaigns', value: '1' },
      { name: 'Google Ads Campaigns', value: '1' },
      { name: 'Performance Report', value: 'Weekly' },
      { name: 'Monthly KPI Report', value: 'Yes' },
      { name: 'Executive Review', value: 'Monthly' }
    ]
  },
  {
    name: 'Corporate',
    price: 200000,
    handlingDuration: '1 Month',
    categories: [
      { name: 'Social Media Creatives', count: 30 },
      { name: 'Reels / Video Editing', count: 8 },
      { name: 'GBP Posts', count: 12 }
    ],
    applicableAccess: [
      { name: 'Strategic Brand Consultation', value: 'Yes' },
      { name: 'Marketing Calendar', value: 'Annual' },
      { name: 'Monthly Strategy Meetings', value: '4' },
      { name: 'Core Campaigns', value: '4' },
      { name: 'Marketing Video Edit', value: '2' },
      { name: 'Website Maintenance', value: 'Yes' },
      { name: 'Landing Pages', value: '4' },
      { name: 'Blog Updates', value: '4' },
      { name: 'SEO Keywords', value: '30' },
      { name: 'Google Business Profile', value: 'Yes' },
      { name: 'Meta Campaigns', value: '2' },
      { name: 'Google Ads Campaigns', value: '2' },
      { name: 'Performance Report', value: 'Weekly' },
      { name: 'Monthly KPI Report', value: 'Yes' },
      { name: 'Executive Review', value: 'Monthly' }
    ]
  },
  {
    name: 'Ultimate',
    price: 300000,
    handlingDuration: '1 Month',
    categories: [
      { name: 'Social Media Creatives', count: 40 },
      { name: 'Reels / Video Editing', count: 12 },
      { name: 'GBP Posts', count: 16 }
    ],
    applicableAccess: [
      { name: 'Strategic Brand Consultation', value: 'Yes' },
      { name: 'Marketing Calendar', value: 'Annual' },
      { name: 'Monthly Strategy Meetings', value: 'Weekly' },
      { name: 'Core Campaigns', value: '6' },
      { name: 'Marketing Video Edit', value: '4' },
      { name: 'Website Maintenance', value: 'Yes' },
      { name: 'Landing Pages', value: '6' },
      { name: 'Blog Updates', value: '8' },
      { name: 'SEO Keywords', value: '50' },
      { name: 'Google Business Profile', value: 'Yes' },
      { name: 'Meta Campaigns', value: '3' },
      { name: 'Google Ads Campaigns', value: '3' },
      { name: 'Performance Report', value: 'Daily' },
      { name: 'Monthly KPI Report', value: 'Yes' },
      { name: 'Executive Review', value: 'Monthly' }
    ]
  }
];

const seedSystemMasterItems = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to DB');
    }

    const packageNames = systemMasterItems.map(p => p.name);

    // Hard delete any old sample data that were created as System items but are not in the exact 5 list.
    const deleteResult = await MasterItem.deleteMany({
      isSystem: true,
      name: { $nin: packageNames }
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`Deleted ${deleteResult.deletedCount} old/sample system items.`);
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const itemData of systemMasterItems) {
      // Add description and isSystem before saving
      const item = {
        ...itemData,
        description: generateDescription(itemData.name, itemData.categories, itemData.applicableAccess),
        isSystem: true
      };

      const existing = await MasterItem.findOne({ name: item.name, isSystem: true, isDeleted: false });
      if (!existing) {
        await MasterItem.create(item);
        createdCount++;
        console.log(`Created system package: ${item.name}`);
      } else {
        await MasterItem.updateOne({ _id: existing._id }, { $set: item });
        updatedCount++;
        console.log(`Updated system package: ${item.name}`);
      }
    }

    console.log(`Seeding complete. Created: ${createdCount}, Updated: ${updatedCount}`);
  } catch (error) {
    console.error('Error seeding system master items:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  seedSystemMasterItems().then(() => process.exit(0)).catch(() => process.exit(1));
} else {
  module.exports = seedSystemMasterItems;
}
