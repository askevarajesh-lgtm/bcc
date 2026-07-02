const ReportSchedule = require('./reportSchedule.model');
const SentReport = require('./sentReport.model');
const User = require('../auth/user.model'); 

// Import other services to gather data if needed in future (e.g. mosService, analyticsService)

exports.createSchedule = async (scheduleData) => {
    const schedule = new ReportSchedule(scheduleData);
    await schedule.save();
    return schedule;
};

exports.getSchedules = async (agencyId) => {
    return await ReportSchedule.find({ agencyId })
        .populate('clientId', 'name companyName')
        .sort({ createdAt: -1 });
};

exports.updateScheduleStatus = async (scheduleId, status) => {
    return await ReportSchedule.findByIdAndUpdate(scheduleId, { status }, { new: true });
};

exports.deleteSchedule = async (scheduleId) => {
    return await ReportSchedule.findByIdAndDelete(scheduleId);
};

exports.getRecentSentReports = async (agencyId) => {
    return await SentReport.find({ agencyId })
        .populate('clientId', 'name companyName')
        .sort({ sentAt: -1 })
        .limit(50);
};

// Generates a report (either manually triggered or via cron)
exports.generateAndSendReport = async (agencyId, clientId, template, scheduleId = null, recipients = [], deliveryMethod = 'Email', generatedBy = null) => {
    
    // 1. Fetch Client Details
    const client = await User.findById(clientId);
    if (!client) throw new Error('Client not found');

    // 2. Gather Data from connected modules (Mocked data gathering process to simulate processing time)
    // In a real scenario, we would call:
    // const analyticsData = await analyticsService.getAnalyticsForClient(clientId);
    // const mosData = await mosService.getClientMOS(clientId);
    // etc...

    // 3. Generate PDF (Mock implementation as requested)
    // Using a public dummy PDF URL so the download button actually downloads a file
    const dummyPdfUrl = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
    let pages = 1;
    if (template === 'Monthly Performance Report') pages = 14;
    else if (template === 'SEO Ranking Report') pages = 7;
    else if (template === 'Paid Media Report') pages = 9;

    // 4. Send via Email/WhatsApp (Mock tracking)
    // Normally we would invoke the email service here.

    // 5. Store delivery history
    const sentReport = new SentReport({
        agencyId,
        clientId,
        scheduleId,
        name: `${client.companyName || client.name} - ${template}`,
        template,
        deliveredTo: recipients,
        deliveryMethod,
        pages,
        downloadUrl: dummyPdfUrl,
        generatedBy,
        status: 'Sent'
    });

    await sentReport.save();

    return sentReport;
};

// Cron Job helper to process due schedules
exports.processDueSchedules = async () => {
    const now = new Date();
    // Find active schedules where nextSend is in the past
    const dueSchedules = await ReportSchedule.find({
        status: 'Active',
        nextSend: { $lte: now }
    });

    for (const schedule of dueSchedules) {
        try {
            await this.generateAndSendReport(
                schedule.agencyId,
                schedule.clientId,
                schedule.template,
                schedule._id,
                schedule.recipients,
                schedule.deliveryMethod
            );

            // Calculate next send date based on frequency
            const next = new Date(schedule.nextSend);
            switch (schedule.frequency) {
                case 'Daily': next.setDate(next.getDate() + 1); break;
                case 'Weekly': next.setDate(next.getDate() + 7); break;
                case 'Bi-weekly': next.setDate(next.getDate() + 14); break;
                case 'Monthly': next.setMonth(next.getMonth() + 1); break;
                case 'Quarterly': next.setMonth(next.getMonth() + 3); break;
            }
            schedule.nextSend = next;
            await schedule.save();

        } catch (error) {
            console.error(`Failed to process report schedule ${schedule._id}:`, error);
        }
    }
};
