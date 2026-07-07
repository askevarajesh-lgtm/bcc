const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://askevarajesh_db_user:Lvh6bG5Ir6X8kHC6@bcc.hhhks6y.mongodb.net/bcc').then(async () => {
  const User = require('./src/modules/auth/user.model');
  
  // Revert the two users "Task" and "Designer Bcc" who were erroneously assigned to the boat brand
  const result = await User.updateMany(
    { 
      email: { $in: ['designer@gmail.com', 'task@gmail.com'] }, 
      role: 'user', 
      brandId: '6a3b79d164fe6b4f7a937acc' 
    },
    { $set: { brandId: null } }
  );
  
  console.log(`Successfully reverted ${result.modifiedCount} users back to their proper agencies.`);
  process.exit(0);
});
