import React, { useState, useEffect } from 'react';
import { Plus, Folder, Calendar, ArrowRight, Search, Activity, MoreVertical, Sparkles, Edit2, Trash2, X, UploadCloud, List, FolderPlus } from 'lucide-react';
import './Projects.css';
import { ProjectContext } from '../context/ProjectContext';

const Projects = () => {
  const { projects, refreshProjects } = React.useContext(ProjectContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Planning' });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successProjectName, setSuccessProjectName] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Dropdown
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = React.useRef(null);

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: null, name: '', description: '', status: 'Planning' });
  const [isEditing, setIsEditing] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [activeAiProject, setActiveAiProject] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditClick = (project) => {
    setEditFormData({ id: project.id || project._id, name: project.name, description: project.description, status: project.status, logo: project.logo });
    setEditImagePreview(project.logo || null);
    setEditSelectedFile(null);
    setEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleCreateFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditSelectedFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setEditErrors({ name: 'Project name is required' });
      return;
    }
    setEditErrors({});
    setIsEditing(true);

    let finalLogo = editFormData.logo;
    if (editSelectedFile) {
      const uploadData = new FormData();
      uploadData.append('files', editSelectedFile);
      try {
        const uploadRes = await fetch('/api/v1/upload', { method: 'POST', body: uploadData });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.urls && uploadResult.urls.length > 0) {
          finalLogo = uploadResult.urls[0];
        }
      } catch (err) {
        console.error('File upload failed', err);
      }
    }

    try {
      const payload = { ...editFormData, logo: finalLogo };
      const res = await fetch(`/api/v1/projects/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditModalOpen(false);
        refreshProjects();
      } else {
        const data = await res.json();
        setEditErrors({ submit: data.message || 'Failed to update project.' });
      }
    } catch (err) {
      setEditErrors({ submit: 'Network error occurred. Please try again.' });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectToDelete.id || projectToDelete._id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteModalOpen(false);
        refreshProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateAi = (project) => {
    setActiveAiProject(project);
    setAiModalOpen(true);
    setActiveDropdown(null);
    setAiLoading(true);
    setAiInsights('');
    
    setTimeout(() => {
      const insight = `**AI Health Check for "${project.name}"**\n\n**Status Check**: ${project.status}\n\n**Analysis**: Based on the project description "${project.description || 'N/A'}", this initiative is ${project.status === 'Active' ? 'currently progressing well, but keep an eye on resource allocation' : project.status === 'Planned' ? 'in an excellent position to kick off soon. Recommend finalizing requirements.' : 'completed successfully. Recommend scheduling a retrospective.'}\n\n**Recommended Next Steps**:\n1. Schedule a sync with key stakeholders next week.\n2. Review any QA metrics associated with this release.\n3. Monitor for related production issues in the tracker.`;
      setAiInsights(insight);
      setAiLoading(false);
    }, 2000);
  };


  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    
    let finalLogo = '';
    if (selectedFile) {
      const uploadData = new FormData();
      uploadData.append('files', selectedFile);
      try {
        const uploadRes = await fetch('/api/v1/upload', { method: 'POST', body: uploadData });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.urls && uploadResult.urls.length > 0) {
          finalLogo = uploadResult.urls[0];
        }
      } catch (err) {
        console.error('File upload failed', err);
      }
    }

    try {
      const payload = { ...formData, logo: finalLogo };
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setSuccessProjectName(formData.name);
        setFormData({ name: '', description: '', status: 'Planning' });
        setSelectedFile(null);
        setImagePreview(null);
        refreshProjects();
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3500);
      } else {
        const data = await res.json();
        setErrors({ submit: data.message || 'Failed to create project.' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Network error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Manage and organize your release management projects</p>
        </div>
        <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Project
        </button>
      </div>

      <div className="projects-filters new-glass-panel">
        <div className="search-box">
          <Search size={18} color="#9ca3af" />
          <input 
            type="text" 
            placeholder="Search projects by name or description..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Calendar size={16} color="#6b7280" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="projects-grid">
        {loading ? (
          <div className="loading-state">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">No projects found. Create one to get started!</div>
        ) : (
          projects.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).map(project => {
            const statusClass = project.status.toLowerCase().replace(' ', '-');
            return (
            <div key={project.id} className={`project-card status-${statusClass}`}>
              <div className="project-card-header">
                <div className={`project-icon icon-${statusClass}`} style={{ overflow: 'hidden' }}>
                  {project.logo ? (
                    <img src={project.logo.startsWith('http') ? project.logo : `http://localhost:5000${project.logo}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Folder size={24} />
                  )}
                </div>
                <div className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                  {project.status}
                </div>
              </div>
              <div className="project-info">
                <h3>{project.name}</h3>
                <p>{project.description || 'No description provided.'}</p>
              </div>
                            <div className="project-footer">
                <div className="project-meta">
                  <Calendar size={14} />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="card-actions" ref={activeDropdown === (project.id || project._id) ? dropdownRef : null}>
                  <button className="action-dots" onClick={() => setActiveDropdown(activeDropdown === (project.id || project._id) ? null : (project.id || project._id))}>
                    <MoreVertical size={18} />
                  </button>
                  {activeDropdown === (project.id || project._id) && (
                    <div className="project-dropdown">
                      <button onClick={() => handleEditClick(project)} style={{ color: '#000000' }}><Edit2 size={14} /> Edit Project</button>
                      <button onClick={() => handleDeleteClick(project)} className="delete-btn"><Trash2 size={14} /> Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content custom-modal">
            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
              <X size={20} />
            </button>
            
            <div className="modal-header-custom">
              <div className="header-icon">
                <FolderPlus size={24} color="#C87A5E" />
              </div>
              <div>
                <h2>Create New Project</h2>
                <p>Add a new project to organize and manage your work efficiently.</p>
              </div>
            </div>

            <form onSubmit={handleCreate}>
              {errors.submit && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {errors.submit}
                </div>
              )}
              
              <div className="form-group custom-input-group">
                <label>Project Name <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-with-icon">
                  <div className="icon-wrapper orange-icon">
                    <Folder size={18} />
                  </div>
                  <input 
                    type="text" 
                    className={errors.name ? 'input-error' : ''}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if (errors.name) setErrors({...errors, name: null});
                    }}
                    placeholder="Enter your project name"
                  />
                </div>
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label>Project Logo (Optional)</label>
                <div className="drag-drop-zone">
                  <input type="file" accept="image/*" onChange={handleCreateFileChange} />
                  <UploadCloud size={32} color="#C87A5E" strokeWidth={1.5} />
                  <p>Drag & drop your logo here or</p>
                  <span className="browse-btn">Browse File</span>
                  <small>PNG, JPG or SVG (Max. 2MB)</small>
                </div>
                {imagePreview && (
                  <div className="preview-container">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group custom-input-group">
                <label>Description</label>
                <div className="input-with-icon textarea-wrapper">
                  <div className="icon-wrapper green-icon">
                    <List size={18} />
                  </div>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the project..."
                    rows={2}
                  />
                  <div className="char-count">{formData.description.length} / 500</div>
                </div>
              </div>

              <div className="form-group custom-input-group">
                <label>Status</label>
                <div className="input-with-icon">
                  <div className="icon-wrapper green-icon">
                    <Activity size={18} />
                  </div>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                
                <div className="status-badge-selector">
                  {['Planning', 'In Progress', 'Active', 'Completed', 'On Hold'].map(status => (
                    <div 
                      key={status}
                      className={`badge-option ${formData.status === status ? 'selected' : ''} status-${status.toLowerCase().replace(' ', '-')}`}
                      onClick={() => setFormData({...formData, status})}
                    >
                      {status === 'Planning' && <Calendar size={12} />}
                      {status === 'In Progress' && <Activity size={12} />}
                      {status === 'Active' && <Activity size={12} />}
                      {status === 'Completed' && <Folder size={12} />}
                      {status === 'On Hold' && <Folder size={12} />}
                      {status}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions custom-modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="primary-btn dark-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="spinner-small" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Creating...
                    </>
                  ) : (
                    <>Create Project <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Project</h2>
            <form onSubmit={handleUpdate}>
              {editErrors.submit && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {editErrors.submit}
                </div>
              )}
              <div className="form-group">
                <label>Project Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  className={editErrors.name ? 'input-error' : ''}
                  value={editFormData.name}
                  onChange={(e) => {
                    setEditFormData({...editFormData, name: e.target.value});
                    if (editErrors.name) setEditErrors({...editErrors, name: null});
                  }}
                />
                {editErrors.name && <div className="error-text">{editErrors.name}</div>}
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label>Project Logo (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleEditFileChange} style={{ padding: '6px 10px' }} />
                </div>
                {editImagePreview && (
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
                    <img src={editImagePreview.startsWith('http') || editImagePreview.startsWith('blob:') ? editImagePreview : `http://localhost:5000${editImagePreview}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setEditModalOpen(false)} disabled={isEditing}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={isEditing}>
                  {isEditing ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-modal" style={{ width: '400px', padding: '32px' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '20px' }}>Delete Project</h2>
            <p style={{ color: '#4b5563', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{projectToDelete?.name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions custom-modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>Cancel</button>
              <button type="button" className="primary-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup Toast */}
      {showSuccessPopup && (
        <div className="custom-success-popup">
          <div className="success-icon-circle">
            <Sparkles size={20} color="#fff" />
          </div>
          <div className="success-text-content">
            <h4>Project Created Successfully</h4>
            <p>"{successProjectName}" has been added to your dashboard.</p>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {aiModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content ai-modal">
            <div className="ai-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#16A34A" />
                <h2 style={{ margin: 0, background: 'linear-gradient(90deg, #16A34A, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Project Insights</h2>
              </div>
              <button className="close-btn" onClick={() => setAiModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="ai-modal-body">
              {aiLoading ? (
                <div className="ai-loading">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  <p>AI is analyzing project data...</p>
                </div>
              ) : (
                <div className="ai-result">
                  {aiInsights.split('\n').map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
