import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown,
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, Link as LinkIcon,
  Upload, X, GripVertical, ChevronLeft, Check, FileEdit, Users, Lightbulb
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseMomNotes } from '../utils/momParser';
import './CreateMinutes.css';

const SortableAttendee = ({ id, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="attendee-tag">
      <div {...attributes} {...listeners} className="drag-handle">
        <GripVertical size={14} />
      </div>
      <span>{id}</span>
      <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(id); }} className="remove-tag">
        <X size={12} />
      </button>
    </div>
  );
};

const OptionItem = ({ user, type, isSelected, onSelect }) => {
  return (
    <label className={`custom-option-label ${isSelected ? 'selected' : ''}`} style={{justifyContent: 'space-between'}}>
      <span className="option-text">{user.name} {user.designation && user.designation !== 'Employee' ? <span className="option-designation">- {user.designation}</span> : ''}</span>
      
      {isSelected && (
        <div className="check-icon-wrapper">
          <Check size={16} color="#29251C" />
        </div>
      )}
      
      {type === 'multi' ? (
        <input type="checkbox" checked={isSelected} onChange={() => onSelect(user.name)} style={{display: 'none'}} />
      ) : (
        <input type="radio" checked={isSelected} onChange={() => onSelect(user.name)} name="preparedByOption" style={{display: 'none'}} />
      )}
    </label>
  );
};

const CreateMinutes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const draftId = location.state?.draftId;
  const textareaRef = useRef(null);
  const attendeesRef = useRef(null);
  const preparedByRef = useRef(null);
  const formatDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    dateTime: '',
    agenda: '',
    attendees: [],
    preparedBy: '',
    notes: ''
  });

  const [usersList, setUsersList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination for Preview Modal
  const [previewRowsPerPage, setPreviewRowsPerPage] = useState(10);
  const [previewCurrentPage, setPreviewCurrentPage] = useState(1);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [preparedByOpen, setPreparedByOpen] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    let timer;
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (showSuccessModal && countdown === 0) {
      navigate('/minutes');
    }
    return () => clearTimeout(timer);
  }, [showSuccessModal, countdown, navigate]);
  
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeError, setNewAttendeeError] = useState('');
  
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const today = new Date();
  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = new Date(oneWeekAgo.getTime() - oneWeekAgo.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  useEffect(() => {
    fetchUsers();
    
    if (draftId) {
      const drafts = JSON.parse(localStorage.getItem('mom-drafts') || '[]');
      const draft = drafts.find(d => d.id === draftId);
      if (draft) {
        setFormData(draft.formData);
      }
    }
  }, [draftId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attendeesRef.current && !attendeesRef.current.contains(event.target)) {
        setAttendeesOpen(false);
      }
      if (preparedByRef.current && !preparedByRef.current.contains(event.target)) {
        setPreparedByOpen(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target)) {
        setFormatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.notes;
    const selected = text.substring(start, end);
    
    let before = text.substring(0, start);
    let after = text.substring(end);
    let newSelected = selected;
    
    switch(type) {
      case 'heading-1':
        newSelected = `\n# ${selected || 'Heading 1'}\n`;
        break;
      case 'heading-2':
        newSelected = `\n## ${selected || 'Heading 2'}\n`;
        break;
      case 'heading-3':
        newSelected = `\n### ${selected || 'Heading 3'}\n`;
        break;
      case 'bold':
        newSelected = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        newSelected = `_${selected || 'italic text'}_`;
        break;
      case 'underline':
        newSelected = `<u>${selected || 'underlined text'}</u>`;
        break;
      case 'list':
        newSelected = selected ? selected.split('\n').map(line => `- ${line}`).join('\n') : '\n- ';
        break;
      case 'list-ordered':
        newSelected = selected ? selected.split('\n').map((line, i) => `${i+1}. ${line}`).join('\n') : '\n1. ';
        break;
      case 'link':
        newSelected = `[${selected || 'link text'}](url)`;
        break;
      default:
        break;
    }
    
    const newValue = before + newSelected + after;
    setFormData(prev => ({ ...prev, notes: newValue }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newSelected.length, start + newSelected.length);
    }, 0);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        const sorted = data.data.sort((a, b) => {
          if (a.designation === 'QA Tester' && b.designation !== 'QA Tester') return -1;
          if (b.designation === 'QA Tester' && a.designation !== 'QA Tester') return 1;
          return b.id - a.id;
        });
        setUsersList(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'dateTime':
        if (!value.trim()) error = 'Date & Time is required';
        break;
      case 'agenda':
        if (!value.trim()) error = 'Meeting Agenda is required';
        break;
      case 'attendees':
        if (!value || value.length === 0) error = 'Please select attendees';
        break;
      case 'preparedBy':
        if (!value) error = 'Please select the person who prepared this';
        break;
      case 'notes':
        if (!value.trim()) error = 'Minutes of Meeting notes are required';
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handlePreparedBySelect = (userName) => {
    setFormData(prev => ({ ...prev, preparedBy: userName }));
    if (errors.preparedBy) {
      setErrors(prev => ({ ...prev, preparedBy: validateField('preparedBy', userName) }));
    }
    setPreparedByOpen(false);
  };

  const handleAttendeeToggle = (userName) => {
    setFormData(prev => {
      const isSelected = prev.attendees.includes(userName);
      const newAttendees = isSelected 
        ? prev.attendees.filter(a => a !== userName)
        : [...prev.attendees, userName];
      
      if (errors.attendees) {
        setErrors(errs => ({ ...errs, attendees: validateField('attendees', newAttendees) }));
      }
      return { ...prev, attendees: newAttendees };
    });
  };

  const handleAddAttendee = async (e) => {
    e.preventDefault();
    if (!newAttendeeName.trim()) {
      setNewAttendeeError('Name cannot be empty');
      return;
    }
    if (usersList.some(u => u.name.toLowerCase() === newAttendeeName.trim().toLowerCase())) {
      setNewAttendeeError('Name already exists');
      return;
    }

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAttendeeName.trim(),
          empId: `EMP-${Math.floor(Math.random() * 10000)}`,
          email: `${newAttendeeName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
          password: 'Password123!',
          designation: 'Employee',
          role: 'User',
          status: 'Active'
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        handleAttendeeToggle(data.data.name);
        setNewAttendeeName('');
        setNewAttendeeError('');
      } else {
        setNewAttendeeError(data.error || 'Failed to add');
      }
    } catch (err) {
      setNewAttendeeError('Server error');
    }
  };

  const handleDragEndSelected = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.attendees.indexOf(active.id);
        const newIndex = prev.attendees.indexOf(over.id);
        return {
          ...prev,
          attendees: arrayMove(prev.attendees, oldIndex, newIndex),
        };
      });
    }
  };

  // Drag and drop for selected items only


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setFileError('File size exceeds 50MB');
      return;
    }
    
    const validTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.doc') && !file.name.endsWith('.docx') && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
      setFileError('Invalid file format. Only TXT, PDF, DOC, DOCX, XLS, XLSX allowed.');
      return;
    }

    setFileError('');
    setIsUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/v1/mom/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ 
          ...prev, 
          notes: prev.notes + (prev.notes ? '\n\n' : '') + data.data 
        }));
        if (errors.notes) {
          setErrors(prev => ({ ...prev, notes: '' }));
        }
      } else {
        setFileError(data.error || 'Upload failed');
      }
    } catch (err) {
      setFileError('Server error during upload');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleBack = () => {
    const hasData = formData.dateTime || formData.agenda || formData.attendees.length > 0 || formData.preparedBy || formData.notes;
    if (hasData) {
      const drafts = JSON.parse(localStorage.getItem('mom-drafts') || '[]');
      if (draftId) {
        const idx = drafts.findIndex(d => d.id === draftId);
        if (idx !== -1) drafts[idx].formData = formData;
      } else {
        drafts.push({
          id: Date.now().toString(),
          title: formData.agenda || 'Untitled Draft',
          date: new Date().toLocaleString(),
          formData
        });
      }
      localStorage.setItem('mom-drafts', JSON.stringify(drafts));
    }
    navigate('/minutes');
  };

  const handlePreview = (e) => {
    e.preventDefault();
    let newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setShowPreview(true);
  };

  const calculatePoints = (notes) => {
    return parseMomNotes(notes).length;
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    let date = formData.dateTime;
    let time = '10:00 AM';
    
    if (formData.dateTime && formData.dateTime.includes('T')) {
      const parts = formData.dateTime.split('T');
      date = parts[0]; 
      time = parts[1]; 
    }

    const attCount = Array.isArray(formData.attendees) ? formData.attendees.length : 1;

    const preparedByUser = usersList.find(u => u.name === formData.preparedBy);
    
    const payload = {
      date: date,
      time: time,
      agendaTitle: formData.agenda,
      agendaSubtitle: 'Discussion',
      preparedBy: formData.preparedBy,
      preparedByEmpId: preparedByUser ? preparedByUser.empId : null,
      preparedByAvatar: preparedByUser ? preparedByUser.avatar : null,
      attendeesCount: attCount,
      attendeesList: formData.attendees,
      notes: formData.notes,
      pointsCount: calculatePoints(formData.notes)
    };

    try {
      const res = await fetch('/api/v1/mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const newMeetingId = data.data.id;
        
        // Immediately generate and save tracker points so dashboard counts are accurate
        const parsedPoints = parseMomNotes(formData.notes);
        let initialPoints = parsedPoints.map((parsed, idx) => ({
          id: Date.now() + idx,
          pageName: parsed.pageName,
          issue: parsed.issueText,
          status: 'Open',
          assignee: '',
          stagingDate: '',
          prodDate: ''
        }));
        
        if (initialPoints.length === 0) {
          initialPoints = [{ id: Date.now() + 1, pageName: '', issue: '', status: 'Open', assignee: '', stagingDate: '', prodDate: '' }];
        }
        
        try {
          await fetch(`/api/v1/tracker/${newMeetingId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: initialPoints })
          });
        } catch (err) {
          console.error('Failed to create initial tracker points', err);
        }

        if (draftId) {
          const drafts = JSON.parse(localStorage.getItem('mom-drafts') || '[]');
          const filtered = drafts.filter(d => d.id !== draftId);
          localStorage.setItem('mom-drafts', JSON.stringify(filtered));
        }
        setCountdown(3);
        setShowSuccessModal(true);
      } else {
        alert('Failed to save minutes.');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving meeting minutes.');
    } finally {
      setIsSubmitting(false);
      setShowPreview(false);
    }
  };

  return (
    <div className="create-mom-page">
      
      <div className="breadcrumbs">
        <span onClick={handleBack} style={{cursor: 'pointer', color: 'inherit'}}>Minutes of Meeting</span>
        <ChevronRight size={14} className="crumb-icon" />
        <span className="current">{draftId ? 'Edit Draft' : 'Create'}</span>
      </div>

      <div className="create-header-layout">
        <div className="header-title-container">
          <div className="header-icon-wrapper">
            <FileEdit size={24} color="#F8AB37" strokeWidth={1.5} />
          </div>
          <div>
            <h2>{draftId ? 'Edit Draft' : 'Create Minutes of Meeting'}</h2>
            <p>Fill in the details below to create a new minutes of meeting.</p>
          </div>
        </div>
        <button className="back-btn-dark" onClick={handleBack}>
          <ArrowLeft size={16} />
          Back to Meetings
        </button>
      </div>

      <form className="create-form-layout" onSubmit={handlePreview}>
        
        <div className="form-grid-top">
          {/* Meeting Details Card */}
          <div className="form-card">
            <div className="card-header">
              <div className="card-icon"><CalendarIcon size={18} color="#F8AB37" /></div>
              <div>
                <h4>Meeting Details</h4>
                <p>Basic information about the meeting.</p>
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-group">
                <label>Date & Time <span className="req">*</span></label>
                <div className={errors.dateTime ? 'input-error' : ''}>
                  <input 
                    type="datetime-local" 
                    name="dateTime" 
                    value={formData.dateTime}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min={oneWeekAgoStr}
                    max={todayStr}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onKeyDown={(e) => e.preventDefault()}
                    style={errors.dateTime ? {borderColor: '#ef4444', cursor: 'pointer'} : {cursor: 'pointer'}}
                  />
                </div>
                {errors.dateTime && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{errors.dateTime}</span>}
              </div>

              <div className="form-group">
                <label>Meeting Agenda <span className="req">*</span></label>
                <input 
                  type="text" 
                  name="agenda" 
                  placeholder="Enter meeting agenda (max 50 characters)" 
                  value={formData.agenda}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={100}
                  style={errors.agenda ? {borderColor: '#ef4444'} : {}}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
                  {errors.agenda ? (
                    <span className="error-text" style={{color: '#ef4444'}}>{errors.agenda}</span>
                  ) : <span></span>}
                  <span style={{color: formData.agenda.length === 100 ? '#ef4444' : '#a0a3b1'}}>
                    {formData.agenda.length}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* People Involved Card */}
          <div className="form-card">
            <div className="card-header">
              <div className="card-icon"><Users size={18} color="#F8AB37" /></div>
              <div>
                <h4>People Involved</h4>
                <p>Add those who attended and prepared the meeting.</p>
              </div>
            </div>
            <div className="form-group-row">
              <div className="form-group">
                <label>Meeting Attendees <span className="req">*</span></label>
                
                {formData.attendees.length > 0 && (
                  <div className="selected-attendees-container">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSelected}>
                      <SortableContext items={formData.attendees} strategy={horizontalListSortingStrategy}>
                        <div className="tags-wrapper">
                          {formData.attendees.map(a => (
                            <SortableAttendee key={a} id={a} onRemove={handleAttendeeToggle} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}

                <div className="custom-multi-select-wrapper" style={{ position: 'relative' }} ref={attendeesRef}>
                  <div 
                    className="custom-select-box" 
                    onClick={() => { setAttendeesOpen(!attendeesOpen); setPreparedByOpen(false); }}
                    style={errors.attendees ? {borderColor: '#ef4444'} : {}}
                  >
                    <div className="selected-text">
                      <span style={{ color: '#a0a3b1' }}>Select or add attendees...</span>
                    </div>
                    <ChevronDown size={16} className="select-icon" />
                  </div>
                  
                  {attendeesOpen && (
                    <div className="custom-options-dropdown">
                      <div className="add-new-name-box">
                        <input 
                          type="text" 
                          placeholder="Add new name..." 
                          value={newAttendeeName}
                          onChange={(e) => setNewAttendeeName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button type="button" onClick={handleAddAttendee}>Add</button>
                      </div>
                      {newAttendeeError && <span className="add-name-error">{newAttendeeError}</span>}
                      <div className="dropdown-divider"></div>
                      
                      <div className="options-list">
                        {usersList.map(u => (
                          <OptionItem 
                            key={`att-opt-${u.id || u._id}`} 
                            user={u} 
                            type="multi" 
                            isSelected={formData.attendees.includes(u.name)} 
                            onSelect={handleAttendeeToggle} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.attendees ? (
                  <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{errors.attendees}</span>
                ) : (
                  <span className="helper-text-orange">You can select multiple and drag to reorder.</span>
                )}
              </div>

              <div className="form-group">
                <label style={{ whiteSpace: 'nowrap' }}>Prepared By <span className="req">*</span></label>
                <div className="custom-multi-select-wrapper" style={{ position: 'relative' }} ref={preparedByRef}>
                  <div 
                    className="custom-select-box" 
                    onClick={() => { setPreparedByOpen(!preparedByOpen); setAttendeesOpen(false); }}
                    style={errors.preparedBy ? {borderColor: '#ef4444'} : {}}
                  >
                    <div className="selected-text">
                      {formData.preparedBy ? (
                        <span>{formData.preparedBy}</span>
                      ) : (
                        <span style={{ color: '#a0a3b1' }}>Select name...</span>
                      )}
                    </div>
                    <ChevronDown size={16} className="select-icon" />
                  </div>
                  
                  {preparedByOpen && (
                    <div className="custom-options-dropdown">
                      <div className="options-list">
                        {usersList.map(u => (
                          <OptionItem 
                            key={`prep-opt-${u.id || u._id}`} 
                            user={u} 
                            type="single" 
                            isSelected={formData.preparedBy === u.name} 
                            onSelect={handlePreparedBySelect} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.preparedBy && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem'}}>{errors.preparedBy}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Notes Card */}
        <div className="form-card">
          <div className="card-header">
            <div className="card-icon"><FileEdit size={18} color="#F8AB37" /></div>
            <div>
              <h4>Meeting Notes</h4>
              <p>Add discussion points, decisions and other important details.</p>
            </div>
            
            <div className="upload-notes-btn-container" style={{ marginLeft: 'auto' }}>
              <button type="button" className="upload-notes-btn" onClick={() => document.getElementById('fileUpload').click()}>
                <Upload size={14} /> Upload Notes <ChevronDown size={14} />
              </button>
              <input 
                id="fileUpload" 
                type="file" 
                accept=".txt,.pdf,.doc,.docx,.xls,.xlsx" 
                onChange={handleFileUpload} 
                style={{display: 'none'}} 
              />
            </div>
          </div>
          
          <div className="form-group full-width" style={{ marginTop: '16px', marginBottom: '0' }}>
            {fileError && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem', marginBottom: '8px', display: 'block'}}>{fileError}</span>}
            {isUploading && <span className="uploading-text" style={{fontSize: '0.75rem', marginBottom: '8px', display: 'block', color: '#16A34A'}}>Uploading...</span>}
            
            <div className="rich-text-editor" style={errors.notes ? {borderColor: '#ef4444'} : {}}>
              <div className="editor-toolbar">
                <div className="toolbar-dropdown" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setFormatDropdownOpen(!formatDropdownOpen)} ref={formatDropdownRef}>
                  <span>Normal</span>
                  <ChevronDown size={14} />
                  {formatDropdownOpen && (
                    <div className="custom-options-dropdown" style={{ width: '150px', top: '100%', left: 0, marginTop: '8px', zIndex: 10 }}>
                      <div className="custom-option-label" onClick={(e) => { e.stopPropagation(); handleFormat('heading-1'); setFormatDropdownOpen(false); }}>Heading 1</div>
                      <div className="custom-option-label" onClick={(e) => { e.stopPropagation(); handleFormat('heading-2'); setFormatDropdownOpen(false); }}>Heading 2</div>
                      <div className="custom-option-label" onClick={(e) => { e.stopPropagation(); handleFormat('heading-3'); setFormatDropdownOpen(false); }}>Heading 3</div>
                      <div className="custom-option-label" onClick={(e) => { e.stopPropagation(); setFormatDropdownOpen(false); }}>Normal</div>
                    </div>
                  )}
                </div>
                <div className="toolbar-divider"></div>
                <button type="button" className="toolbar-btn" onClick={() => handleFormat('bold')} title="Bold"><Bold size={16} /></button>
                <button type="button" className="toolbar-btn" onClick={() => handleFormat('italic')} title="Italic"><Italic size={16} /></button>
                <button type="button" className="toolbar-btn" onClick={() => handleFormat('underline')} title="Underline"><Underline size={16} /></button>
                <div className="toolbar-divider"></div>
                <button type="button" className="toolbar-btn" onClick={() => handleFormat('list')} title="Bullet List"><List size={16} /></button>
                <button type="button" className="toolbar-btn" onClick={() => handleFormat('list-ordered')} title="Numbered List"><ListOrdered size={16} /></button>
                <button type="button" className="toolbar-btn" onClick={() => handleFormat('align-left')} title="Align Left"><AlignLeft size={16} /></button>
                <div className="toolbar-divider"></div>
                <button type="button" className="toolbar-btn" onClick={() => handleFormat('link')} title="Insert Link"><LinkIcon size={16} /></button>
              </div>
              <textarea 
                ref={textareaRef}
                name="notes"
                placeholder="Paste or type the minutes of meeting notes here..."
                value={formData.notes}
                onChange={handleChange}
                onBlur={handleBlur}
              ></textarea>
            </div>
            {errors.notes && <span className="error-text" style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '4px'}}>{errors.notes}</span>}
          </div>
        </div>



        <div className="form-actions-footer">
          <button type="submit" className="submit-btn-dark">
            <FileEdit size={16} /> Create Minutes
          </button>
          <button type="button" className="cancel-btn-outline" onClick={handleBack}>
            <X size={16} /> Cancel
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content glassmorphism" style={{ maxWidth: '800px', width: '90%', fontFamily: "'Inter', sans-serif" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#29251C' }}>Preview Meeting Minutes</h3>
              <button className="close-modal-btn" onClick={() => setShowPreview(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F3EA', textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--border-strong)', color: '#29251C', borderRadius: '8px 0 0 8px' }}>S.No</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--border-strong)', color: '#29251C' }}>Page Name</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--border-strong)', color: '#29251C' }}>Issue</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid var(--border-strong)', color: '#29251C', borderRadius: '0 8px 8px 0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const parsedPoints = parseMomNotes(formData.notes);
                    const indexOfLastPoint = previewCurrentPage * previewRowsPerPage;
                    const indexOfFirstPoint = indexOfLastPoint - previewRowsPerPage;
                    const currentPoints = parsedPoints.slice(indexOfFirstPoint, indexOfLastPoint);
                    const totalPages = Math.max(1, Math.ceil(parsedPoints.length / previewRowsPerPage));
                    
                    return (
                      <>
                        {currentPoints.map((point, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '12px', verticalAlign: 'top', width: '60px', color: '#29251C', fontWeight: '500' }}>{point.index}</td>
                            <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: '600', color: '#29251C' }}>{point.pageName}</td>
                            <td style={{ padding: '12px', verticalAlign: 'top', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>{point.issueText}</td>
                            <td style={{ padding: '12px', verticalAlign: 'top' }}><span style={{ color: '#29251C', fontWeight: '500' }}>Open</span></td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
              
              {(() => {
                const parsedPoints = parseMomNotes(formData.notes);
                const totalPages = Math.max(1, Math.ceil(parsedPoints.length / previewRowsPerPage));
                return (
                  <div className="tracker-pagination-footer" style={{ borderTop: 'none', padding: '16px 0 0 0', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="tp-left" style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>Show</span>
                      <select 
                        className="tp-select" 
                        style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-strong)', padding: '4px', borderRadius: '4px' }}
                        value={previewRowsPerPage} 
                        onChange={(e) => { setPreviewRowsPerPage(Number(e.target.value)); setPreviewCurrentPage(1); }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span>entries</span>
                    </div>
                    <div className="tp-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="tracker-action-btn" 
                        style={{ background: 'transparent', color: previewCurrentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', border: '1px solid var(--border-strong)', padding: '4px 8px', borderRadius: '4px', cursor: previewCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                        disabled={previewCurrentPage === 1} 
                        onClick={() => setPreviewCurrentPage(p => Math.max(1, p - 1))}
                      >Previous</button>
                      
                      <span style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {previewCurrentPage} of {totalPages}</span>
                      
                      <button 
                        className="tracker-action-btn" 
                        style={{ background: 'transparent', color: previewCurrentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', border: '1px solid var(--border-strong)', padding: '4px 8px', borderRadius: '4px', cursor: previewCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        disabled={previewCurrentPage === totalPages} 
                        onClick={() => setPreviewCurrentPage(p => Math.min(totalPages, p + 1))}
                      >Next</button>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
              <button className="cancel-btn-outline" onClick={() => setShowPreview(false)} disabled={isSubmitting}>Back</button>
              <button className="submit-btn-dark" onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Confirming...' : 'Confirm Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content glassmorphism" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: '#dcfce7', color: '#16A34A', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#29251C' }}>Success!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Minutes of meeting have been saved successfully.</p>
            <button 
              className="submit-btn-dark" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/minutes')}
            >
              Go to Meetings ({countdown}s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMinutes;

