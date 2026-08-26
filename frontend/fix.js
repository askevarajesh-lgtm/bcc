const fs = require('fs');
const files = [
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/Settings/tabs/AgencyPackagesTab.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/Settings/tabs/DirectPackagesTab.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/AgencyPortal/tabs/ClientPackagesTab.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/PortalSettings/PortalSettings.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/ClientPortal/tabs/BrandSettingsTab.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/ClientPortal/tabs/BrandUsersTab.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/ClientPortal/tabs/ClientSettingsTab.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/Accounts/Accounts.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/AgencyPortal/tabs/AgencySettingsTab.jsx',
  'e:/Office Projects/Bcc/bcc/frontend/src/pages/AgencyPortal/tabs/ClientsTab.jsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/{ id: 'seo-panel', label: 'SEO\\/AEO\\/GEO' }/g, "{ id: 'seo-panel', label: 'SEO Panel' },\n  { id: 'seo-aeo-geo', label: 'SEO/AEO/GEO' }");
    fs.writeFileSync(f, content);
    console.log('Updated', f);
  }
});
