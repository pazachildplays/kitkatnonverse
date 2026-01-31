const fs = require('fs');
const path = require('path');

// Copy admin files to public folder for Netlify deployment
function copyAdminFiles() {
  const adminDir = path.join(__dirname, '../admin');
  const publicDir = path.join(__dirname, '../public');
  const publicAdminDir = path.join(publicDir, 'admin');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Ensure public/admin directory exists
  if (!fs.existsSync(publicAdminDir)) {
    fs.mkdirSync(publicAdminDir, { recursive: true });
  }
  
  // Copy dashboard.html as index.html to admin folder
  const dashboardSrc = path.join(adminDir, 'dashboard.html');
  const indexDest = path.join(publicAdminDir, 'index.html');
  
  if (fs.existsSync(dashboardSrc)) {
    fs.copyFileSync(dashboardSrc, indexDest);
    console.log(`✓ Copied dashboard.html to public/admin/index.html`);
  }
  
  // Copy admin.js to public/admin
  const adminJsSrc = path.join(adminDir, 'admin.js');
  const adminJsDest = path.join(publicAdminDir, 'admin.js');
  
  if (fs.existsSync(adminJsSrc)) {
    fs.copyFileSync(adminJsSrc, adminJsDest);
    console.log(`✓ Copied admin.js to public/admin/`);
  }
  
  // Copy admin-styles.css to public/admin
  const adminCssSrc = path.join(adminDir, 'admin-styles.css');
  const adminCssDest = path.join(publicAdminDir, 'admin-styles.css');
  
  if (fs.existsSync(adminCssSrc)) {
    fs.copyFileSync(adminCssSrc, adminCssDest);
    console.log(`✓ Copied admin-styles.css to public/admin/`);
  }
  
  console.log('\n✓ Build complete - Admin files deployed to public/admin/');
}

copyAdminFiles();
