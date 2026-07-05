import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Upload, X, Image as ImageIcon, Film, Plus,
  Bold, Italic, Underline, List, ListOrdered, Strikethrough, Link as LinkIcon, Send, Settings2, Sparkles, Image, AlertTriangle, Loader2
} from 'lucide-react';
import './CreateIssue.css';

const CreateQAIssue = () => {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState('quick'); // 'quick' or 'advanced'
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WhatsApp Validation State
  const [waConfig, setWaConfig] = useState(null);
  const [waChats, setWaChats] = useState([]);
  const [blockingReason, setBlockingReason] = useState(null); // 'disconnected', 'no_group', 'device_changed'
  const [selectedGroupToSave, setSelectedGroupToSave] = useState('');

  // Advanced Form State
  const [formData, setFormData] = useState({
    module: '',
    pageName: '',
    issueTitle: '',
    issueDetails: '',
    type: 'Functional',
    severity: 'Medium',
    priority: 'P3',
    status: 'Open',
    assignedTo: ''
  });

  // Sync Options
  const [syncWhatsApp, setSyncWhatsApp] = useState(false);
  const [syncRedmine, setSyncRedmine] = useState(false);

  // Single Quick Form State
  const [quickDescription, setQuickDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  // Bulk Form State
  const [bulkCards, setBulkCards] = useState([
    { id: 1, description: '', attachment: null, syncWhatsApp: false, syncRedmine: false },
    { id: 2, description: '', attachment: null, syncWhatsApp: false, syncRedmine: false },
    { id: 3, description: '', attachment: null, syncWhatsApp: false, syncRedmine: false },
    { id: 4, description: '', attachment: null, syncWhatsApp: false, syncRedmine: false },
  ]);

  // Verification Modal state (only for single quick mode)
  const [showVerification, setShowVerification] = useState(false);
  const [aiData, setAiData] = useState({});

  useEffect(() => {
    fetchWaConfig();
  }, []);

  const fetchWaConfig = async () => {
    try {
      const res = await fetch('/api/v1/whatsapp/status');
      const data = await res.json();
      setWaConfig(data);
      
      const localDeviceId = localStorage.getItem('waDeviceId');

      if (data.status !== 'Connected') {
        setBlockingReason('disconnected');
      } else if (localDeviceId && data.connectedDeviceId && localDeviceId !== data.connectedDeviceId) {
        setBlockingReason('device_changed');
        fetchWaChats();
      } else if (!data.issueDefaultGroup) {
        setBlockingReason('no_group');
        fetchWaChats();
      } else {
        setBlockingReason(null);
        localStorage.setItem('waDeviceId', data.connectedDeviceId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWaChats = async () => {
    try {
      const res = await fetch('/api/v1/whatsapp/chats');
      const data = await res.json();
      setWaChats(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error(err);
      setWaChats([]);
    }
  };

  const saveWaGroup = async () => {
    if (!selectedGroupToSave) return;
    try {
      await fetch('/api/v1/whatsapp/issue-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroupToSave })
      });
      if (waConfig) {
        localStorage.setItem('waDeviceId', waConfig.connectedDeviceId);
      }
      fetchWaConfig();
    } catch (err) {
      console.error(err);
    }
  };

  const processFiles = (files) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    Array.from(files).forEach(file => {
      if (!allowed.includes(file.type)) return;
      if (file.size > 100 * 1024 * 1024) return;
      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, { file, url, type: file.type.startsWith('video') ? 'video' : 'image', name: file.name }]);
    });
  };

  const handlePaste = (e) => {
    if (mode === 'quick' && e.clipboardData && e.clipboardData.files.length > 0) {
      e.preventDefault();
      
      const files = e.clipboardData.files;
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
      const validFiles = Array.from(files).filter(f => allowed.includes(f.type) && f.size <= 100 * 1024 * 1024);
      
      if (validFiles.length === 0) return;
      
      // Just take the first pasted file for simplicity
      const file = validFiles[0]; 
      const url = URL.createObjectURL(file);
      const newAtt = { file, url, type: file.type.startsWith('video') ? 'video' : 'image', name: file.name };

      if (!isBulkMode) {
        setAttachments(prev => [...prev, newAtt]);
      } else {
        // Bulk Mode: Find the first card without an attachment
        setBulkCards(cards => {
          const emptyCardIndex = cards.findIndex(c => !c.attachment);
          if (emptyCardIndex !== -1) {
            const newCards = [...cards];
            newCards[emptyCardIndex] = { ...newCards[emptyCardIndex], attachment: newAtt };
            return newCards;
          } else {
            // If all cards have attachments, create a new card automatically!
            return [...cards, { id: Date.now(), description: '', attachment: newAtt, syncWhatsApp: false, syncRedmine: false }];
          }
        });
      }
    }
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const detectIssueMetadata = (text) => {
    const t = text.toLowerCase();
    
    let module = 'General';
    let pageName = 'General';
    let type = 'Functional';
    let severity = 'Medium';
    
    if (t.includes('customer')) module = 'Customer';
    else if (t.includes('pos') || t.includes('billing')) module = 'POS';
    else if (t.includes('login') || t.includes('auth')) module = 'Login';
    else if (t.includes('payment') || t.includes('card')) module = 'Payment';
    
    if (t.includes('list')) pageName = 'List Page';
    else if (t.includes('login')) pageName = 'Login Page';
    else if (t.includes('checkout') || t.includes('billing')) pageName = 'Checkout';
    else if (t.includes('search')) pageName = 'Search Page';
    
    if (t.includes('alignment') || t.includes('color') || t.includes('visible') || t.includes('layout')) type = 'UI';
    else if (t.includes('slow') || t.includes('timeout') || t.includes('lag')) type = 'Performance';
    else type = 'Functional';
    
    if (t.includes('crash') || t.includes('empty') || t.includes('not loading') || t.includes('failed')) severity = 'Critical';
    else if (t.includes('incorrect') || t.includes('calculation') || t.includes('not working')) severity = 'High';
    else if (t.includes('alignment') || t.includes('color')) severity = 'Low';
    
    let title = text.split('\n')[0].substring(0, 60);
    if (title.length === 60) title += '...';
    if (!title) title = 'Issue reported via screenshot';

    let confidence = 100;
    if (module === 'General') confidence -= 20;
    if (pageName === 'General') confidence -= 10;
    if (text.length < 15) confidence -= 20;
    
    return { module, pageName, type, severity, issueTitle: title, confidence };
  };

  const submitFinalIssue = async (data, details) => {
    let uploadedUrls = [];
    if (attachments.length > 0) {
      try {
        const uploadForm = new FormData();
        attachments.forEach(att => uploadForm.append('files', att.file));
        const uploadRes = await fetch('/api/v1/upload', {
          method: 'POST',
          body: uploadForm
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedUrls = uploadData.urls;
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
    }

    const newIssue = {
      ...data,
      priority: data.priority || 'P3',
      status: 'Open',
      assignedTo: '',
      issueDetails: details,
      raisedBy: (JSON.parse(localStorage.getItem('user'))?.name || 'System'),
      raisedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      attachmentsCount: attachments.length,
      attachments: attachments.map((a, i) => ({ type: a.type, name: a.name, url: uploadedUrls[i] || a.url }))
    };

    try {
      const res = await fetch('/api/v1/qa-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });
      if (res.ok) {
        if (syncWhatsApp) {
          try {
            await fetch('/api/v1/whatsapp/send-issue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                pageName: data.pageName,
                issueDetails: details || data.issueTitle,
                attachments: newIssue.attachments,
                priority: data.priority || 'P3',
                module: data.module || 'General',
                user: (JSON.parse(localStorage.getItem('user'))?.name || 'System') 
              })
            });
          } catch(e) { console.error("WA send failed", e); }
        }
        navigate('/qa-issues');
      } else {
        const errorData = await res.json();
        alert('Failed to create issue: ' + (errorData.message || res.statusText));
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while creating the issue: ' + err.message);
    }
  };

  const handleQuickSubmit = () => {
    if (!quickDescription.trim() && attachments.length === 0) {
      alert("Please provide a description or upload a screenshot.");
      return;
    }
    
    const detected = detectIssueMetadata(quickDescription);
    
    if (detected.confidence < 80) {
      setAiData(detected);
      setShowVerification(true);
      return;
    }
    
    submitFinalIssue(detected, quickDescription);
  };

  const handleAdvancedSubmit = (addAnother) => {
    if (!formData.issueTitle) {
      setErrors({ issueTitle: 'Required' });
      return;
    }
    
    submitFinalIssue(formData, formData.issueDetails).then(() => {
      if (addAnother) {
        setFormData({
          module: '', pageName: '', issueTitle: '', issueDetails: '',
          type: 'Functional', severity: 'Medium', priority: 'P3', status: 'Open', assignedTo: ''
        });
        setAttachments([]);
        setErrors({});
        alert('Issue created successfully! You can add another.');
      }
    });
  };

  const handleBulkSubmit = async () => {
    const activeCards = bulkCards.filter(c => c.description.trim() || c.attachment);
    if (activeCards.length === 0) {
      alert("Please fill out at least one issue card.");
      return;
    }
    
    setIsSubmitting(true);
    
    for (const card of activeCards) {
      const detected = detectIssueMetadata(card.description || 'Issue reported via screenshot');
      
      let uploadedUrls = [];
      if (card.attachment) {
        try {
          const uploadForm = new FormData();
          uploadForm.append('files', card.attachment.file);
          const uploadRes = await fetch('/api/v1/upload', {
            method: 'POST',
            body: uploadForm
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            uploadedUrls = uploadData.urls;
          }
        } catch (err) {
          console.error('Upload failed', err);
        }
      }

      const newIssue = {
        ...detected,
        priority: detected.priority || 'P3',
        status: 'Open',
        assignedTo: '',
        issueDetails: card.description,
        raisedBy: (JSON.parse(localStorage.getItem('user'))?.name || 'System'),
        raisedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        attachmentsCount: card.attachment ? 1 : 0,
        attachments: card.attachment ? [{ type: card.attachment.type, name: card.attachment.name, url: uploadedUrls[0] || card.attachment.url }] : []
      };

      try {
        await fetch('/api/v1/qa-issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newIssue)
        });
        
        if (card.syncWhatsApp) {
          try {
            await fetch('/api/v1/whatsapp/send-issue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                pageName: detected.pageName || 'Unknown Page',
                issueDetails: card.description || detected.issueTitle,
                attachments: newIssue.attachments,
                priority: detected.priority || 'P3',
                module: detected.module || 'General',
                user: (JSON.parse(localStorage.getItem('user'))?.name || 'System') 
              })
            });
          } catch(e) { console.error("WA send failed", e); }
        }
        
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsSubmitting(false);
    navigate('/qa-issues');
  };

  const handleBulkFileChange = (e, id) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setBulkCards(cards => cards.map(c => c.id === id ? { ...c, attachment: { file, url, type: file.type.startsWith('video') ? 'video' : 'image', name: file.name } } : c));
    }
  };

  return (
    <div className="create-issue-page" onPaste={handlePaste}>
      <div className="ci-breadcrumbs">
        <span className="crumb-link" onClick={() => navigate('/qa-issues')}>QA Workspace</span>
        <ChevronRight size={14} className="crumb-sep" />
        <span className="crumb-link" onClick={() => navigate('/qa-issues')}>Issues Management</span>
        <ChevronRight size={14} className="crumb-sep" />
        <span className="current">Create Issue</span>
      </div>

      <div className="ci-header">
        <div>
          <h2>Create QA Issue</h2>
          <p>Log a new testing defect for tracking and resolution.</p>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          <button className="mode-toggle-btn" onClick={() => setMode(mode === 'quick' ? 'advanced' : 'quick')}>
            {mode === 'quick' ? <><Settings2 size={16} style={{display:'inline', marginBottom:'-3px', marginRight:'6px'}}/> Advanced Mode</> : <><Sparkles size={16} style={{display:'inline', marginBottom:'-3px', marginRight:'6px'}}/> Quick Mode</>}
          </button>
          <button className="ci-back-btn" onClick={() => navigate('/qa-issues')}>
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      <div className="ci-form-card">
        {mode === 'quick' ? (
          <div className="ci-quick-container">
            
            <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontSize: '14px', cursor: 'pointer', alignSelf: 'flex-start'}}>
              <input type="checkbox" checked={isBulkMode} onChange={(e) => setIsBulkMode(e.target.checked)} />
              Bulk Upload Issues
            </label>

            {!isBulkMode ? (
              // SINGLE QUICK MODE
              <>
                <div
                  className={`ci-quick-dropzone${dragOver ? ' drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
                  onClick={() => document.getElementById('qa-quick-file').click()}
                >
                  <Upload size={24} className="ci-dropzone-icon" style={{marginBottom: '8px'}} />
                  <p style={{margin: '0', color: '#a0a3b1', fontSize: '0.85rem'}}>Drag & drop files here, browse, or press <strong style={{color: '#16A34A'}}>Ctrl + V</strong></p>
                  
                  <input
                    id="qa-quick-file"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
                    style={{ display: 'none' }}
                  />
                </div>

                {attachments.length > 0 && (
                  <div style={{fontSize: '13px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <ImageIcon size={14} /> {attachments.length} attachment(s) selected
                    <span style={{color: '#ef4444', cursor: 'pointer', marginLeft: '12px'}} onClick={() => setAttachments([])}>Clear</span>
                  </div>
                )}

                <textarea 
                  className="ci-quick-textarea"
                  placeholder="Describe the issue... (e.g., Customer search not working)"
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                />

                <div style={{display: 'flex', gap: '16px', alignItems: 'center', padding: '4px 0'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a3b1', fontSize: '13px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={syncWhatsApp} onChange={e => setSyncWhatsApp(e.target.checked)} />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '14px', height: '14px'}}/> Sync to WhatsApp
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a3b1', fontSize: '13px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={syncRedmine} onChange={e => setSyncRedmine(e.target.checked)} />
                    Sync to Redmine
                  </label>
                </div>

                <button className="ci-quick-submit" onClick={handleQuickSubmit}>
                  <Send size={18} /> Submit Issue
                </button>
              </>
            ) : (
              // BULK MODE
              <>
                <div className="ci-bulk-grid">
                  {bulkCards.map((card, index) => (
                    <div key={card.id} className="ci-bulk-card">
                      <div 
                        className="ci-bulk-dropzone" 
                        onClick={() => document.getElementById(`bulk-file-${card.id}`).click()}
                      >
                        {card.attachment ? (
                          <>
                            {card.attachment.type === 'video' ? <video src={card.attachment.url} className="ci-bulk-preview" /> : <img src={card.attachment.url} className="ci-bulk-preview" />}
                            <div style={{position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '4px'}} onClick={(e) => { e.stopPropagation(); setBulkCards(cards => cards.map(c => c.id === card.id ? { ...c, attachment: null } : c)); }}>
                              <X size={12} color="#fff" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Image size={24} color="#6b7280" />
                            <span style={{fontSize: '11px', color: '#a0a3b1', marginTop: '4px'}}>Click to add</span>
                          </>
                        )}
                        <input
                          id={`bulk-file-${card.id}`}
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => handleBulkFileChange(e, card.id)}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <textarea 
                        className="ci-bulk-textarea" 
                        placeholder="Description..." 
                        value={card.description}
                        onChange={(e) => setBulkCards(cards => cards.map(c => c.id === card.id ? { ...c, description: e.target.value } : c))}
                      />
                      <div style={{display: 'flex', gap: '12px', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                        <label style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#a0a3b1', fontSize: '11px', cursor: 'pointer'}}>
                          <input type="checkbox" checked={card.syncWhatsApp} onChange={(e) => setBulkCards(cards => cards.map(c => c.id === card.id ? { ...c, syncWhatsApp: e.target.checked } : c))} style={{transform: 'scale(0.8)', margin: 0}} />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '12px', height: '12px'}}/> WA
                        </label>
                        <label style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#a0a3b1', fontSize: '11px', cursor: 'pointer'}}>
                          <input type="checkbox" checked={card.syncRedmine} onChange={(e) => setBulkCards(cards => cards.map(c => c.id === card.id ? { ...c, syncRedmine: e.target.checked } : c))} style={{transform: 'scale(0.8)', margin: 0}} />
                          Redmine
                        </label>
                      </div>
                    </div>
                  ))}

                  <div className="ci-bulk-add-card" onClick={() => setBulkCards([...bulkCards, { id: Date.now(), description: '', attachment: null, syncWhatsApp: false, syncRedmine: false }])}>
                    <Plus size={32} />
                    <span style={{fontSize: '13px', marginTop: '8px'}}>Add More</span>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '16px', alignItems: 'center', padding: '8px 0'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a3b1', fontSize: '13px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={syncWhatsApp} onChange={e => {
                      const checked = e.target.checked;
                      setSyncWhatsApp(checked);
                      setBulkCards(cards => cards.map(c => ({ ...c, syncWhatsApp: checked })));
                    }} />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '14px', height: '14px'}}/> Sync to WhatsApp
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a3b1', fontSize: '13px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={syncRedmine} onChange={e => {
                      const checked = e.target.checked;
                      setSyncRedmine(checked);
                      setBulkCards(cards => cards.map(c => ({ ...c, syncRedmine: checked })));
                    }} />
                    Sync to Redmine
                  </label>
                </div>

                <button className="ci-quick-submit" onClick={handleBulkSubmit} disabled={isSubmitting} style={isSubmitting ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
                  {isSubmitting ? <Loader2 size={18} className="spinner" /> : <Send size={18} />} 
                  {isSubmitting ? 'Submitting Issues...' : 'Submit All Filled Issues'}
                </button>
              </>
            )}

            <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', margin: 0}}>
              AI will automatically detect the Module, Page, Type, and Severity from your descriptions.
            </p>
          </div>
        ) : (
          // ADVANCED MODE UI
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="ci-field">
              <label className="ci-label">Issue Title <span className="ci-req">*</span></label>
              <input className="ci-input" name="issueTitle" value={formData.issueTitle} onChange={(e) => setFormData({...formData, issueTitle: e.target.value})} style={errors.issueTitle ? { borderColor: '#ef4444' } : {}} placeholder="e.g. Payment validation failed" />
            </div>

            <div className="ci-field">
              <label className="ci-label">Module</label>
              <input className="ci-input" name="module" value={formData.module} onChange={(e) => setFormData({...formData, module: e.target.value})} placeholder="e.g. POS" />
            </div>

            <div className="ci-field">
              <label className="ci-label">Page Name</label>
              <input className="ci-input" name="pageName" value={formData.pageName} onChange={(e) => setFormData({...formData, pageName: e.target.value})} placeholder="e.g. Checkout" />
            </div>

            <div className="ci-field">
              <label className="ci-label">Severity</label>
              <select className="ci-input" name="severity" value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} style={{background: '#111216', color: '#fff'}}>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div className="ci-field">
              <label className="ci-label">Priority</label>
              <select className="ci-input" name="priority" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} style={{background: '#111216', color: '#fff'}}>
                <option>P1</option>
                <option>P2</option>
                <option>P3</option>
              </select>
            </div>

            <div className="ci-field">
              <label className="ci-label">Type</label>
              <select className="ci-input" name="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} style={{background: '#111216', color: '#fff'}}>
                <option>Functional</option>
                <option>UI</option>
                <option>Performance</option>
                <option>Security</option>
              </select>
            </div>

            <div className="ci-field">
              <label className="ci-label">Assigned To</label>
              <input className="ci-input" name="assignedTo" value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} placeholder="e.g. Ravi Kumar" />
            </div>

            <div className="ci-field">
              <label className="ci-label">Status</label>
              <select className="ci-input" name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{background: '#111216', color: '#fff'}}>
                <option>Open</option>
                <option>In Progress</option>
                <option>Retesting</option>
                <option>Blocked</option>
                <option>Resolved</option>
                <option>Closed</option>
                <option>Future Implementation</option>
              </select>
            </div>

            {/* Issue Details Notepad */}
            <div className="ci-field" style={{ gridColumn: 'span 2' }}>
              <label className="ci-label">Issue Details</label>
              <p className="ci-sub-label">Provide detailed information about the QA issue.</p>
              <div className="ci-editor">
                <div className="ci-toolbar">
                  <button type="button" className="ci-toolbar-btn" title="Bold" onClick={() => setFormData({...formData, issueDetails: formData.issueDetails + '**bold text**' })}><Bold size={15} /></button>
                  <button type="button" className="ci-toolbar-btn" title="Italic" onClick={() => setFormData({...formData, issueDetails: formData.issueDetails + '*italic text*' })}><Italic size={15} /></button>
                  <button type="button" className="ci-toolbar-btn" title="Underline" onClick={() => setFormData({...formData, issueDetails: formData.issueDetails + '<u>underline</u>' })}><Underline size={15} /></button>
                  <div className="ci-toolbar-sep" />
                  <button type="button" className="ci-toolbar-btn" title="Ordered List" onClick={() => setFormData({...formData, issueDetails: formData.issueDetails + '\n1. ' })}><ListOrdered size={15} /></button>
                  <button type="button" className="ci-toolbar-btn" title="Unordered List" onClick={() => setFormData({...formData, issueDetails: formData.issueDetails + '\n- ' })}><List size={15} /></button>
                  <button type="button" className="ci-toolbar-btn" title="Strikethrough" onClick={() => setFormData({...formData, issueDetails: formData.issueDetails + '~~strikethrough~~' })}><Strikethrough size={15} /></button>
                  <button type="button" className="ci-toolbar-btn" title="Insert Link" onClick={() => setFormData({...formData, issueDetails: formData.issueDetails + '[link title](http://)' })}><LinkIcon size={15} /></button>
                </div>
                <textarea
                  className="ci-textarea"
                  placeholder="Type or paste the issue details here..."
                  value={formData.issueDetails}
                  onChange={(e) => setFormData({...formData, issueDetails: e.target.value})}
                />
              </div>
            </div>

            <div className="ci-field" style={{ gridColumn: 'span 2' }}>
              <label className="ci-label">Attachments</label>
              <div
                className={`ci-dropzone${dragOver ? ' drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
                onClick={() => document.getElementById('qa-adv-file').click()}
              >
                <Upload size={28} className="ci-dropzone-icon" />
                <p className="ci-dropzone-title">Drag & drop files here, or <span className="ci-browse-link">browse</span></p>
                <p className="ci-dropzone-hint">Supports: JPG, PNG, GIF, WebP, MP4, WebM, MOV</p>
                <input
                  id="qa-adv-file"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
                  style={{ display: 'none' }}
                />
              </div>

              {attachments.length > 0 && (
                <div className="ci-preview-grid">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="ci-preview-item">
                      {att.type === 'image' ? <img src={att.url} alt={att.name} className="ci-preview-media" /> : <video src={att.url} className="ci-preview-media" muted />}
                      <div className="ci-preview-overlay">
                        <span className="ci-preview-name" title={att.name}>{att.name}</span>
                        <button type="button" className="ci-preview-remove" onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', alignItems: 'center', padding: '4px 0' }}>
              <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a3b1', fontSize: '13px', cursor: 'pointer'}}>
                <input type="checkbox" checked={syncWhatsApp} onChange={e => setSyncWhatsApp(e.target.checked)} />
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '14px', height: '14px'}}/> Sync to WhatsApp
              </label>
              <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a3b1', fontSize: '13px', cursor: 'pointer'}}>
                <input type="checkbox" checked={syncRedmine} onChange={e => setSyncRedmine(e.target.checked)} />
                Sync to Redmine
              </label>
            </div>

            <div className="ci-actions" style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
              <button type="button" className="ci-submit-btn" onClick={() => handleAdvancedSubmit(false)}>
                Create Issue
              </button>
              <button type="button" className="ci-submit-btn" style={{ background: '#2a2c33', color: '#fff', border: '1px solid #3f424f' }} onClick={() => handleAdvancedSubmit(true)}>
                Create and Add Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Verification Modal */}
      {showVerification && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999}}>
          <div style={{background: '#111216', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #2a2c33', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
            <h3 style={{margin: '0 0 16px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px'}}><Sparkles size={18} color="#16A34A"/> Please verify AI detection</h3>
            <p style={{fontSize: '13px', color: '#a0a3b1', marginBottom: '20px'}}>
              AI confidence was low ({aiData.confidence}%). Please confirm or adjust the detected fields before submitting.
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div>
                <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '4px'}}>Module</label>
                <input className="ci-input" value={aiData.module} onChange={e => setAiData({...aiData, module: e.target.value})} />
              </div>
              <div>
                <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '4px'}}>Page Name</label>
                <input className="ci-input" value={aiData.pageName} onChange={e => setAiData({...aiData, pageName: e.target.value})} />
              </div>
              <div>
                <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '4px'}}>Type</label>
                <select className="ci-input" value={aiData.type} onChange={e => setAiData({...aiData, type: e.target.value})}>
                  <option>Functional</option>
                  <option>UI</option>
                  <option>Performance</option>
                  <option>Security</option>
                </select>
              </div>
              <div>
                <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '4px'}}>Severity</label>
                <select className="ci-input" value={aiData.severity} onChange={e => setAiData({...aiData, severity: e.target.value})}>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
              <button 
                className="ci-submit-btn" 
                style={{flex: 1, padding: '10px'}} 
                onClick={() => {
                  setShowVerification(false);
                  submitFinalIssue(aiData, quickDescription);
                }}
              >
                Confirm & Submit
              </button>
              <button 
                className="ci-cancel-btn" 
                style={{flex: 1, padding: '10px'}} 
                onClick={() => setShowVerification(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocking Validation Modals */}
      {blockingReason === 'disconnected' && (
        <div className="qa-modal-overlay">
          <div className="qa-modal" style={{width: '400px', textAlign: 'center'}}>
            <AlertTriangle size={48} color="#ef4444" style={{margin: '0 auto 16px'}} />
            <h3 style={{marginBottom: '12px'}}>WhatsApp Not Connected</h3>
            <p style={{color: '#a0a3b1', fontSize: '14px', marginBottom: '24px'}}>
              Please connect your WhatsApp account before creating issues.
            </p>
            <button className="qa-btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={() => navigate('/whatsapp')}>Connect WhatsApp</button>
          </div>
        </div>
      )}

      {blockingReason === 'no_group' && (
        <div className="qa-modal-overlay">
          <div className="qa-modal" style={{width: '450px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
              <AlertTriangle size={24} color="#16A34A" />
              <h3 style={{margin: 0}}>No Issue Group Selected</h3>
            </div>
            <p style={{color: '#a0a3b1', fontSize: '14px', marginBottom: '24px'}}>
              Please select a default WhatsApp group where issues should be posted.
            </p>
            
            <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Available Groups</label>
            <select className="ci-input" value={selectedGroupToSave} onChange={e => setSelectedGroupToSave(e.target.value)} style={{marginBottom: '24px'}}>
              <option value="">Select a group...</option>
              {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <button className="qa-btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={saveWaGroup}>Save Group</button>
          </div>
        </div>
      )}

      {blockingReason === 'device_changed' && (
        <div className="qa-modal-overlay">
          <div className="qa-modal" style={{width: '450px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
              <AlertTriangle size={24} color="#ef4444" />
              <h3 style={{margin: 0}}>New WhatsApp Device Detected</h3>
            </div>
            <p style={{color: '#a0a3b1', fontSize: '14px', marginBottom: '24px'}}>
              We detected a different device or account connection. Please verify and select your Issue WhatsApp Group again before creating issues.
            </p>
            
            <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Available Groups</label>
            <select className="ci-input" value={selectedGroupToSave} onChange={e => setSelectedGroupToSave(e.target.value)} style={{marginBottom: '24px'}}>
              <option value="">Select a group...</option>
              {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <div style={{display: 'flex', gap: '12px'}}>
              <button className="qa-btn-primary" style={{flex: 1, justifyContent: 'center'}} onClick={saveWaGroup}>Select Group</button>
              <button className="qa-btn-secondary" style={{flex: 1, justifyContent: 'center'}} onClick={() => navigate('/qa-issues')}>Verify Later</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateQAIssue;

