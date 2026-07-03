require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const startSlaScheduler = require('./src/modules/sla/sla.scheduler');
const startMosScheduler = require('./src/modules/mos/mos.scheduler');
const startReportScheduler = require('./src/modules/reports/report.scheduler');
const startCalendarScheduler = require('./src/modules/calendar/calendar.scheduler');

const PORT = process.env.PORT || 5500;

// Connect to Database
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startSlaScheduler();
    startMosScheduler();
    startReportScheduler();
    startCalendarScheduler();
  });
});
