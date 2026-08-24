const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://askevarajesh_db_user:8VdzZrQ8MwAtuZht@m1local.lp8xr7i.mongodb.net/bcc')
.then(async () => {
  const Page = require('./src/modules/websites/page.model.js');
  const pages = await Page.find({ html: { $regex: 'Lightning-fast performance' } }).limit(1);
  if(pages.length) {
    console.log("HTML:", pages[0].html.substring(0, 1500));
    console.log("CSS:", pages[0].css ? pages[0].css.substring(0, 500) : null);
  } else {
    console.log('not found');
  }
  process.exit(0);
}).catch(console.error);
