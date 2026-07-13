const cron = require('node-cron');
const Invoice = require('./invoice.model');
const { getNextGenerationDate } = require('./invoiceDateHelper');

const startInvoiceCron = () => {
  // Run daily at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily Retainer Invoice Generation job...');
      const now = new Date();
      
      // Find invoices that are Retainer, haven't been cancelled, and their nextGenerationDate is due
      const dueInvoices = await Invoice.find({
        invoiceType: 'Retainer',
        invoiceStatus: { $ne: 'Cancelled' },
        nextGenerationDate: { $lte: now }
      });
      
      for (const invoice of dueInvoices) {
        // Clone invoice details
        const count = await Invoice.countDocuments();
        const newInvoiceData = {
          invoiceNumber: `INV-${Date.now()}-${count + 1}`,
          proposalId: invoice.proposalId,
          clientId: invoice.clientId,
          amount: invoice.amount,
          tax: invoice.tax,
          discount: invoice.discount,
          grandTotal: invoice.grandTotal,
          paymentStatus: 'Pending',
          invoiceStatus: 'Draft',
          invoiceType: 'Retainer',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Default due date 7 days from now
          invoiceDate: now,
          adminId: invoice.adminId,
          agencyId: invoice.agencyId,
          brandId: invoice.brandId,
          createdBy: invoice.createdBy,
          retainerDuration: invoice.retainerDuration,
          parentInvoiceId: invoice._id
        };
        
        // Calculate new nextGenerationDate for the NEW invoice
        const nextDate = getNextGenerationDate(now, invoice.retainerDuration);
        newInvoiceData.nextGenerationDate = nextDate;
        
        // Create the new invoice
        await Invoice.create(newInvoiceData);
        
        // Update the old invoice so it's no longer the active retainer head
        invoice.nextGenerationDate = null;
        await invoice.save();
      }
      
      console.log(`Successfully generated ${dueInvoices.length} recurring invoices.`);
    } catch (error) {
      console.error('Error running invoice cron job:', error);
    }
  });
};

module.exports = { startInvoiceCron };
