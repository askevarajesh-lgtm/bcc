const fs = require('fs');
const files = [
  'e:/Bcc Seo/backend/src/modules/projects/project.service.js',
  'e:/Bcc Seo/backend/src/modules/projects/project-review.service.js',
  'e:/Bcc Seo/backend/src/modules/projects/project-auto.service.js'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  const replaceMap = {
    '"../companies/company.model"': '"./shimProjectModel"',
    '"../invoices/invoice.model"': '"./shimInvoiceModel"',
    '"../operations/operation.model"': '"./shimOperationModel"',
    '"../users/user.model"': '"./shimUserModel"',
    '"../../utils/timeline.helper"': '"./shimTimelineHelper"',
    '"../../utils/pagination.helper"': '"./shimPagination"',
    '"../../utils/dropdown.helper"': '"./shimDropdown"',
    '"../../utils/audit.helper"': '"./shimAuditHelper"',
    '"../../utils/email.service"': '"./shimEmailService"',
    '"../corrections/correction.model"': '"./shimCorrectionModel"',
    '"../../constants/masterItemNames"': '"./dummyConfig"',
  };

  for (const [key, value] of Object.entries(replaceMap)) {
    if (content.includes(key)) {
      content = content.split(key).join(value);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed requires in', f);
  }
});
