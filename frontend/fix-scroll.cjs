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

const tableReplacements = [
  ['className="qa-table-container"', 'className="qa-table-container" style={{overflowX: \'auto\'}}'],
  ['className="qa-table"', 'className="qa-table" style={{minWidth: \'1200px\'}}'],
  // In case they already had style tags:
  ['className="qa-table-container" style={{overflowX: \'auto\'}} style={{', 'className="qa-table-container" style={{overflowX: \'auto\', '],
];

replaceFile('src/pages/ProductionIssues.jsx', tableReplacements);
replaceFile('src/pages/Requirements.jsx', tableReplacements);
replaceFile('src/pages/MomTracker.jsx', tableReplacements);
