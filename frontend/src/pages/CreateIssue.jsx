import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown,
  Bold, Italic, Underline, List, ListOrdered, Strikethrough, Link as LinkIcon,
  Image, Film, Upload, X
} from 'lucide-react';
import './CreateIssue.css';

const CreateIssue = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!date) errs.date = 'Date is required';
    if (!issueDetails.trim()) errs.issueDetails = 'Issue details are required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const d = new Date(date);
    const formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let detectedPageName = 'General Issue';
    const lowerDetails = issueDetails.toLowerCase().trim();
    
    // Pattern 1: "in [page name] when/click/is/not" -> Extracts "[page name]"
    const inMatch = lowerDetails.match(/^in\s+([\w\s]+?)(?:\s+(?:when|page|click|button|is|not|the|on|it|its|it's)|$)/i);
    // Pattern 2: "on [page name] page"
    const onMatch = lowerDetails.match(/on\s+([\w\s]+?)\s+page/i);
    // Pattern 3: "[page name] page" at start
    const pageMatch = lowerDetails.match(/^([\w\s]+?)\s+page/i);

    if (inMatch && inMatch[1].trim().length > 2) {
      detectedPageName = inMatch[1].trim();
    } else if (onMatch && onMatch[1].trim().length > 2) {
      detectedPageName = onMatch[1].trim();
    } else if (pageMatch && pageMatch[1].trim().length > 2) {
      detectedPageName = pageMatch[1].trim();
    } else if (lowerDetails.includes('login') || lowerDetails.includes('auth')) detectedPageName = 'Login Page';
    else if (lowerDetails.includes('pay') || lowerDetails.includes('checkout')) detectedPageName = 'Payment Page';
    else if (lowerDetails.includes('dash')) detectedPageName = 'Dashboard';
    else if (lowerDetails.includes('order') || lowerDetails.includes('cart')) detectedPageName = 'Order Summary';
    else if (lowerDetails.includes('profile')) detectedPageName = 'Profile Page';
    else if (lowerDetails.includes('report') || lowerDetails.includes('pdf')) detectedPageName = 'Reports Page';
    else if (lowerDetails.includes('stock') || lowerDetails.includes('inventor')) detectedPageName = 'Inventory Page';
    else if (lowerDetails.includes('notif') || lowerDetails.includes('email')) detectedPageName = 'Notifications';
    else if (lowerDetails.includes('setting')) detectedPageName = 'Settings Page';
    else {
      const words = lowerDetails.split(/\s+/).slice(0, 3).join(' ');
      detectedPageName = words.length > 0 ? words + '...' : 'Unknown Page';
    }

    // Capitalize properly
    detectedPageName = detectedPageName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const newIssue = {
      pageName: detectedPageName,
      issue: issueDetails,
      status: 'Open',
      assignee: '',
      deployDate: '-',
      deployVer: '',
      raisedDate: formattedDate + ', ' + new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
      raisedSrc: 'Manual Entry',
      attachments: [] // will be filled below
    };

    let uploadedUrls = [];
    if (attachments.length > 0) {
      try {
        const formData = new FormData();
        attachments.forEach(att => formData.append('files', att.file));
        const uploadRes = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedUrls = uploadData.urls;
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
    }

    newIssue.attachments = attachments.map((a, i) => ({ type: a.type, name: a.name, url: uploadedUrls[i] || a.url }));

    try {
      const res = await fetch('/api/v1/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });
      if (res.ok) {
        navigate('/issues');
      } else {
        console.error('Failed to create issue');
      }
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

  const handleFileInput = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
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
    <div className="create-issue-page">

      <div className="ci-breadcrumbs">
        <span className="crumb-link" onClick={() => navigate('/issues')}>Production Issues</span>
        <ChevronRight size={14} className="crumb-sep" />
        <span className="current">Create</span>
      </div>

      <div className="ci-header">
        <div>
          <h2>Create Production Issue</h2>
          <p>Log a new production issue for tracking and resolution.</p>
        </div>
        <button className="ci-back-btn" onClick={() => navigate('/issues')}>
          <ArrowLeft size={16} />
          Back to Production Issues
        </button>
      </div>

      <form className="ci-form-card" onSubmit={handleSubmit}>

        {/* Date */}
        <div className="ci-field">
          <label className="ci-label">Date <span className="ci-req">*</span></label>
          <div className="ci-date-wrapper">
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); if (errors.date) setErrors(p => ({ ...p, date: '' })); }}
              style={errors.date ? { borderColor: '#ef4444' } : {}}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>
          {errors.date && <span className="ci-error">{errors.date}</span>}
        </div>

        {/* Issue Details */}
        <div className="ci-field">
          <label className="ci-label">Issue Details <span className="ci-req">*</span></label>
          <p className="ci-sub-label">Provide detailed information about the production issue.</p>
          <div className="ci-editor" style={errors.issueDetails ? { borderColor: '#ef4444' } : {}}>
            <div className="ci-toolbar">
              <button type="button" className="ci-toolbar-btn" title="Bold" onClick={() => setIssueDetails(prev => prev + '**bold text**')}><Bold size={15} /></button>
              <button type="button" className="ci-toolbar-btn" title="Italic" onClick={() => setIssueDetails(prev => prev + '*italic text*')}><Italic size={15} /></button>
              <button type="button" className="ci-toolbar-btn" title="Underline" onClick={() => setIssueDetails(prev => prev + '<u>underline</u>')}><Underline size={15} /></button>
              <div className="ci-toolbar-sep" />
              <button type="button" className="ci-toolbar-btn" title="Ordered List" onClick={() => setIssueDetails(prev => prev + '\n1. ')}><ListOrdered size={15} /></button>
              <button type="button" className="ci-toolbar-btn" title="Unordered List" onClick={() => setIssueDetails(prev => prev + '\n- ')}><List size={15} /></button>
              <button type="button" className="ci-toolbar-btn" title="Strikethrough" onClick={() => setIssueDetails(prev => prev + '~~strikethrough~~')}><Strikethrough size={15} /></button>
              <button type="button" className="ci-toolbar-btn" title="Insert Link" onClick={() => setIssueDetails(prev => prev + '[link title](http://)')}><LinkIcon size={15} /></button>
            </div>
            <textarea
              className="ci-textarea"
              placeholder="Type or paste the issue details here..."
              value={issueDetails}
              onChange={(e) => { setIssueDetails(e.target.value); if (errors.issueDetails) setErrors(p => ({ ...p, issueDetails: '' })); }}
            />
          </div>
          {errors.issueDetails && <span className="ci-error">{errors.issueDetails}</span>}
        </div>

        {/* Attachments */}
        <div className="ci-field">
          <label className="ci-label">Attachments</label>
          <p className="ci-sub-label">Upload screenshots, images, or screen recording videos to help describe the issue. (Max 100 MB each)</p>

          <div
            className={`ci-dropzone${dragOver ? ' drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('ci-file-input').click()}
          >
            <Upload size={28} className="ci-dropzone-icon" />
            <p className="ci-dropzone-title">Drag & drop files here, or <span className="ci-browse-link">browse</span></p>
            <p className="ci-dropzone-hint">Supports: JPG, PNG, GIF, WebP, MP4, WebM, MOV</p>
            <div className="ci-upload-btns">
              <span className="ci-upload-type-badge"><Image size={13} /> Images</span>
              <span className="ci-upload-type-badge"><Film size={13} /> Videos</span>
            </div>
            <input
              id="ci-file-input"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
              multiple
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {attachments.length > 0 && (
            <div className="ci-preview-grid">
              {attachments.map((att, idx) => (
                <div key={idx} className="ci-preview-item">
                  {att.type === 'image'
                    ? <img src={att.url} alt={att.name} className="ci-preview-media" />
                    : <video src={att.url} className="ci-preview-media" muted />
                  }
                  <div className="ci-preview-overlay">
                    <span className="ci-preview-name" title={att.name}>{att.name}</span>
                    <button
                      type="button"
                      className="ci-preview-remove"
                      onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="ci-preview-type-badge">
                    {att.type === 'image' ? <Image size={11} /> : <Film size={11} />}
                    <span>{att.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ci-actions">
          <button type="submit" className="ci-submit-btn">Create Issue</button>
          <button type="button" className="ci-cancel-btn" onClick={() => navigate('/issues')}>Cancel</button>
        </div>

      </form>
    </div>
  );
};

export default CreateIssue;
