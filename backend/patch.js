const mongoose = require('mongoose');
const uri = 'mongodb+srv://askevarajesh_db_user:GiGBMJpdm1V1ElnF@bcclocal.tooajrr.mongodb.net/bcc';

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    await db.collection('users').updateOne(
      { email: 'tunepathclient@gmail.com' },
      { $set: { packageName: 'Master Plan', features: ['social', 'canva'] } }
    );
    console.log('Updated client!');
    process.exit(0);
  });
