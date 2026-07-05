require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/v1/userRoutes');
const authRoutes = require('./src/routes/v1/authRoutes');
const momRoutes = require('./src/routes/v1/momRoutes');
const trackerRoutes = require('./src/routes/v1/trackerRoutes');
const issuesRoutes = require('./src/routes/v1/issuesRoutes');
const whatsappRoutes = require('./src/routes/v1/whatsappRoutes');
const settingsRoutes = require('./src/routes/v1/settingsRoutes');
const requirementsRoutes = require('./src/routes/v1/requirementsRoutes');
const qaIssuesRoutes = require('./src/routes/v1/qaIssuesRoutes');
const automationRoutes = require('./src/routes/v1/automationRoutes');
const documentRoutes = require('./src/routes/v1/documentRoutes');
const projectRoutes = require('./src/routes/v1/projectRoutes');
const whatsappService = require('./src/services/whatsappService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const fs = require('fs');
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.post('/api/v1/upload', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const urls = req.files.map(file => '/uploads/' + file.filename);
    res.json({ success: true, urls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/mom', momRoutes);
app.use('/api/v1/tracker', trackerRoutes);
app.use('/api/v1/issues', issuesRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/requirements', requirementsRoutes);
app.use('/api/v1/qa-issues', qaIssuesRoutes);
app.use('/api/v1/automation', automationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/uploads', express.static('uploads'));

// Basic root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    whatsappService.initializeWhatsApp();
  });
};

startServer();
