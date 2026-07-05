const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

content = content.replace(
  'const recentProjects = (projects || []).sort',
  'const recentProjects = [...(projects || [])].sort'
);

// Also let's fix the weird character from earlier log just in case
content = content.replace(/View all \+\'/g, 'View all →');
content = content.replace(/View all \+'/g, 'View all →');

fs.writeFileSync('src/pages/Dashboard.jsx', content);
console.log('Fixed array mutation in Dashboard.jsx');
