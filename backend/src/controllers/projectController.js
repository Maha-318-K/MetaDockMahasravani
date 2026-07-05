const Project = require('../models/projectModel');

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ _id: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({ id: parseInt(req.params.id) });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const createProject = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }
    const newProject = new Project({
      id: Date.now(),
      name: req.body.name,
      description: req.body.description || '',
      status: req.body.status || 'Active',
      logo: req.body.logo || null
    });
    await newProject.save();
    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      req.body,
      { new: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findOneAndDelete({ id: parseInt(req.params.id) });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
