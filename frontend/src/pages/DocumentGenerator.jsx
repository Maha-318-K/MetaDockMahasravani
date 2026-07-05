import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Search, Eye, Download, Trash2, X, ChevronRight, CheckCircle, Clock, AlertTriangle, Send, Settings2, History, User, Users, Calendar, Flag, BarChart2, Package, ChevronLeft 
} from 'lucide-react';
import './DocumentGenerator.css';
import logoImg from '../assets/logo.png'; // Assuming logo is available
import html2pdf from 'html2pdf.js';

const DocumentGenerator = () => {
  const [view, setView] = useState('list'); // 'list' | 'wizard' | 'preview'
  const [documents, setDocuments] = useState([]);

  const getInitials = (name) => {
    if (!name) return 'UN';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getDocTypeIcon = (type) => {
    if (type.includes('Client')) return <Users size={14} />;
    if (type.includes('Status') || type.includes('Update')) return <BarChart2 size={14} />;
    if (type.includes('Release')) return <Package size={14} />;
    if (type.includes('Monthly') || type.includes('Weekly')) return <Calendar size={14} />;
    return <FileText size={14} />;
  };
  
  // Wizard State
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('Project Status Report');
  const [globalDateFrom, setGlobalDateFrom] = useState('');
  const [globalDateTo, setGlobalDateTo] = useState('');
  const [filters, setFilters] = useState({
    requirements: { selected: false },
    mom: { selected: false },
    qaIssues: { selected: false },
    prodIssues: { selected: false }
  });

  const [reportData, setReportData] = useState(null);

  // WhatsApp Send Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [documentToSend, setDocumentToSend] = useState(null);
  const [waChats, setWaChats] = useState([]);
  const [isSending, setIsSending] = useState(false);
  
  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [selectedChat, setSelectedChat] = useState('');
  const [waConfig, setWaConfig] = useState(null);

  // WhatsApp Settings Modal
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [isChangingGroup, setIsChangingGroup] = useState(false);
  const [selectedGroupToSave, setSelectedGroupToSave] = useState('');

  useEffect(() => {
    if (view === 'list') {
      fetchDocuments();
      fetchWaData();
    }
  }, [view]);

  const fetchWaData = async () => {
    try {
      const configRes = await fetch('/api/v1/whatsapp/status');
      const configData = await configRes.json();
      setWaConfig(configData);
      
      const chatRes = await fetch('/api/v1/whatsapp/chats');
      const chatData = await chatRes.json();
      setWaChats(Array.isArray(chatData) ? chatData : (chatData.data || []));
      if (configData.issueDefaultGroup) {
        setSelectedChat(configData.issueDefaultGroup);
      }
    } catch (e) {
      console.error(e);
      setWaChats([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/v1/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (e) {
      console.error(e);
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
      setIsChangingGroup(false);
      fetchWaData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    try {
      const payload = {
        documentName: documentName || 'Untitled Document',
        documentType,
        createdBy: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), // Replace with real user if available
        filters
      };
      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
        setView('preview');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await fetch(`/api/v1/documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (e) {
      console.error(e);
    }
  };

  const exportToPDF = () => {
    window.print(); // Triggers browser print, tailored via CSS @media print
  };

  const exportToWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>table {border-collapse: collapse; width: 100%;} th, td {border: 1px solid #ddd; padding: 8px;} th {background-color: #f2f2f2;}</style></head><body>";
    const footer = "</body></html>";
    const previewContent = document.getElementById("document-preview-content").innerHTML;
    const sourceHTML = header + previewContent + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${documentName || 'Document'}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const toggleFilter = (key) => {
    setFilters({ ...filters, [key]: { ...filters[key], selected: !filters[key].selected } });
  };

  const updateFilterDate = (key, field, value) => {
    setFilters({ ...filters, [key]: { ...filters[key], [field]: value } });
  };

  const handleSendToWhatsApp = async () => {
    if (!selectedChat) {
      alert("Please select a group or contact to send the document to.");
      return;
    }
    if (!documentToSend) return;
    
    setIsSending(true);
    // Check if we are in preview mode or list mode
    // If in list mode without preview rendered, we just send summary for now
    // Or we can add logic to render it. For the sake of simplicity, we'll try to capture the preview if available.
    let attachmentUrl = null;
    
    const previewEl = document.getElementById("document-preview-content");
    if (previewEl) {
      try {
        const opt = {
          margin: 0.5,
          filename: `${documentToSend.documentName || 'Document'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        const pdfBlob = await html2pdf().set(opt).from(previewEl).output('blob');
        
        const uploadForm = new FormData();
        uploadForm.append('files', pdfBlob, opt.filename);
        
        const uploadRes = await fetch('/api/v1/upload', {
          method: 'POST',
          body: uploadForm
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.urls && uploadData.urls.length > 0) {
          attachmentUrl = uploadData.urls[0];
        } else {
           throw new Error("Failed to upload generated PDF");
        }
      } catch (err) {
        console.error("Failed to generate/upload PDF", err);
        alert("Warning: Could not generate the PDF attachment. Sending summary text only. Error: " + err.message);
      }
    } else {
      // List view - previewEl is not in the DOM
      const confirmSend = window.confirm("Notice: Sending from the history list will only send a text summary. To send the actual PDF document, you must generate a new document and send it directly from the preview screen.\n\nDo you want to proceed with sending the text summary?");
      if (!confirmSend) {
        setIsSending(false);
        return;
      }
    }

    try {
      const payload = {
        chatId: selectedChat,
        documentName: documentToSend.documentName,
        documentType: documentToSend.documentType,
        generatedDate: documentToSend.generatedDate,
        attachmentUrl: attachmentUrl,
        user: (JSON.parse(localStorage.getItem('user'))?.name || 'System')
      };
      const res = await fetch('/api/v1/whatsapp/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || 'Failed to send to WhatsApp');
      }
      
      // Update history
      const selectedChatName = waChats.find(c => c.id === selectedChat)?.name || selectedChat;
      await fetch(`/api/v1/documents/${documentToSend.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyEntry: { action: `Sent to WhatsApp (${selectedChatName})`, by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), date: new Date().toISOString() }
        })
      });

      setShowSendModal(false);
      setDocumentToSend(null);
      fetchDocuments();
      alert('Document sent successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to send document.');
    } finally {
      setIsSending(false);
    }
  };

  const loadDocumentAndSend = async (doc) => {
    try {
      const res = await fetch(`/api/v1/documents/${doc.id}/data`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
        setDocumentToSend(data.data.metadata);
        setView('preview');
        // Small delay to allow the preview DOM to mount before the modal opens
        setTimeout(() => {
          setShowSendModal(true);
        }, 100);
      }
    } catch (e) {
      console.error("Error loading document data", e);
    }
  };

  const generateSummaryText = () => {
    if (!reportData) return '';
    const filtersToApply = { ...filters };
    if (globalDateFrom || globalDateTo) {
      Object.keys(filtersToApply).forEach(k => {
        if (filtersToApply[k].selected) {
          filtersToApply[k].from = globalDateFrom;
          filtersToApply[k].to = globalDateTo;
        }
      });
    }

    const { 
      requirements: finalReq, 
      mom: finalMom, 
      qaIssues: finalQa, 
      prodIssues: finalProd 
    } = filterData(allData, filtersToApply);
    
    const parts = [];
    
    if (filters.requirements?.selected) {
      const reqCompleted = finalReq.filter(r => r.status === 'Completed' || r.status === 'Approved').length;
      parts.push(`${reqCompleted} requirements were marked as complete`);
    }
    if (filters.mom?.selected) {
      parts.push(`${mom.length} meetings were documented`);
    }
    if (filters.qaIssues?.selected) {
      const qaOpen = qaIssues.filter(q => q.status !== 'Resolved' && q.status !== 'Closed').length;
      parts.push(`${qaIssues.length} QA issues were identified (with ${qaOpen} still open)`);
    }
    if (filters.prodIssues?.selected) {
      parts.push(`${prodIssues.length} production issues were reported`);
    }

    if (parts.length === 0) return "This report contains no specific project data based on the selected criteria.";
    if (parts.length === 1) return `This report contains project progress based on the selected date ranges. During this period, ${parts[0]}. Overall progress remains steady.`;

    const last = parts.pop();
    return `This report contains project progress based on the selected date ranges. During this period, ${parts.join(', ')}, and ${last}. Overall progress remains steady.`;
  };

  // UI Renders
  if (view === 'list') {
    return (
      <div className="doc-page">
        <div className="doc-header">
          <div className="doc-header-left">
            <div className="doc-header-icon-box">
              <FileText size={28} />
            </div>
            <div className="doc-header-titles">
              <div className="doc-header-top-row">
                <h2>Document Generator</h2>
                <div className={`wa-status-pill ${waConfig?.status !== 'Connected' ? 'disconnected' : ''}`}>
                  <div className="indicator"></div>
                  {waConfig?.status === 'Connected' ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
                </div>
                <button className="doc-btn-secondary" onClick={() => { setShowWaSettings(true); fetchWaData(); }} style={{ padding: '6px 12px', fontSize: '12px', background: '#fff', border: '1px solid #e5e7eb' }}>
                  <Settings2 size={14} /> WhatsApp Settings
                </button>
              </div>
              <p className="doc-header-subtitle">Generate professional documents and share directly via WhatsApp.</p>
            </div>
          </div>
          <button className="doc-btn-primary" onClick={() => { setView('wizard'); }}>
            <Plus size={16} /> Generate New Document
          </button>
        </div>

        <div className="doc-table-container">
          <table className="doc-table">
            <thead>
              <tr>
                <th><div className="th-content"><FileText size={14} /> Document ID</div></th>
                <th><div className="th-content"><FileText size={14} /> Document Name</div></th>
                <th><div className="th-content"><FileText size={14} /> Document Type</div></th>
                <th><div className="th-content"><User size={14} /> Created By</div></th>
                <th><div className="th-content"><Calendar size={14} /> Generated Date</div></th>
                <th><div className="th-content"><Flag size={14} /> Status</div></th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No documents found.</td></tr>
              ) : documents.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="doc-badge-pill">
                      <FileText size={14} />
                      {doc.documentId}
                    </div>
                  </td>
                  <td>{doc.documentName}</td>
                  <td>
                    <div className="doc-type-cell">
                      <div className="doc-icon-pill">
                        {getDocTypeIcon(doc.documentType)}
                      </div>
                      {doc.documentType}
                    </div>
                  </td>
                  <td>
                    <div className="creator-cell">
                      <div className="avatar-initials">{getInitials(doc.createdBy)}</div>
                      {doc.createdBy}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      {doc.generatedDate}
                    </div>
                  </td>
                  <td>
                    <div className="status-badge">{doc.status}</div>
                  </td>
                  <td>
                    <div className="doc-actions" style={{justifyContent: 'center'}}>
                      <button title="View History" onClick={() => { setHistoryDoc(doc); setShowHistoryModal(true); }}>
                        <History size={16} />
                      </button>
                      <button title="Send to WhatsApp" onClick={() => loadDocumentAndSend(doc)}>
                        <Send size={16} />
                      </button>
                      <button className="delete-btn" title="Delete" onClick={() => handleDelete(doc.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="doc-table-footer">
            <div className="footer-left">
              <span>Showing 1 to {documents.length} of {documents.length} entries</span>
              <select className="rows-dropdown">
                <option>10 Rows</option>
                <option>20 Rows</option>
                <option>50 Rows</option>
              </select>
            </div>
            <div className="pagination-controls">
              <button className="page-btn"><ChevronLeft size={16} /></button>
              <button className="page-btn active">1</button>
              <button className="page-btn"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* WhatsApp Send Modal */}
        {showSendModal && (
          <div className="qa-modal-overlay" onClick={() => setShowSendModal(false)}>
            <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
              <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Send size={20} color="#16A34A" />
                  <h3 style={{margin: 0}}>Send via WhatsApp</h3>
                </div>
                <X size={20} className="qa-modal-close" onClick={() => setShowSendModal(false)} />
              </div>

              {waConfig?.status !== 'Connected' ? (
                <div style={{textAlign: 'center', padding: '24px 0'}}>
                  <AlertTriangle size={32} color="#16A34A" style={{marginBottom: '12px'}} />
                  <p style={{color: '#a0a3b1', marginBottom: 0}}>WhatsApp is not connected. Please connect it in settings.</p>
                </div>
              ) : (
                <>
                  <p style={{color: '#a0a3b1', fontSize: '13px', marginBottom: '20px'}}>
                    Send a summary of <strong>{documentToSend?.documentName}</strong> to a group or contact.
                  </p>
                  
                  <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Select Destination</label>
                  <select 
                    className="doc-field select" 
                    style={{width: '100%', background: '#1a1b23', border: '1px solid #3f424f', color: '#fff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px'}}
                    value={selectedChat} 
                    onChange={e => setSelectedChat(e.target.value)}
                  >
                    <option value="">Select a group or contact...</option>
                    {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  
                  <button 
                    className="doc-btn-primary" 
                    style={{width: '100%', justifyContent: 'center', opacity: isSending ? 0.7 : 1, cursor: isSending ? 'not-allowed' : 'pointer'}} 
                    onClick={handleSendToWhatsApp}
                    disabled={isSending}
                  >
                    <Send size={16} /> {isSending ? 'Generating PDF & Sending...' : 'Send Document Summary'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Settings Modal */}
        {showWaSettings && waConfig && (
          <div className="qa-modal-overlay" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }}>
            <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
              <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px'}}>
                <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '20px'}}/> 
                  Document WhatsApp Configuration
                </h3>
                <X size={20} className="qa-modal-close" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }} />
              </div>
              
              <div style={{padding: '16px 0'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'}}>
                    <span style={{color: 'inherit', fontWeight: 500}}>Connection Status</span>
                    <span style={{color: waConfig.status === 'Connected' ? '#22c55e' : '#ef4444', fontWeight: 600}}>{waConfig.status}</span>
                  </div>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'}}>
                    <span style={{color: 'inherit', fontWeight: 500}}>Connected Device</span>
                    <span style={{color: 'inherit', fontWeight: 500}}>{waConfig.connectedDeviceId || 'None'}</span>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'}}>
                    <span style={{color: 'inherit', fontWeight: 500}}>Default Document Group</span>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      {!isChangingGroup ? (
                        <>
                          <span style={{color: 'inherit', fontWeight: 500}}>
                            {waConfig.issueDefaultGroup ? waChats.find(c => c.id === waConfig.issueDefaultGroup)?.name || waConfig.issueDefaultGroup : 'Not Configured'}
                          </span>
                          {waConfig.status === 'Connected' && (
                            <button style={{background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={() => { setIsChangingGroup(true); fetchWaData(); }}>Change</button>
                          )}
                        </>
                      ) : (
                        <div style={{display: 'flex', gap: '8px'}}>
                          <select className="doc-field select" style={{background: 'var(--bg-secondary, #fff)', width: '150px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color, #d1d5db)', color: 'inherit'}} value={selectedGroupToSave} onChange={e => setSelectedGroupToSave(e.target.value)}>
                            <option value="">Select Group...</option>
                            {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <button style={{background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={saveWaGroup}>Save</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && historyDoc && (
          <div className="qa-modal-overlay" onClick={() => setShowHistoryModal(false)}>
            <div className="qa-modal" onClick={e => e.stopPropagation()}>
              <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <History size={20} color="#16A34A" />
                  <h3 style={{margin: 0}}>Action History â€” {historyDoc.documentName}</h3>
                </div>
                <X size={20} className="qa-modal-close" onClick={() => setShowHistoryModal(false)} />
              </div>
              <div className="qa-history-list" style={{maxHeight: '400px', overflowY: 'auto'}}>
                {(!historyDoc.history || historyDoc.history.length === 0) ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No history recorded yet.</p>
                ) : (
                  historyDoc.history.slice().reverse().map((h, i) => (
                    <div key={i} className="qa-history-item" style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
                      <span style={{color: '#16A34A', flexShrink: 0}}>[{new Date(h.date).toLocaleString()}]</span>
                      <span style={{fontWeight: 500, color: '#fff', flexShrink: 0}}>{h.by}</span>
                      <span style={{color: '#a0a3b1'}}>{h.action}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'wizard') {
    return (
      <div className="doc-page">
        <div className="doc-breadcrumbs">
          <span className="crumb-link" onClick={() => setView('list')}>Documents</span>
          <ChevronRight size={14} className="crumb-sep" />
          <span className="current">Create Document</span>
        </div>

        <div className="wiz-header-area">
          <div className="wiz-icon-box">
            <FileText size={32} />
          </div>
          <div className="wiz-header-titles">
            <h2>Create New Document</h2>
            <p>Configure document details and choose the data sources to include.</p>
          </div>
        </div>

        <div className="wiz-layout">
          {/* LEFT COLUMN: Document Details */}
          <div className="wiz-panel">
            <div className="wiz-panel-header">
              <div className="wiz-panel-icon">
                <FileText size={20} />
              </div>
              <div>
                <h3>Document Details</h3>
                <p>Provide basic information about the document.</p>
              </div>
            </div>

            <div className="wiz-field">
              <label className="wiz-field-label">
                <FileText size={16} color="#8c8c8c" /> Document Name
              </label>
              <input 
                className="wiz-input" 
                type="text" 
                placeholder="e.g. May 2025 Status Report" 
                value={documentName} 
                onChange={e => setDocumentName(e.target.value)} 
              />
            </div>

            <div className="wiz-field">
              <label className="wiz-field-label">
                <Package size={16} color="#8c8c8c" /> Document Type
              </label>
              <select className="wiz-input" value={documentType} onChange={e => setDocumentType(e.target.value)}>
                <option>Project Status Report</option>
                <option>Weekly Report</option>
                <option>Monthly Report</option>
                <option>Production Release Report</option>
                <option>Client Update Report</option>
                <option>Custom Report</option>
              </select>
            </div>

            <div className="wiz-smart-banner">
              <div className="wiz-banner-icon"><CheckCircle size={20} /></div>
              <div className="wiz-banner-text">
                <h4>Smart Document Generation</h4>
                <p>System will compile and format data from selected sources into a professional document.</p>
              </div>
              <div style={{marginLeft: 'auto'}}>
                <FileText size={32} color="#e5e7eb" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Data Sources */}
          <div className="wiz-panel">
            <div className="wiz-panel-header">
              <div className="wiz-panel-icon">
                <Search size={20} />
              </div>
              <div>
                <h3>Select Data Sources</h3>
                <p>Choose the sources to include in your document.</p>
              </div>
            </div>

            <div className="wiz-cards-grid">
              {/* Requirements */}
              <div className={`wiz-card ${filters.requirements.selected ? 'selected' : ''}`} onClick={() => toggleFilter('requirements')}>
                <div className="wiz-card-icon req"><FileText size={24} /></div>
                <div className="wiz-card-content">
                  <h4>Requirements</h4>
                  <p>Include requirements and related change requests.</p>
                </div>
                <div className="wiz-checkbox-container">
                  <input className="wiz-checkbox" type="checkbox" checked={filters.requirements.selected} readOnly />
                </div>
              </div>

              {/* Minutes Of Meeting */}
              <div className={`wiz-card ${filters.mom.selected ? 'selected' : ''}`} onClick={() => toggleFilter('mom')}>
                <div className="wiz-card-icon mom"><Users size={24} /></div>
                <div className="wiz-card-content">
                  <h4>Minutes Of Meeting</h4>
                  <p>Include meeting minutes and action items.</p>
                </div>
                <div className="wiz-checkbox-container">
                  <input className="wiz-checkbox" type="checkbox" checked={filters.mom.selected} readOnly />
                </div>
              </div>

              {/* QA Issues */}
              <div className={`wiz-card ${filters.qaIssues.selected ? 'selected' : ''}`} onClick={() => toggleFilter('qaIssues')}>
                <div className="wiz-card-icon qa"><AlertTriangle size={24} /></div>
                <div className="wiz-card-content">
                  <h4>QA Issues</h4>
                  <p>Include QA reported issues and test results.</p>
                </div>
                <div className="wiz-checkbox-container">
                  <input className="wiz-checkbox" type="checkbox" checked={filters.qaIssues.selected} readOnly />
                </div>
              </div>

              {/* Production Issues */}
              <div className={`wiz-card ${filters.prodIssues.selected ? 'selected' : ''}`} onClick={() => toggleFilter('prodIssues')}>
                <div className="wiz-card-icon prod"><AlertTriangle size={24} /></div>
                <div className="wiz-card-content">
                  <h4>Production Issues</h4>
                  <p>Include production issues and resolution status.</p>
                </div>
                <div className="wiz-checkbox-container">
                  <input className="wiz-checkbox" type="checkbox" checked={filters.prodIssues.selected} readOnly />
                </div>
              </div>
            </div>

            <div className="wiz-date-range">
              <div className="wiz-date-left">
                <div className="wiz-date-icon"><Calendar size={20} /></div>
                <div className="wiz-date-text">
                  <h4>Date Range (Optional)</h4>
                  <p>Filter data for a specific date range</p>
                </div>
              </div>
              <div className="wiz-date-inputs">
                <Calendar size={14} color="#8c8c8c" />
                <input type="date" value={globalDateFrom} onChange={e => setGlobalDateFrom(e.target.value)} />
                <span style={{color: '#d1d5db'}}>-</span>
                <input type="date" value={globalDateTo} onChange={e => setGlobalDateTo(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="wiz-footer">
          <button className="wiz-btn-cancel" onClick={() => setView('list')}><X size={16} /> Cancel</button>
          <button className="wiz-btn-generate" onClick={handleGenerate}><FileText size={16} /> Generate Document</button>
        </div>
      </div>
    );
  }

  if (view === 'preview' && reportData) {
    const { requirements, mom, qaIssues, prodIssues, metadata } = reportData;
    const docFilters = metadata.filters || filters;
    
    // Stats calc
    const reqCompleted = requirements.filter(r => r.status === 'Completed' || r.status === 'Approved').length;
    const qaOpen = qaIssues.filter(q => q.status !== 'Resolved' && q.status !== 'Closed').length;
    const prodOpen = prodIssues.filter(p => p.status !== 'Resolved' && p.status !== 'Closed').length;

    return (
      <div className="doc-page">
        <div className="doc-preview-toolbar no-print">
          <button className="doc-btn-secondary" onClick={() => setView('list')}><X size={16} /> Close Preview</button>
          <div style={{display: 'flex', gap: '12px'}}>
            <button className="doc-btn-primary" onClick={() => { setDocumentToSend(metadata); setShowSendModal(true); }}><Send size={16} /> Send to WhatsApp</button>
            <button className="doc-btn-primary" onClick={exportToWord}><Download size={16} /> Download Word</button>
            <button className="doc-btn-primary" onClick={exportToPDF}><Download size={16} /> Download PDF</button>
          </div>
        </div>

        <div className="doc-preview-wrapper">
          <div id="document-preview-content" className="doc-printable-area">
            
            {/* COVER PAGE */}
            <div className="doc-cover-page">
              <img src={logoImg} alt="Logo" className="doc-cover-logo" />
              <h1 className="doc-cover-title">{metadata.documentName}</h1>
              <h2 className="doc-cover-subtitle">{metadata.documentType}</h2>
              <div className="doc-cover-details">
                <p><strong>Prepared By:</strong> {metadata.createdBy}</p>
              </div>
            </div>

            <div className="doc-page-break"></div>

            {/* EXECUTIVE SUMMARY */}
            <div className="doc-section">
              <h2 className="doc-section-title">Executive Summary</h2>
              <p className="doc-text">
                {generateSummaryText()}
              </p>
            </div>

            {/* REQUIREMENTS SECTION */}
            {docFilters.requirements?.selected && requirements.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">Requirements Status</h2>
                <div className="doc-stats-row">
                  <div className="doc-stat-box"><strong>Total:</strong> {requirements.length}</div>
                  <div className="doc-stat-box"><strong>Completed:</strong> {reqCompleted}</div>
                  <div className="doc-stat-box"><strong>Pending:</strong> {requirements.length - reqCompleted}</div>
                </div>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Req ID</th>
                      <th>Name</th>
                      <th>Module</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map(r => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.title}</td>
                        <td>{r.module}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MOM SECTION */}
            {docFilters.mom?.selected && mom.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">Meeting Discussions</h2>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Agenda</th>
                      <th>Attendees</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mom.map(m => (
                      <tr key={m.id}>
                        <td>{m.date}</td>
                        <td>{m.agendaTitle}</td>
                        <td>{m.attendees}</td>
                        <td>{m.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* QA ISSUES SECTION */}
            {docFilters.qaIssues?.selected && qaIssues.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">QA Defect Summary</h2>
                <div className="doc-stats-row">
                  <div className="doc-stat-box"><strong>Total:</strong> {qaIssues.length}</div>
                  <div className="doc-stat-box" style={{color: 'red'}}><strong>Open:</strong> {qaOpen}</div>
                  <div className="doc-stat-box" style={{color: 'green'}}><strong>Resolved:</strong> {qaIssues.length - qaOpen}</div>
                </div>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Issue ID</th>
                      <th>Module</th>
                      <th>Issue</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qaIssues.map(q => (
                      <tr key={q.id}>
                        <td>{q.issueId}</td>
                        <td>{q.module}</td>
                        <td>{q.issueTitle}</td>
                        <td>{q.severity}</td>
                        <td>{q.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PROD ISSUES SECTION */}
            {docFilters.prodIssues?.selected && prodIssues.length > 0 && (
              <div className="doc-section">
                <h2 className="doc-section-title">Production Issue Summary</h2>
                <div className="doc-stats-row">
                  <div className="doc-stat-box"><strong>Total:</strong> {prodIssues.length}</div>
                  <div className="doc-stat-box" style={{color: 'red'}}><strong>Open:</strong> {prodOpen}</div>
                  <div className="doc-stat-box" style={{color: 'green'}}><strong>Resolved:</strong> {prodIssues.length - prodOpen}</div>
                </div>
                <table className="doc-print-table">
                  <thead>
                    <tr>
                      <th>Issue ID</th>
                      <th>Module</th>
                      <th>Issue</th>
                      <th>Status</th>
                      <th>Raised Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prodIssues.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.pageName}</td>
                        <td>{p.issue}</td>
                        <td>{p.status}</td>
                        <td>{p.raisedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>

        {/* WhatsApp Send Modal */}
        {showSendModal && (
          <div className="qa-modal-overlay" onClick={() => setShowSendModal(false)}>
            <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
              <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px', marginBottom: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Send size={20} color="#16A34A" />
                  <h3 style={{margin: 0}}>Send via WhatsApp</h3>
                </div>
                <X size={20} className="qa-modal-close" onClick={() => setShowSendModal(false)} />
              </div>

              {waConfig?.status !== 'Connected' ? (
                <div style={{textAlign: 'center', padding: '24px 0'}}>
                  <AlertTriangle size={32} color="#16A34A" style={{marginBottom: '12px'}} />
                  <p style={{color: '#a0a3b1', marginBottom: 0}}>WhatsApp is not connected. Please connect it in settings.</p>
                </div>
              ) : (
                <>
                  <p style={{color: '#a0a3b1', fontSize: '13px', marginBottom: '20px'}}>
                    Send a summary of <strong>{documentToSend?.documentName}</strong> to a group or contact.
                  </p>
                  
                  <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Select Destination</label>
                  <select 
                    className="doc-field select" 
                    style={{width: '100%', background: '#1a1b23', border: '1px solid #3f424f', color: '#fff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px'}}
                    value={selectedChat} 
                    onChange={e => setSelectedChat(e.target.value)}
                  >
                    <option value="">Select a group or contact...</option>
                    {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  
                  <button 
                    className="doc-btn-primary" 
                    style={{width: '100%', justifyContent: 'center', opacity: isSending ? 0.7 : 1, cursor: isSending ? 'not-allowed' : 'pointer'}} 
                    onClick={handleSendToWhatsApp}
                    disabled={isSending}
                  >
                    <Send size={16} /> {isSending ? 'Generating PDF & Sending...' : 'Send Document Summary'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  return null;
};

export default DocumentGenerator;

