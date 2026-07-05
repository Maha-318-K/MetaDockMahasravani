import React, { useState, useEffect } from 'react';
import { Download, Send, CheckCircle, FileText, AlertTriangle, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import logoImg from '../assets/logo.png';
import './QAReports.css';

const QAReports = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [reportType, setReportType] = useState('Project'); // Daily, Weekly, Monthly, Project
  const [severityFilter, setSeverityFilter] = useState('All'); // All, Critical, Open
  const [testerName, setTesterName] = useState('');
  const [uniqueTesters, setUniqueTesters] = useState([]);
  
  // WhatsApp Modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [waChats, setWaChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchIssues();
    fetchWaChats();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/v1/qa-issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
        
        // Extract unique testers
        const testers = new Set();
        data.data.forEach(i => {
          if (i.assignedTo) testers.add(i.assignedTo);
          if (i.raisedBy) testers.add(i.raisedBy);
        });
        setUniqueTesters(Array.from(testers));
        
        // Auto-select first tester if none selected
        if (!testerName && testers.size > 0) {
          setTesterName(Array.from(testers)[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch issues", err);
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

  // Helper to filter issues based on report type and tester
  const getFilteredIssues = () => {
    let filtered = issues.filter(i => 
      !testerName || i.assignedTo === testerName || i.raisedBy === testerName
    );

    const now = new Date();
    filtered = filtered.filter(i => {
      if (!i.raisedDate) return false;
      const raised = new Date(i.raisedDate);
      if (isNaN(raised)) return false;

      const diffTime = Math.abs(now - raised);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (reportType === 'Daily') return diffDays <= 1;
      if (reportType === 'Weekly') return diffDays <= 7;
      if (reportType === 'Monthly') return diffDays <= 30;
      return true; // Project (All time)
    });

    if (severityFilter === 'Critical') {
      filtered = filtered.filter(i => i.severity === 'Critical');
    } else if (severityFilter === 'Open') {
      filtered = filtered.filter(i => i.status !== 'Resolved' && i.status !== 'Closed');
    }

    return filtered;
  };

  const filteredIssues = getFilteredIssues();

  // Automatically select all filtered issues whenever filters change
  useEffect(() => {
    setSelectedIds(filteredIssues.map(i => i.id));
  }, [testerName, reportType, severityFilter, issues]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredIssues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIssues.map(i => i.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedIssuesData = issues.filter(i => selectedIds.includes(i.id));

  // PDF Generation
  const generatePDF = async () => {
    const el = document.getElementById('qa-report-content');
    if (!el) return null;

    const opt = {
      margin: 0.5,
      filename: `QA_${reportType}_Report_${testerName || 'All'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    return await html2pdf().set(opt).from(el).output('blob');
  };

  const handleDownload = async () => {
    if (selectedIds.length === 0) return alert("Please select at least one issue.");
    const el = document.getElementById('qa-report-content');
    const opt = {
      margin: 0.5,
      filename: `QA_${reportType}_Report_${testerName || 'All'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
  };

  const handleSendWhatsApp = async () => {
    if (!selectedChat) return alert("Please select a chat.");
    if (selectedIds.length === 0) return alert("Please select at least one issue.");
    
    setIsSending(true);
    try {
      const pdfBlob = await generatePDF();
      if (!pdfBlob) throw new Error("Could not generate PDF");

      const uploadForm = new FormData();
      uploadForm.append('files', pdfBlob, `QA_${reportType}_Report_${testerName}.pdf`);
      
      const uploadRes = await fetch('/api/v1/upload', {
        method: 'POST',
        body: uploadForm
      });
      const uploadData = await uploadRes.json();
      
      let attachmentUrl = null;
      if (uploadData.success && uploadData.urls.length > 0) {
        attachmentUrl = uploadData.urls[0];
      }

      const payload = {
        chatId: selectedChat,
        documentName: `${reportType} QA Report - ${testerName}`,
        documentType: 'QA Report',
        generatedDate: new Date().toLocaleDateString(),
        attachmentUrl: attachmentUrl,
        user: (JSON.parse(localStorage.getItem('user'))?.name || 'System')
      };

      await fetch('/api/v1/whatsapp/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      alert("Report sent successfully!");
      setShowWaModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send report.");
    } finally {
      setIsSending(false);
    }
  };

  // Report Metrics
  const criticalCount = selectedIssuesData.filter(i => i.severity === 'Critical').length;
  const highCount = selectedIssuesData.filter(i => i.severity === 'High').length;
  const openCount = selectedIssuesData.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length;
  const resolvedCount = selectedIssuesData.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;

  // Analytics for AI Summary
  const moduleCounts = {};
  selectedIssuesData.forEach(i => {
    moduleCounts[i.module] = (moduleCounts[i.module] || 0) + 1;
  });
  const topModule = Object.keys(moduleCounts).sort((a, b) => moduleCounts[b] - moduleCounts[a])[0];
  const healthScore = selectedIds.length === 0 ? 100 : Math.max(0, 100 - (criticalCount * 10) - (highCount * 5) - (openCount * 2));

  return (
    <div className="qa-rep-page">
      <div className="qa-rep-header">
        <div>
          <h2>QA Tester Reports</h2>
          <p>Generate daily, weekly, or monthly reports of your testing progress to share with management.</p>
        </div>
      </div>

      <div className="qa-rep-filters" style={{marginBottom: '16px'}}>
        <select className="qa-rep-select" value={testerName} onChange={e => setTesterName(e.target.value)}>
          <option value="">Select Tester...</option>
          {uniqueTesters.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        {['Daily', 'Weekly', 'Monthly', 'Project'].map(t => (
          <button 
            key={t}
            className={`qa-rep-filter-btn ${reportType === t ? 'active' : ''}`}
            onClick={() => setReportType(t)}
          >
            {t} Report
          </button>
        ))}
      </div>
      <div className="qa-rep-filters" style={{marginBottom: '24px', gap: '8px'}}>
        <span style={{color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', marginRight: '8px'}}>Quick Filters:</span>
        {['All', 'Critical', 'Open'].map(f => (
          <button 
            key={f}
            className={`qa-rep-filter-btn ${severityFilter === f ? 'active' : ''}`}
            style={{padding: '4px 12px', fontSize: '12px'}}
            onClick={() => setSeverityFilter(f)}
          >
            {f === 'All' ? 'All Issues' : f === 'Critical' ? 'Critical Only' : 'Unresolved Only'}
          </button>
        ))}
      </div>

      <div className="qa-rep-content">
        {/* Left: Issues Selection */}
        <div className="qa-rep-list-panel">
          <div className="qa-rep-list-header">
            <h3>Select Issues ({filteredIssues.length} found)</h3>
            <button className="qa-rep-filter-btn" onClick={handleSelectAll}>
              {selectedIds.length === filteredIssues.length && filteredIssues.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="qa-rep-list-body">
            {filteredIssues.length === 0 ? (
              <div className="qa-rep-empty">No issues found for the selected filters.</div>
            ) : (
              filteredIssues.map(iss => (
                <div key={iss.id} className={`qa-rep-issue-item ${selectedIds.includes(iss.id) ? 'selected' : ''}`} onClick={() => toggleSelect(iss.id)}>
                  <input type="checkbox" className="qa-rep-checkbox" checked={selectedIds.includes(iss.id)} onChange={() => {}} />
                  <div className="qa-rep-issue-details">
                    <div className="qa-rep-issue-title">{iss.issueId}: {iss.issueTitle}</div>
                    <div className="qa-rep-issue-meta">
                      <span>Status: <strong style={{color: iss.status === 'Resolved' ? '#22c55e' : '#16A34A'}}>{iss.status}</strong></span>
                      <span>Severity: {iss.severity}</span>
                      <span>Module: {iss.module}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Report Preview */}
        <div className="qa-rep-preview-panel">
          <div className="qa-rep-preview-header">
            <h3 style={{color: '#fff', margin: 0, fontWeight: 500}}>Report Preview</h3>
            <div className="qa-rep-preview-actions">
              <button className="qa-rep-btn-primary" onClick={handleDownload} disabled={selectedIds.length === 0}>
                <Download size={14} /> Download PDF
              </button>
              <button className="qa-rep-btn-primary" onClick={() => setShowWaModal(true)} disabled={selectedIds.length === 0}>
                <Send size={14} /> Send to WhatsApp
              </button>
            </div>
          </div>
          
          <div className="qa-rep-preview-body">
            {selectedIds.length === 0 ? (
              <div className="qa-rep-empty">
                <FileText size={48} color="#2a2c33" style={{marginBottom: 16}} />
                Select issues from the list to generate a report preview.
              </div>
            ) : (
              <div id="qa-report-content" className="qa-rep-document">
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}>
                  {logoImg && <img src={logoImg} alt="Logo" style={{height: 40}} />}
                </div>
                <div className="qa-rep-doc-title">QA {reportType} Report</div>
                <div className="qa-rep-doc-meta">
                  Prepared By: <strong>{testerName || 'All Testers'}</strong> | Date: {new Date().toLocaleDateString('en-GB')}
                </div>

                <div className="qa-rep-doc-section">
                  <div className="qa-rep-doc-section-title">Executive Dashboard</div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px'}}>
                    <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', textAlign: 'center'}}>
                      <div style={{fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase'}}>Total Issues</div>
                      <div style={{fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '4px 0'}}>{selectedIds.length}</div>
                    </div>
                    <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', textAlign: 'center'}}>
                      <div style={{fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase'}}>Resolved</div>
                      <div style={{fontSize: '24px', fontWeight: 700, color: '#15803d', margin: '4px 0'}}>{resolvedCount}</div>
                    </div>
                    <div style={{background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', textAlign: 'center'}}>
                      <div style={{fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase'}}>Critical</div>
                      <div style={{fontSize: '24px', fontWeight: 700, color: '#dc2626', margin: '4px 0'}}>{criticalCount}</div>
                    </div>
                    <div style={{background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px', borderRadius: '8px', textAlign: 'center'}}>
                      <div style={{fontSize: '11px', color: '#9a3412', fontWeight: 600, textTransform: 'uppercase'}}>Open</div>
                      <div style={{fontSize: '24px', fontWeight: 700, color: '#ea580c', margin: '4px 0'}}>{openCount}</div>
                    </div>
                  </div>

                  <div style={{background: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '16px', borderRadius: '0 8px 8px 0'}}>
                    <div style={{fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <AlertTriangle size={16} color="#3b82f6"/> AI Executive Insights
                    </div>
                    <p style={{fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0}}>
                      The overall testing health score for this segment is <strong>{healthScore}/100</strong>. 
                      {healthScore < 70 ? ' Immediate attention is required.' : ' The product is maintaining acceptable stability.'} 
                      {topModule && ` The highest concentration of issues is currently in the "${topModule}" module.`}
                      {criticalCount > 0 ? ` There are ${criticalCount} critical roadblocks preventing release.` : ' There are zero critical roadblocks.'}
                    </p>
                  </div>
                </div>

                <div className="qa-rep-doc-section">
                  <div className="qa-rep-doc-section-title">Detailed Issue List</div>
                  <table className="qa-rep-doc-table">
                    <thead>
                      <tr>
                        <th style={{width: '15%'}}>Issue ID</th>
                        <th style={{width: '15%'}}>Module</th>
                        <th style={{width: '40%'}}>Issue Description</th>
                        <th style={{width: '15%'}}>Severity</th>
                        <th style={{width: '15%'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIssuesData.map(iss => (
                        <tr key={iss.id}>
                          <td>{iss.issueId}</td>
                          <td>{iss.module}</td>
                          <td>{iss.issueTitle}</td>
                          <td style={{color: iss.severity === 'Critical' ? '#dc2626' : iss.severity === 'High' ? '#ea580c' : '#374151', fontWeight: 500}}>
                            {iss.severity}
                          </td>
                          <td style={{color: (iss.status === 'Resolved' || iss.status === 'Closed') ? '#16a34a' : '#d97706', fontWeight: 500}}>
                            {iss.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{marginTop: 40, fontSize: 12, color: '#9ca3af', textAlign: 'center'}}>
                  Generated via meta dock QA Workspace
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWaModal && (
        <div className="qa-modal-overlay" onClick={() => !isSending && setShowWaModal(false)}>
          <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header" style={{borderBottom: '1px solid #2a2c33', paddingBottom: '16px', marginBottom: '16px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Send size={20} color="#16A34A" />
                <h3 style={{margin: 0}}>Send Report to Manager/CEO</h3>
              </div>
              <X size={20} className="qa-modal-close" onClick={() => !isSending && setShowWaModal(false)} />
            </div>

            <p style={{color: '#a0a3b1', fontSize: '13px', marginBottom: '20px'}}>
              This will generate the PDF report and send it to the selected WhatsApp contact or group.
            </p>
            
            <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Select Destination</label>
            <select 
              className="qa-rep-select" 
              style={{width: '100%', marginBottom: '24px'}}
              value={selectedChat} 
              onChange={e => setSelectedChat(e.target.value)}
            >
              <option value="">Select a manager or group...</option>
              {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <button className="qa-rep-btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={handleSendWhatsApp} disabled={isSending}>
              {isSending ? 'Generating & Sending...' : 'Send WhatsApp Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAReports;

