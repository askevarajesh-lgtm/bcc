const mongoose = require('mongoose');
const MasterItem = require('./src/modules/masterItems/masterItem.model');

mongoose.connect('mongodb+srv://askevarajesh_db_user:Lvh6bG5Ir6X8kHC6@bcc.hhhks6y.mongodb.net/bcc')
  .then(async () => {
    console.log('Connected to DB');
    const result = await MasterItem.updateMany(
      { handlingDuration: { $exists: false } },
      { $set: { handlingDuration: '1 Month' } }
    );
    console.log('Updated Master Items:', result.modifiedCount);
    
    // Also update any that have null or empty string
    const result2 = await MasterItem.updateMany(
      { handlingDuration: { $in: [null, ""] } },
      { $set: { handlingDuration: '1 Month' } }
    );
    console.log('Updated empty Master Items:', result2.modifiedCount);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
