const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bcc').then(async () => {
  try {
    await mongoose.connection.collection('websites').dropIndex('domainId_1');
    console.log('Index dropped');
  } catch(e) {
    console.log(e.message);
  }
  try {
    await mongoose.connection.collection('websites').updateMany({domainId: null}, { $unset: { domainId: "" } });
    console.log('Null domainIds unset');
  } catch(e) {
    console.log(e.message);
  }
  process.exit(0);
});
