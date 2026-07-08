const mongoose = require('mongoose');
require('dotenv').config();
const aiStudioController = require('./src/modules/aiStudio/aiStudio.controller');

const req = {
  body: { content: 'generate a cat' },
  companyId: '6a3b74b9a58b1b87f5d57df8',
  user: { _id: '6a3b74b9a58b1b87f5d57df8' }
};
const res = {
  status: (c) => ({
    json: (d) => console.log(JSON.stringify(d, null, 2))
  })
};

mongoose.connect('mongodb+srv://askevarajesh_db_user:Lvh6bG5Ir6X8kHC6@bcc.hhhks6y.mongodb.net/bcc')
  .then(() => {
    aiStudioController.sendMessage(req, res).then(() => process.exit(0));
  });
