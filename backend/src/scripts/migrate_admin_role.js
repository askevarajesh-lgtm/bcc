require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/user.model'); // Adjust path as needed

async function migrateAdminRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/m1_agency_os');
    console.log('Connected to MongoDB.');

    // We use Model.collection.updateMany to bypass Mongoose enum validation temporarily 
    // since we haven't updated the schema yet. Wait, if we use mongoose model without updating the schema, it will throw an error if commander_admin is not in enum.
    // Let's just use the native driver to update to avoid enum validation errors.
    const result = await mongoose.connection.collection('users').updateMany(
      { role: 'admin' },
      { $set: { role: 'commander_admin' } }
    );

    console.log(`Migration complete. Modified ${result.modifiedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateAdminRole();
