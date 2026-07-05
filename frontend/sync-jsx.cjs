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
  ['className="pi-filters"', 'className="qa-toolbar"'],
  ['className="filter-search"', 'className="qa-search-box"'],
  ['className="pi-table-container"', 'className="qa-table-container"'],
  ['className="pi-table"', 'className="qa-table"'],
  ['className="pagination"', 'className="qa-pagination"'],
  ['className="page-btn"', 'className="qa-page-btn"'],
  ['className={`page-btn', 'className={`qa-page-btn'],
  ['className="create-issue-btn"', 'className="qa-btn-primary"'],
  ['className="sync-btn"', 'className="qa-btn-secondary"'],
  ['className="date-range"', 'className="qa-date-btn"'],
  ['className="filter-btn"', 'className="qa-reset-btn"'],
  ['className="filter-select"', 'className="qa-filter-select"'],
  ['className="pi-footer"', 'className="qa-footer"']
]);

replaceFile('src/pages/Requirements.jsx', [
  ['className="req-toolbar"', 'className="qa-toolbar"'],
  ['className="search-box"', 'className="qa-search-box"'],
  ['className="req-table-container"', 'className="qa-table-container"'],
  ['className="req-table"', 'className="qa-table"'],
  ['className="pagination"', 'className="qa-pagination"'],
  ['className="page-btn"', 'className="qa-page-btn"'],
  ['className={`page-btn', 'className={`qa-page-btn'],
  ['className="add-req-btn"', 'className="qa-btn-primary"'],
  ['className="export-btn"', 'className="qa-btn-secondary"'],
  ['className="req-date-btn"', 'className="qa-date-btn"'],
  ['className="req-reset-btn"', 'className="qa-reset-btn"'],
  ['className="filter-select"', 'className="qa-filter-select"'],
  ['className="req-footer"', 'className="qa-footer"']
]);

replaceFile('src/pages/MomTracker.jsx', [
  ['className="mom-toolbar"', 'className="qa-toolbar"'],
  ['className="filter-search"', 'className="qa-search-box"'],
  ['className="filter-select"', 'className="qa-filter-select"'],
  ['className="mom-date-btn"', 'className="qa-date-btn"'],
  ['className="filter-btn"', 'className="qa-reset-btn"'],
  ['className="mom-footer"', 'className="qa-footer"'],
  ['className="pagination"', 'className="qa-pagination"'],
  ['className="page-btn"', 'className="qa-page-btn"'],
  ['className={`page-btn', 'className={`qa-page-btn'],
  ['className="add-mom-btn"', 'className="qa-btn-primary"'],
  ['className="export-mom-btn"', 'className="qa-btn-secondary"'],
  ['className="tracker-table-container"', 'className="qa-table-container"'],
  ['className="tracker-table"', 'className="qa-table"']
]);
