const fs = require('fs');
const path = require('path');

function replaceFile(file, replacements) {
  let fullPath = path.join(__dirname, file);
  let text = fs.readFileSync(fullPath, 'utf8');
  for (let [from, to] of replacements) {
    text = text.replaceAll(from, to);
  }
  fs.writeFileSync(fullPath, text);
  console.log('Replaced in ' + file);
}

replaceFile('src/pages/ProductionIssues.jsx', [
  ['className={`status-badge ${issue.status.toLowerCase().replace(\' \', \'-\')}`}', 'className={`badge-status-${issue.status.toLowerCase().replace(\' \', \'\')}`}'],
  ['className={`status-badge ${i.status.toLowerCase().replace(\' \', \'-\')}`}', 'className={`badge-status-${i.status.toLowerCase().replace(\' \', \'\')}`}']
]);

// MomTracker has status-pill
replaceFile('src/pages/MomTracker.jsx', [
  ['className={`status-pill ${status.toLowerCase()}`}', 'className={`badge-status-${status.toLowerCase().replace(\' \', \'\')}`}']
]);

// Wait, Requirements has status too
replaceFile('src/pages/Requirements.jsx', [
  ['className={`status-badge ${req.status.toLowerCase()}`}', 'className={`badge-status-${req.status.toLowerCase().replace(\' \', \'\')}`}']
]);
