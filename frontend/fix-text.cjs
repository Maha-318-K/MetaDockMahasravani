const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

content = content.replace(/View all [^<]+</g, 'View all →<');

fs.writeFileSync('src/pages/Dashboard.jsx', content);
console.log('Fixed mangled characters using regex');
