const momModel = require('../models/momModel');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const getMeetings = async (req, res) => {
  try {
    const data = await momModel.find().sort({ _id: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    const data = req.body;
    const newMeeting = new momModel({
      id: Date.now(),
      date: data.date,
      time: data.time,
      agendaTitle: data.agendaTitle,
      agendaSubtitle: data.agendaSubtitle || 'Meeting',
      pointsCount: data.pointsCount || 0,
      preparedBy: {
        name: data.preparedBy,
        empId: data.preparedByEmpId || 'EMP' + Math.floor(1000 + Math.random() * 9000),
        avatar: data.preparedByAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.preparedBy || 'User')}&background=7A2434&color=fff`
      },
      attendees: data.attendeesCount || 0,
      attendeesList: data.attendeesList || [],
      notes: data.notes
    });
    
    await newMeeting.save();
    res.status(201).json({ success: true, data: newMeeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const deleted = await momModel.findOneAndDelete({ id: parseInt(req.params.id) });
    if (!deleted) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    let extractedText = '';
    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;
    const originalname = req.file.originalname;

    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimetype === 'application/msword' ||
      originalname.endsWith('.doc') || originalname.endsWith('.docx')
    ) {
      const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = docxData.value;
    } else if (mimetype === 'text/plain') {
      extractedText = fileBuffer.toString('utf-8');
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type' });
    }

    // Return plain text so the textarea on the frontend displays it correctly
    res.status(200).json({ success: true, data: extractedText.trim() });
    } catch (error) {
      console.error('Upload Error:', error);
      res.status(500).json({ success: false, error: 'Error processing document: ' + (error.message || error) });
    }
};

module.exports = {
  getMeetings,
  createMeeting,
  deleteMeeting,
  uploadDocument
};
