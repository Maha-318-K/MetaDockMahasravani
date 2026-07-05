import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import './CreateRequirement.css';

const CreateRequirement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    module: '',
    priority: '',
    targetDate: '',
    description: '',
    requestedBy: '',
    requestedDate: '',
    source: '',
    relatedIssue: '',
    notes: ''
  });

  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  const [showCustomSource, setShowCustomSource] = useState(false);
  const [customSourceValue, setCustomSourceValue] = useState('');
  
  const [showRequesterMenu, setShowRequesterMenu] = useState(false);
  const [requesterSearch, setRequesterSearch] = useState('');
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Requirement Title is required';
    if (!formData.module) errs.module = 'Module is required';
    if (!formData.priority) errs.priority = 'Priority is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    if (!formData.requestedBy) errs.requestedBy = 'Requester is required';
    if (!formData.requestedDate) errs.requestedDate = 'Requested Date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Format targetDate if present
    let formattedTargetDate = '-';
    if (formData.targetDate) {
      const td = new Date(formData.targetDate);
      formattedTargetDate = td.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // Format requestedDate
    let formattedReqDate = '';
    if (formData.requestedDate) {
      const rd = new Date(formData.requestedDate);
      formattedReqDate = rd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const payload = {
      title: formData.title,
      module: formData.module,
      description: formData.description,
      priority: formData.priority,
      status: 'Open', // As requested, default to Open
      requestedBy: formData.requestedBy,
      requestedDate: formattedReqDate,
      targetDate: formattedTargetDate,
      source: formData.source === 'Custom' ? customSourceValue : formData.source,
      relatedIssue: formData.relatedIssue,
      notes: formData.notes
    };

    try {
      const res = await fetch('/api/v1/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        navigate('/requirements');
      } else {
        console.error('Failed to create requirement');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const processFiles = (files) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'];
    Array.from(files).forEach(file => {
      if (!allowed.includes(file.type) && !file.name.match(/\.(zip|rar|pdf|doc|docx|xls|xlsx)$/i)) return;
      if (file.size > 10 * 1024 * 1024) return; // 10MB limit as per mockup
      const url = URL.createObjectURL(file);
      const isImage = file.type.startsWith('image/');
      setAttachments(prev => [...prev, { file, url, isImage, name: file.name }]);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <div className="cr-page">
      <div className="cr-header">
        <div>
          <h2>Add Requirement</h2>
          <p>Create a new requirement for the production system.</p>
        </div>
        <button className="cr-back-btn" onClick={() => navigate('/requirements')}>
          <ArrowLeft size={16} />
          Back to Requirements
        </button>
      </div>
      <form onSubmit={handleSubmit} onClick={() => { setShowRequesterMenu(false); setIsAddingInline(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Requirement Details */}
        <div className="cr-section">
          <div className="cr-section-title">
            <div className="cr-section-num">1</div>
            Requirement Details
          </div>

          <div className="cr-grid">
            <div className="cr-field">
              <label className="cr-label">Requirement Title <span className="cr-req">*</span></label>
              <input 
                type="text" 
                name="title"
                className="cr-input" 
                placeholder="Enter requirement title"
                value={formData.title}
                onChange={handleInputChange}
                style={errors.title ? { borderColor: '#ef4444' } : {}}
              />
            </div>
            <div className="cr-field" style={{ gridRow: 'span 3' }}>
              <label className="cr-label">Description <span className="cr-req">*</span></label>
              <textarea 
                name="description"
                className="cr-textarea"
                placeholder="Enter detailed description of the requirement"
                value={formData.description}
                onChange={handleInputChange}
                style={{ height: '100%', ...(errors.description ? { borderColor: '#ef4444' } : {}) }}
                maxLength={2000}
              />
              <div className="cr-char-count">{formData.description.length} / 2000</div>
            </div>

            <div className="cr-field">
              <label className="cr-label">Module <span className="cr-req">*</span></label>
              <input 
                type="text" 
                name="module"
                className="cr-input" 
                placeholder="Enter module"
                value={formData.module}
                onChange={handleInputChange}
                style={errors.module ? { borderColor: '#ef4444' } : {}}
              />
            </div>

            <div className="cr-field">
              <label className="cr-label">Priority <span className="cr-req">*</span></label>
              <div className="cr-select-wrapper">
                <select name="priority" className="cr-select" value={formData.priority} onChange={handleInputChange} style={errors.priority ? { borderColor: '#ef4444' } : {}}>
                  <option value="" disabled>Select priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="cr-field">
              <label className="cr-label">Target Date</label>
              <input 
                type="date" 
                name="targetDate"
                className="cr-input" 
                value={formData.targetDate}
                onChange={handleInputChange}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Request Information */}
        <div className="cr-section">
          <div className="cr-section-title">
            <div className="cr-section-num">2</div>
            Request Information
          </div>

          <div className="cr-grid-3">
            <div className="cr-field" style={{ position: 'relative' }}>
              <label className="cr-label">Requested By <span className="cr-req">*</span></label>
              <div 
                className="cr-input" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', ...(errors.requestedBy ? { borderColor: '#ef4444' } : {}) }}
                onClick={(e) => { e.stopPropagation(); setShowRequesterMenu(!showRequesterMenu); }}
              >
                <span style={{ color: formData.requestedBy ? '#000000' : '#a0a3b1' }}>{formData.requestedBy || 'Select requester'}</span>
              </div>
              
              {showRequesterMenu && (
                <div className="pi-dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
                  <input type="text" className="cr-input" placeholder="Search user..." value={requesterSearch} onChange={e => setRequesterSearch(e.target.value)} style={{ marginBottom: '8px', width: '100%' }} autoFocus />
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {users.filter(u => u.name.toLowerCase().includes(requesterSearch.toLowerCase())).map(u => (
                      <div key={u.id || u.name} className="cr-dropdown-item" onClick={() => { setFormData(prev => ({ ...prev, requestedBy: u.name })); setShowRequesterMenu(false); setIsAddingInline(false); setErrors(prev => ({ ...prev, requestedBy: '' })); }}>
                        {u.name}
                      </div>
                    ))}
                  </div>
                  {isAddingInline ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                      <input type="text" className="cr-input" placeholder="New user name..." value={newUserName} onChange={e => setNewUserName(e.target.value)} autoFocus style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }} />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" className="cr-cancel-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setIsAddingInline(false)}>Cancel</button>
                        <button type="button" className="cr-submit-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => {
                          if(newUserName.trim()){ 
                            setUsers(prev => [...prev, { name: newUserName.trim() }]); 
                            setFormData(prev => ({ ...prev, requestedBy: newUserName.trim() })); 
                            setErrors(prev => ({ ...prev, requestedBy: '' })); 
                            setShowRequesterMenu(false); 
                            setIsAddingInline(false);
                            setNewUserName(''); 
                          }
                        }}>Add User</button>
                      </div>
                    </div>
                  ) : (
                    <div className="cr-add-user-btn" onClick={() => setIsAddingInline(true)}>
                      <Plus size={14} /> Add New User
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="cr-field">
              <label className="cr-label">Requested Date <span className="cr-req">*</span></label>
              <input 
                type="date" 
                name="requestedDate"
                className="cr-input" 
                value={formData.requestedDate}
                onChange={handleInputChange}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={errors.requestedDate ? { borderColor: '#ef4444' } : {}}
              />
            </div>

            <div className="cr-field">
              <label className="cr-label">Source</label>
              {showCustomSource ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="cr-input" value={customSourceValue} onChange={e => setCustomSourceValue(e.target.value)} placeholder="Enter custom source..." style={{ flex: 1 }} />
                  <button type="button" onClick={() => { setShowCustomSource(false); setFormData(p => ({ ...p, source: '' })); setCustomSourceValue(''); }} className="cr-cancel-btn" style={{ padding: '0 10px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="cr-select-wrapper">
                  <select name="source" className="cr-select" value={formData.source} onChange={e => { if(e.target.value === 'Custom') setShowCustomSource(true); handleInputChange(e); }}>
                    <option value="" disabled>Select source</option>
                    <option value="WhatsApp Group">WhatsApp Group</option>
                    <option value="Email">Email</option>
                    <option value="Direct Request">Direct Request</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Custom">+ Add New Source</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="cr-field" style={{ marginTop: '4px' }}>
            <label className="cr-label">Related Issue <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'normal' }}>(Optional)</span></label>
            <div className="cr-select-wrapper">
              <select name="relatedIssue" className="cr-select" value={formData.relatedIssue} onChange={handleInputChange}>
                <option value="">Link to related issue (if any)</option>
                {/* Normally fetched from issues API, mocked here */}
                <option value="ISS-001">ISS-001: Login failure</option>
                <option value="ISS-002">ISS-002: Dashboard not loading</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Additional Information */}
        <div className="cr-section">
          <div className="cr-section-title">
            <div className="cr-section-num">3</div>
            Additional Information
          </div>

          <div className="cr-grid">
            <div className="cr-field">
              <label className="cr-label">Attachments</label>
              <div
                className={`cr-dropzone${dragOver ? ' drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('cr-file-input').click()}
              >
                <Upload size={24} className="cr-dropzone-icon" />
                <p className="cr-dropzone-title">Drag & drop files here or click to browse</p>
                <p className="cr-dropzone-hint">Supports: JPG, PNG, PDF, DOC, XLS, ZIP (Max 10MB each)</p>
                <input
                  id="cr-file-input"
                  type="file"
                  multiple
                  onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
                  style={{ display: 'none' }}
                />
              </div>

              {attachments.length > 0 && (
                <div className="cr-preview-grid">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="cr-preview-item">
                      {att.isImage ? <img src={att.url} alt={att.name} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a0a3b1', fontSize: '0.75rem', textAlign: 'center', padding: '4px', wordBreak: 'break-all' }}>{att.name}</div>}
                      <button type="button" className="cr-preview-remove" onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="cr-field">
              <label className="cr-label">Additional Notes <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'normal' }}>(Optional)</span></label>
              <textarea 
                name="notes"
                className="cr-textarea"
                placeholder="Add any additional notes or comments"
                value={formData.notes}
                onChange={handleInputChange}
                maxLength={1000}
                style={{ height: '100%' }}
              />
              <div className="cr-char-count">{formData.notes.length} / 1000</div>
            </div>
          </div>
        </div>

        <div className="cr-actions">
          <button type="button" className="cr-cancel-btn" onClick={() => navigate('/requirements')}>Cancel</button>
          <button type="submit" className="cr-submit-btn"><Plus size={18} /> Create Requirement</button>
        </div>

      </form>
    </div>
  );
};

export default CreateRequirement;
