const fs = require('fs');
const path = require('path');

const qaCssPath = path.join(__dirname, 'src/pages/QAIssuesManagement.css');
const qaCss = fs.readFileSync(qaCssPath, 'utf8');

// Extract specific blocks from QAIssuesManagement
function getBlock(startStr, endStr) {
  const start = qaCss.indexOf(startStr);
  const end = qaCss.indexOf(endStr, start);
  return qaCss.substring(start, end);
}

const toolbarBlock = getBlock('.qa-toolbar {', '/* Table */');
const paginationBlock = getBlock('/* Footer Pagination */', '/* Attachments Hover */');
const buttonBlock = getBlock('.qa-btn-primary {', '.qa-metric-content h2');

// We will inject these styles into the target CSS files, replacing their respective class names.
function applyToTarget(filePath, mappings) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  let newStyles = `\n\n/* --- SYNCED UI (SEARCH, PAGINATION, BUTTONS) --- */\n`;
  newStyles += toolbarBlock + '\n' + paginationBlock + '\n' + buttonBlock + '\n';
  
  // Apply mappings
  for (const [qaClass, targetClass] of Object.entries(mappings)) {
    const regex = new RegExp(qaClass.replace(/\./g, '\\.'), 'g');
    newStyles = newStyles.replace(regex, targetClass);
  }
  
  content += newStyles;
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// Mappings for ProductionIssues
const piMappings = {
  '.qa-toolbar': '.pi-filters',
  '.qa-search-box': '.filter-search',
  '.qa-filter-select': '.filter-select',
  '.qa-date-btn': '.date-range',
  '.qa-reset-btn': '.filter-btn',
  '.qa-footer': '.pi-footer',
  '.qa-pagination': '.pagination',
  '.qa-page-btn': '.page-btn',
  '.qa-btn-primary': '.create-issue-btn',
  '.qa-btn-secondary': '.sync-btn'
};
applyToTarget(path.join(__dirname, 'src/pages/ProductionIssues.css'), piMappings);

// Mappings for Requirements
const reqMappings = {
  '.qa-toolbar': '.req-toolbar',
  '.qa-search-box': '.req-search',
  '.qa-filter-select': '.req-filter',
  '.qa-date-btn': '.req-date-btn',
  '.qa-reset-btn': '.req-reset-btn',
  '.qa-footer': '.req-footer',
  '.qa-pagination': '.pagination',
  '.qa-page-btn': '.page-btn',
  '.qa-btn-primary': '.add-req-btn',
  '.qa-btn-secondary': '.export-btn'
};
applyToTarget(path.join(__dirname, 'src/pages/Requirements.css'), reqMappings);

// Mappings for MomTracker
const momMappings = {
  '.qa-toolbar': '.mom-toolbar',
  '.qa-search-box': '.filter-search',
  '.qa-filter-select': '.filter-select',
  '.qa-date-btn': '.mom-date-btn',
  '.qa-reset-btn': '.filter-btn',
  '.qa-footer': '.mom-footer',
  '.qa-pagination': '.pagination',
  '.qa-page-btn': '.page-btn',
  '.qa-btn-primary': '.add-mom-btn',
  '.qa-btn-secondary': '.export-mom-btn'
};
applyToTarget(path.join(__dirname, 'src/pages/MomTracker.css'), momMappings);
