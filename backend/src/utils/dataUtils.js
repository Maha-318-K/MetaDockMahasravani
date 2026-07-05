const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');

const loadData = (filename, defaultData = []) => {
  const filePath = path.join(dataDir, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading data from ${filename}:`, error);
    return defaultData;
  }
};

const saveData = (filename, data) => {
  const filePath = path.join(dataDir, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data to ${filename}:`, error);
  }
};

module.exports = {
  loadData,
  saveData
};
