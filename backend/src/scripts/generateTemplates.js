const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'data', 'form-templates');

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

const templatesData = [
  {
    templateName: "Contact Form",
    category: "General",
    description: "A standard form to allow users to contact you.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Full Name", placeholder: "Enter your full name", required: true },
      { id: "field-2", type: "Email", label: "Email Address", placeholder: "you@example.com", required: true },
      { id: "field-3", type: "Text Area", label: "Message", placeholder: "How can we help you?", required: true }
    ]
  },
  {
    templateName: "Lead Generation Form",
    category: "Marketing",
    description: "Capture visitor details for your sales team.",
    fields: [
      { id: "field-1", type: "Text Field", label: "First Name", placeholder: "Jane", required: true },
      { id: "field-2", type: "Text Field", label: "Last Name", placeholder: "Doe", required: true },
      { id: "field-3", type: "Email", label: "Work Email", placeholder: "jane@company.com", required: true },
      { id: "field-4", type: "Phone", label: "Phone Number", placeholder: "+1 (555) 000-0000", required: false },
      { id: "field-5", type: "Select", label: "Company Size", placeholder: "Select company size", required: true, options: ["1-10", "11-50", "51-200", "201+"] }
    ]
  },
  {
    templateName: "Newsletter Signup Form",
    category: "Marketing",
    description: "Allow users to subscribe to your newsletter.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Your Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Your Email", required: true }
    ]
  },
  {
    templateName: "Appointment Booking Form",
    category: "Services",
    description: "Book an appointment with your team.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Your Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Your Email", required: true },
      { id: "field-3", type: "Phone", label: "Phone", placeholder: "Your Phone", required: true },
      { id: "field-4", type: "Date Field", label: "Preferred Date", placeholder: "Select Date", required: true },
      { id: "field-5", type: "Select", label: "Service", placeholder: "Select Service", required: true, options: ["Consultation", "Follow-up", "Support"] }
    ]
  },
  {
    templateName: "Webinar Registration Form",
    category: "Events",
    description: "Register attendees for your upcoming webinar.",
    fields: [
      { id: "field-1", type: "Text Field", label: "First Name", placeholder: "First Name", required: true },
      { id: "field-2", type: "Text Field", label: "Last Name", placeholder: "Last Name", required: true },
      { id: "field-3", type: "Email", label: "Email Address", placeholder: "Email Address", required: true },
      { id: "field-4", type: "Text Field", label: "Job Title", placeholder: "Your Title", required: false }
    ]
  },
  {
    templateName: "Event Registration Form",
    category: "Events",
    description: "General event registration form.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Full Name", placeholder: "Full Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email Address", required: true },
      { id: "field-3", type: "Select", label: "Ticket Type", placeholder: "Select Ticket", required: true, options: ["General Admission", "VIP", "Early Bird"] },
      { id: "field-4", type: "Checkbox Group", label: "Dietary Restrictions", placeholder: "", required: false, options: ["Vegetarian", "Vegan", "Gluten-Free", "None"] }
    ]
  },
  {
    templateName: "Job Application Form",
    category: "HR",
    description: "Accept applications for open positions.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Full Name", placeholder: "Full Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email Address", required: true },
      { id: "field-3", type: "Phone", label: "Phone Number", placeholder: "Phone Number", required: true },
      { id: "field-4", type: "File Upload", label: "Resume / CV", placeholder: "Upload File", required: true },
      { id: "field-5", type: "Text Field", label: "LinkedIn Profile", placeholder: "URL", required: false }
    ]
  },
  {
    templateName: "Customer Feedback Form",
    category: "Customer Success",
    description: "Gather feedback from your customers.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Name", required: false },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email", required: false },
      { id: "field-3", type: "Radio Group", label: "How would you rate our service?", placeholder: "", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
      { id: "field-4", type: "Text Area", label: "Comments", placeholder: "Any additional feedback?", required: false }
    ]
  },
  {
    templateName: "Customer Survey Form",
    category: "Customer Success",
    description: "In-depth survey to understand customer needs.",
    fields: [
      { id: "field-1", type: "Radio Group", label: "How often do you use our product?", placeholder: "", required: true, options: ["Daily", "Weekly", "Monthly", "Rarely"] },
      { id: "field-2", type: "Select", label: "What is your primary goal?", placeholder: "Select Goal", required: true, options: ["Save Time", "Save Money", "Grow Business", "Other"] },
      { id: "field-3", type: "Text Area", label: "What feature would you like to see next?", placeholder: "Describe feature", required: false }
    ]
  },
  {
    templateName: "Support Ticket Form",
    category: "Customer Support",
    description: "Allow customers to submit support requests.",
    fields: [
      { id: "field-1", type: "Email", label: "Your Email", placeholder: "Email", required: true },
      { id: "field-2", type: "Text Field", label: "Subject", placeholder: "Brief description of the issue", required: true },
      { id: "field-3", type: "Select", label: "Category", placeholder: "Select Category", required: true, options: ["Billing", "Technical", "General Inquiry", "Bug Report"] },
      { id: "field-4", type: "Text Area", label: "Description", placeholder: "Detailed explanation", required: true },
      { id: "field-5", type: "File Upload", label: "Screenshot", placeholder: "Upload screenshot", required: false }
    ]
  },
  {
    templateName: "Demo Request Form",
    category: "Sales",
    description: "Capture requests for product demonstrations.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Name", required: true },
      { id: "field-2", type: "Email", label: "Business Email", placeholder: "Work Email", required: true },
      { id: "field-3", type: "Text Field", label: "Company Name", placeholder: "Company Name", required: true },
      { id: "field-4", type: "Select", label: "What are you most interested in?", placeholder: "Select interest", required: false, options: ["Core Product", "Enterprise Features", "API Integration"] }
    ]
  },
  {
    templateName: "Quote Request Form",
    category: "Sales",
    description: "Allow prospective clients to request a quote.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email", required: true },
      { id: "field-3", type: "Select", label: "Service Required", placeholder: "Select Service", required: true, options: ["Web Development", "Marketing", "Consulting", "Other"] },
      { id: "field-4", type: "Number", label: "Estimated Budget", placeholder: "$", required: false },
      { id: "field-5", type: "Text Area", label: "Project Details", placeholder: "Describe your project", required: true }
    ]
  },
  {
    templateName: "Callback Request Form",
    category: "Sales",
    description: "Users can request a call back from your team.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Your Name", required: true },
      { id: "field-2", type: "Phone", label: "Phone Number", placeholder: "Your Phone", required: true },
      { id: "field-3", type: "Select", label: "Best time to call", placeholder: "Select Time", required: false, options: ["Morning", "Afternoon", "Evening"] }
    ]
  },
  {
    templateName: "Course Registration Form",
    category: "Education",
    description: "Register students for a course or class.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Student Name", placeholder: "Full Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email", required: true },
      { id: "field-3", type: "Select", label: "Course Selection", placeholder: "Select Course", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
      { id: "field-4", type: "Date Field", label: "Start Date", placeholder: "Preferred Start Date", required: false }
    ]
  },
  {
    templateName: "Consultation Booking Form",
    category: "Services",
    description: "Book an initial consultation.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email", required: true },
      { id: "field-3", type: "Text Area", label: "What would you like to discuss?", placeholder: "Topic", required: true }
    ]
  },
  {
    templateName: "Partnership Inquiry Form",
    category: "Business",
    description: "For potential partners or affiliates to contact you.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Company Name", placeholder: "Company Name", required: true },
      { id: "field-2", type: "Text Field", label: "Contact Person", placeholder: "Name", required: true },
      { id: "field-3", type: "Email", label: "Email", placeholder: "Email", required: true },
      { id: "field-4", type: "Text Area", label: "Partnership Proposal", placeholder: "Describe the opportunity", required: true }
    ]
  },
  {
    templateName: "Vendor Registration Form",
    category: "Business",
    description: "Onboard new vendors or suppliers.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Business Name", placeholder: "Business Name", required: true },
      { id: "field-2", type: "Text Field", label: "Tax ID / EIN", placeholder: "Tax ID", required: true },
      { id: "field-3", type: "Email", label: "Contact Email", placeholder: "Email", required: true },
      { id: "field-4", type: "Text Area", label: "Products/Services Offered", placeholder: "Describe offerings", required: true }
    ]
  },
  {
    templateName: "Complaint Form",
    category: "Customer Support",
    description: "Allow customers to formally submit complaints.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Name", required: false },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email", required: true },
      { id: "field-3", type: "Date Field", label: "Date of Incident", placeholder: "Date", required: false },
      { id: "field-4", type: "Text Area", label: "Complaint Details", placeholder: "Describe the issue", required: true }
    ]
  },
  {
    templateName: "Product Inquiry Form",
    category: "Sales",
    description: "For users asking questions about specific products.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email", required: true },
      { id: "field-3", type: "Text Field", label: "Product Name", placeholder: "Which product?", required: true },
      { id: "field-4", type: "Text Area", label: "Your Question", placeholder: "Ask your question", required: true }
    ]
  },
  {
    templateName: "Service Request Form",
    category: "Services",
    description: "Request a specific service from your team.",
    fields: [
      { id: "field-1", type: "Text Field", label: "Name", placeholder: "Name", required: true },
      { id: "field-2", type: "Email", label: "Email", placeholder: "Email", required: true },
      { id: "field-3", type: "Phone", label: "Phone", placeholder: "Phone", required: true },
      { id: "field-4", type: "Select", label: "Service Type", placeholder: "Select Service", required: true, options: ["Maintenance", "Installation", "Repair"] },
      { id: "field-5", type: "Text Area", label: "Additional Details", placeholder: "Describe what you need", required: false }
    ]
  }
];

templatesData.forEach((template, idx) => {
  const tpl = {
    templateName: template.templateName,
    category: template.category,
    description: template.description,
    thumbnail: "default-thumbnail.jpg",
    isDefault: true,
    status: "Published",
    fields: template.fields
  };
  
  const filename = template.templateName.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') + '.json';
  const filePath = path.join(templatesDir, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(tpl, null, 2));
  console.log(`Generated ${filename}`);
});

console.log('Successfully generated 20 template JSON files.');
