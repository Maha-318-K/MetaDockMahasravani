import React, { useState, useEffect } from 'react';
import { 
  Search, Upload, Plus, Filter, Calendar, 
  Eye, Edit2, MoreVertical, Bug, Clock, 
  CheckCircle, AlertTriangle, CheckSquare,
  MessageSquare, History, Trash2, Image as ImageIcon, Video as VideoIcon, X, Settings2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './QAIssuesManagement.css';
import { ProjectContext } from '../context/ProjectContext';

const QAIssuesManagement = () => {
  const navigate = useNavigate();
  const { activeProject } = React.useContext(ProjectContext);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // WhatsApp Integration
  const [waConfig, setWaConfig] = useState(null);
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [waChats, setWaChats] = useState([]);
  const [isChangingGroup, setIsChangingGroup] = useState(false);
  const [selectedGroupToSave, setSelectedGroupToSave] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [severityFilter, setSeverityFilter] = useState('All Severity');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [assigneeFilter, setAssigneeFilter] = useState('All Assignees');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Statuses State
  const [customStatuses, setCustomStatuses] = useState([]);

  // Modals & Interactivity
  const [activeModal, setActiveModal] = useState(null); // 'comments', 'history', 'attachment', 'newStatus', 'rejection'
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [fullScreenAttachment, setFullScreenAttachment] = useState(null);
  
  const [newStatusData, setNewStatusData] = useState({ label: '', color: '#3b82f6' });
  const [rejectionData, setRejectionData] = useState('');
  
  // Column Names
  const [colNames, setColNames] = useState({
    issueId: 'Issue ID',
    module: 'Module',
    pageName: 'Page Name',
    issueTitle: 'Issue Title',
    type: 'Type',
    severity: 'Severity',
    status: 'Status',
    assignedTo: 'Assigned To',
    raisedBy: 'Raised By',
    raisedDate: 'Raised Date',
    resolvedDate: 'Resolved Date',
    attachments: 'Attachments',
    actions: 'Actions'
  });

  useEffect(() => {
    fetchIssues();
    fetchUsers();
    fetchWaConfig();
    const waInterval = setInterval(fetchWaConfig, 10000);
    return () => clearInterval(waInterval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWaConfig = async () => {
    try {
      const res = await fetch('/api/v1/whatsapp/status');
      const data = await res.json();
      setWaConfig(data);
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
      setIsChangingGroup(false);
      fetchWaConfig();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/v1/qa-issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setModuleFilter('All Modules');
    setSeverityFilter('All Severity');
    setStatusFilter('All Status');
    setAssigneeFilter('All Assignees');
    setDateFilter('');
    setCurrentPage(1);
  };

  const updateIssue = async (id, updates) => {
    try {
      const res = await fetch(`/api/v1/qa-issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchIssues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteIssue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      const res = await fetch(`/api/v1/qa-issues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchIssues();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      text: commentText,
      by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), 
      date: new Date().toISOString()
    };
    updateIssue(selectedIssue.id, { newComment });
    
    setSelectedIssue({
      ...selectedIssue,
      comments: [...(selectedIssue.comments || []), newComment]
    });
    setCommentText('');
  };

  const handleStatusChange = (e, issue) => {
    const val = e.target.value;
    if (val === '+ Add New Status') {
      setActiveModal('newStatus');
      return;
    }
    if (val === 'Rejected') {
      setSelectedIssue(issue);
      setRejectionData('');
      setActiveModal('rejection');
      return;
    }
    updateIssue(issue.id, { 
      status: val, 
      historyEntry: { action: `Status changed from ${issue.status} to ${val}`, by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), date: new Date().toISOString() } 
    });
  };

  const submitRejection = () => {
    if (!rejectionData.trim()) {
      alert("A comment is compulsory for rejecting an issue.");
      return;
    }
    const newComment = {
      text: "REJECTED REASON: " + rejectionData,
      by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'),
      date: new Date().toISOString()
    };
    updateIssue(selectedIssue.id, { 
      status: 'Rejected', 
      newComment: newComment,
      historyEntry: { action: `Status changed from ${selectedIssue.status} to Rejected`, by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), date: new Date().toISOString() } 
    });
    setActiveModal(null);
  };

  const addNewStatus = () => {
    if (!newStatusData.label.trim()) return;
    setCustomStatuses([...customStatuses, { label: newStatusData.label.trim(), color: newStatusData.color }]);
    setActiveModal(null);
    setNewStatusData({ label: '', color: '#3b82f6' });
  };

  const filteredIssues = issues.filter(i => {
    if (activeProject !== 'All' && i.project !== activeProject && i.module !== activeProject) return false;
    if (moduleFilter !== 'All Modules' && i.module !== moduleFilter) return false;
    if (severityFilter !== 'All Severity' && i.severity !== severityFilter) return false;
    if (statusFilter !== 'All Status' && i.status !== statusFilter) return false;
    if (assigneeFilter !== 'All Assignees' && i.assignedTo !== assigneeFilter) return false;
    if (dateFilter && !i.raisedDate.includes(dateFilter)) return false; 
    if (search) {
      const q = search.toLowerCase();
      return (
        i.issueId.toLowerCase().includes(q) ||
        i.issueTitle.toLowerCase().includes(q) ||
        i.pageName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentData = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSeverityStyle = (sev) => {
    if (sev === 'Critical') return { color: '#ef4444' };
    if (sev === 'High') return { color: '#16A34A' };
    if (sev === 'Medium') return { color: '#eab308' };
    return { color: '#3b82f6' };
  };

  const parseDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStatusStyle = (status) => {
    if (status === 'Open') return { color: '#ef4444' };
    if (status === 'In Progress') return { color: '#16A34A' };
    if (status === 'Retesting') return { color: '#a855f7' };
    if (status === 'Blocked') return { color: '#eab308' };
    if (status === 'Resolved' || status === 'Closed') return { color: '#22c55e' };
    if (status === 'Future Implementation') return { color: '#3b82f6' };
    if (status === 'Rejected') return { color: '#ef4444' };
    const custom = customStatuses.find(c => c.label === status);
    if (custom) return { color: custom.color };
    return { color: '#fff' };
  };

  const addToRequirements = async (issue) => {
    try {
      const res = await fetch('/api/v1/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issue.issueTitle,
          description: `Imported from QA Issue: ${issue.issueId}. Page: ${issue.pageName}. Type: ${issue.type}.`,
          status: 'Draft',
          priority: issue.severity,
          category: 'Functional'
        })
      });
      if (res.ok) {
        alert('Successfully added to requirements!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add to requirements.');
    }
  };

  const handleEditCol = (key) => {
    const newName = window.prompt("Enter new column name:", colNames[key]);
    if (newName && newName.trim()) {
      setColNames({...colNames, [key]: newName.trim()});
    }
  };

  return (
    <div className="qa-page">
      <div className="qa-breadcrumbs">
        <span>QA Workspace</span> {'>'} <span className="current">Issues Management</span>
      </div>
      
      <div className="qa-tabs">
        <button className="qa-tab-btn active" onClick={() => navigate('/qa-issues')}>
          Issues
        </button>
        <button className="qa-tab-btn" onClick={() => navigate('/qa-automation')}>
          Automation Tracker
        </button>
      </div>

      <div className="qa-header-row" style={{marginBottom: '16px', display: 'flex', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', 
            padding: '4px 12px', borderRadius: '20px', 
            background: waConfig?.status === 'Connected' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: waConfig?.status === 'Connected' ? '#22c55e' : '#ef4444',
            fontSize: '13px', fontWeight: '500'
          }}>
            <div style={{width: '8px', height: '8px', borderRadius: '50%', background: waConfig?.status === 'Connected' ? '#22c55e' : '#ef4444'}}></div>
            {waConfig?.status === 'Connected' ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
          </div>
          <button className="qa-btn-secondary" onClick={() => { setShowWaSettings(true); fetchWaChats(); }}>
            <Settings2 size={16} /> WhatsApp Settings
          </button>
        </div>

        <div className="qa-actions" style={{marginLeft: 'auto'}}>
          <button className="qa-btn-primary" onClick={() => navigate('/qa-issues/create')}>
            <Plus size={16} /> Create Issue
          </button>
          <button className="qa-btn-secondary">
            <Upload size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="qa-metrics-grid">
        <div className="qa-metric-card" style={{cursor: 'pointer'}} onClick={() => { resetFilters(); }}>
          <div className="qa-metric-icon" style={{ background: 'rgba(248, 171, 55, 0.1)', color: '#16A34A' }}>
            <Bug size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Total Issues</h4>
            <h2>{issues.length}</h2>
          </div>
        </div>
        <div className="qa-metric-card" style={{cursor: 'pointer'}} onClick={() => { setStatusFilter('Open'); setSeverityFilter('All Severity'); setCurrentPage(1); }}>
          <div className="qa-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <Clock size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Open</h4>
            <h2>{issues.filter(i => i.status === 'Open').length}</h2>
          </div>
        </div>
        <div className="qa-metric-card" style={{cursor: 'pointer'}} onClick={() => { setStatusFilter('In Progress'); setSeverityFilter('All Severity'); setCurrentPage(1); }}>
          <div className="qa-metric-icon" style={{ background: 'rgba(248, 171, 55, 0.1)', color: '#16A34A' }}>
            <Clock size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>In Progress</h4>
            <h2>{issues.filter(i => i.status === 'In Progress').length}</h2>
          </div>
        </div>
        <div className="qa-metric-card" style={{cursor: 'pointer'}} onClick={() => { setStatusFilter('Resolved'); setSeverityFilter('All Severity'); setCurrentPage(1); }}>
          <div className="qa-metric-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <CheckCircle size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Resolved</h4>
            <h2>{issues.filter(i => i.status === 'Resolved').length}</h2>
          </div>
        </div>
        <div className="qa-metric-card" style={{cursor: 'pointer'}} onClick={() => { setStatusFilter('Rejected'); setSeverityFilter('All Severity'); setCurrentPage(1); }}>
          <div className="qa-metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Rejected</h4>
            <h2>{issues.filter(i => i.status === 'Rejected').length}</h2>
          </div>
        </div>
        <div className="qa-metric-card" style={{cursor: 'pointer'}} onClick={() => { setStatusFilter('Closed'); setSeverityFilter('All Severity'); setCurrentPage(1); }}>
          <div className="qa-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <CheckSquare size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Closed</h4>
            <h2>{issues.filter(i => i.status === 'Closed').length}</h2>
          </div>
        </div>
      </div>

      <div className="qa-toolbar">
        <div className="qa-search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search issue by ID, title, page..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select className="qa-filter-select" value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setCurrentPage(1); }}>
          <option>All Modules</option>
          <option>POS</option>
          <option>Payment</option>
          <option>Dashboard</option>
        </select>
        <select className="qa-filter-select" value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setCurrentPage(1); }}>
          <option>All Severity</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select className="qa-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
          <option>All Status</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Retesting</option>
          <option>Blocked</option>
          <option>Resolved</option>
          <option>Rejected</option>
          <option>Closed</option>
          <option>Future Implementation</option>
          {customStatuses.map(c => <option key={c.label}>{c.label}</option>)}
        </select>
        <select className="qa-filter-select" value={assigneeFilter} onChange={e => { setAssigneeFilter(e.target.value); setCurrentPage(1); }}>
          <option>All Assignees</option>
          {users.map(u => (
            <option key={u.id || u.name} value={u.name}>{u.name}</option>
          ))}
        </select>
        
        <div className="qa-date-btn" style={{position: 'relative'}}>
          <input 
            type="date" 
            style={{background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px'}} 
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button className="qa-reset-btn" onClick={resetFilters}>Reset</button>
      </div>

      <div className="qa-table-container" style={{overflowX: 'auto'}}>
        <table className="qa-table" style={{minWidth: '1300px'}}>
          <thead>
            <tr>
              <th><div className="editable-th">{colNames.issueId} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('issueId')}/></div></th>
              <th><div className="editable-th">{colNames.module} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('module')}/></div></th>
              <th><div className="editable-th">{colNames.pageName} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('pageName')}/></div></th>
              <th><div className="editable-th">{colNames.issueTitle} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('issueTitle')}/></div></th>
              <th><div className="editable-th">{colNames.type} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('type')}/></div></th>
              <th><div className="editable-th">{colNames.severity} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('severity')}/></div></th>
              <th><div className="editable-th">{colNames.status} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('status')}/></div></th>
              <th><div className="editable-th">{colNames.assignedTo} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('assignedTo')}/></div></th>
              <th><div className="editable-th">{colNames.raisedBy} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('raisedBy')}/></div></th>
              <th><div className="editable-th">{colNames.raisedDate} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('raisedDate')}/></div></th>
              <th><div className="editable-th">{colNames.resolvedDate} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('resolvedDate')}/></div></th>
              <th><div className="editable-th">{colNames.attachments} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('attachments')}/></div></th>
              <th><div className="editable-th">{colNames.actions} <Edit2 size={12} className="editable-th-icon" onClick={() => handleEditCol('actions')}/></div></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="13" style={{textAlign: 'center', padding: '30px'}}>Loading...</td></tr>
            ) : currentData.length === 0 ? (
              <tr><td colSpan="13" style={{textAlign: 'center', padding: '30px'}}>No issues found.</td></tr>
            ) : (
              currentData.map((issue) => (
                <tr key={issue.id}>
                  <td className="qa-issue-id">{issue.issueId}</td>
                  <td>{issue.module}</td>
                  <td>{issue.pageName}</td>
                  <td style={{ minWidth: '250px', resize: 'horizontal', overflow: 'auto' }}>
                    {issue.issueTitle}
                  </td>
                  <td style={{color: '#a0a3b1'}}>{issue.type}</td>
                  <td>
                    <select 
                      className="qa-inline-select" 
                      style={getSeverityStyle(issue.severity)}
                      value={issue.severity}
                      onChange={(e) => {
                         const val = e.target.value;
                         updateIssue(issue.id, {
                           severity: val,
                           historyEntry: { action: `Severity changed from ${issue.severity} to ${val}`, by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), date: new Date().toISOString() }
                         });
                      }}
                    >
                      <option>Critical</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      className="qa-inline-select"
                      style={getStatusStyle(issue.status)}
                      value={issue.status}
                      onChange={(e) => handleStatusChange(e, issue)}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Retesting</option>
                      <option>Blocked</option>
                      <option>Resolved</option>
                      <option>Rejected</option>
                      <option>Closed</option>
                      <option>Future Implementation</option>
                      {customStatuses.map(c => <option key={c.label}>{c.label}</option>)}
                      <option style={{color: '#fff'}}>+ Add New Status</option>
                    </select>
                    {issue.status === 'Future Implementation' && (
                      <button 
                        onClick={() => addToRequirements(issue)}
                        style={{display: 'block', marginTop: '4px', background: '#3b82f6', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer'}}
                      >
                        + Add to Req
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="qa-user-cell">
                      <img className="qa-avatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(issue.assignedTo || 'Unassigned')}&background=random`} alt="" />
                      <select 
                        className="qa-inline-select" 
                        value={issue.assignedTo}
                        onChange={(e) => {
                           const val = e.target.value;
                           updateIssue(issue.id, {
                             assignedTo: val,
                             historyEntry: { action: `Assigned to changed from ${issue.assignedTo || 'Unassigned'} to ${val || 'Unassigned'}`, by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), date: new Date().toISOString() }
                           });
                        }}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id || u.name} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div className="qa-user-cell">
                      <img className="qa-avatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(issue.raisedBy)}&background=random`} alt="" />
                      {issue.raisedBy}
                    </div>
                  </td>
                  <td style={{color: '#a0a3b1'}}>{issue.raisedDate}</td>
                  <td>
                    <input 
                      type="date" 
                      className="qa-inline-select"
                      max={new Date().toISOString().split('T')[0]}
                      style={{color: issue.resolvedDate ? 'var(--text-main)' : '#a0a3b1'}}
                      value={parseDateForInput(issue.resolvedDate)}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateIssue(issue.id, {
                           resolvedDate: val,
                           historyEntry: { action: `Resolved Date changed from ${issue.resolvedDate || 'None'} to ${val || 'None'}`, by: (JSON.parse(localStorage.getItem('user'))?.name || 'System'), date: new Date().toISOString() }
                        });
                      }}
                    />
                  </td>
                  <td>
                    {(issue.attachments || []).length > 0 ? (
                      <div>
                        {issue.attachments.map((att, idx) => (
                          <div key={idx} className="attachment-icon-wrapper" onClick={() => { setSelectedIssue(issue); setFullScreenAttachment(att); setActiveModal('attachment'); }}>
                            {att.type === 'video' ? <VideoIcon size={16} /> : <ImageIcon size={16} />}
                            <div className="attachment-hover-preview">
                              {att.type === 'video' ? (
                                <video src={att.url} muted autoPlay loop />
                              ) : (
                                <img src={att.url} alt="preview" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{color: '#a0a3b1'}}>{issue.attachmentsCount}</span>
                    )}
                  </td>
                  <td>
                    <div className="qa-actions-cell">
                      <div className="qa-action-icon" onClick={() => { setSelectedIssue(issue); setActiveModal('comments'); }} title="Comments">
                        <MessageSquare size={14} />
                      </div>
                      <div className="qa-action-icon" onClick={() => { setSelectedIssue(issue); setActiveModal('history'); }} title="History">
                        <History size={14} />
                      </div>
                      <div className="qa-action-icon" onClick={() => deleteIssue(issue.id)} title="Delete">
                        <Trash2 size={14} color="#ef4444" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div className="qa-footer">
          <div>Showing {(currentPage - 1) * itemsPerPage + (filteredIssues.length > 0 ? 1 : 0)} to {Math.min(currentPage * itemsPerPage, filteredIssues.length)} of {filteredIssues.length} records</div>
          <div className="qa-pagination">
            <span style={{marginRight: '12px'}}>Rows per page: <select className="qa-filter-select" style={{padding: '4px 24px 4px 8px', marginLeft: '4px'}}><option>10</option></select></span>
            <button className="qa-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
            {Array.from({length: totalPages}, (_, i) => (
              <button 
                key={i + 1} 
                className={`qa-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="qa-page-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>{'>'}</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'comments' && selectedIssue && (
        <div className="qa-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="qa-modal" onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h3>Comments - {selectedIssue.issueId}</h3>
              <X size={20} className="qa-modal-close" onClick={() => setActiveModal(null)} />
            </div>
            <div className="qa-comments-list">
              {(selectedIssue.comments || []).length === 0 ? (
                <div style={{color: '#a0a3b1', fontSize: '13px', textAlign: 'center', padding: '20px 0'}}>No comments yet. Be the first to comment!</div>
              ) : (
                (selectedIssue.comments || []).map((c, i) => (
                  <div key={i} className="qa-comment-item">
                    <div className="qa-comment-meta">
                      <span style={{fontWeight: 600, color: 'var(--text-main)'}}>{c.by}</span>
                      <span>{new Date(c.date).toLocaleString()}</span>
                    </div>
                    <div className="qa-comment-text">{c.text}</div>
                  </div>
                ))
              )}
            </div>
            <div className="qa-comment-input">
              <textarea 
                placeholder="Write a comment... (Testers, Developers, etc. can add notes here)" 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              ></textarea>
              <button className="qa-btn-primary" onClick={handleAddComment}>Add Comment</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'history' && selectedIssue && (
        <div className="qa-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="qa-modal" onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h3>Action History - {selectedIssue.issueId}</h3>
              <X size={20} className="qa-modal-close" onClick={() => setActiveModal(null)} />
            </div>
            <div className="qa-history-list">
              {(selectedIssue.history || []).map((h, i) => (
                <div key={i} className="qa-history-item">
                  <span style={{color: '#16A34A', marginRight: '8px'}}>[{new Date(h.date).toLocaleString()}]</span>
                  <span style={{fontWeight: 500, color: 'var(--text-main)', marginRight: '8px'}}>{h.by}</span>
                  <span style={{color: '#a0a3b1'}}>{h.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'attachment' && fullScreenAttachment && (
        <div className="qa-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="qa-modal" style={{width: 'auto', maxWidth: '90vw', padding: '12px'}} onClick={e => e.stopPropagation()}>
            <div style={{textAlign: 'right', marginBottom: '8px'}}>
              <X size={24} className="qa-modal-close" onClick={() => setActiveModal(null)} />
            </div>
            {fullScreenAttachment.type === 'video' ? (
              <video src={fullScreenAttachment.url} controls autoPlay style={{maxWidth: '100%', maxHeight: '80vh', borderRadius: '4px'}} />
            ) : (
              <img src={fullScreenAttachment.url} alt="Full screen attachment" style={{maxWidth: '100%', maxHeight: '80vh', borderRadius: '4px', display: 'block'}} />
            )}
          </div>
        </div>
      )}

      {activeModal === 'newStatus' && (
        <div className="qa-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="qa-modal" onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h3>Add Custom Status</h3>
              <X size={20} className="qa-modal-close" onClick={() => setActiveModal(null)} />
            </div>
            <div className="qa-comment-input">
              <label style={{display: 'block', marginBottom: '8px'}}>Status Name</label>
              <input 
                type="text" 
                style={{width: '100%', background: '#0b0c10', border: '1px solid #2a2c33', padding: '8px', color: '#fff', borderRadius: '6px', marginBottom: '16px'}}
                value={newStatusData.label}
                onChange={e => setNewStatusData({...newStatusData, label: e.target.value})}
              />
              
              <label style={{display: 'block', marginBottom: '8px'}}>Color</label>
              <input 
                type="color" 
                style={{width: '100%', height: '40px', background: '#0b0c10', border: '1px solid #2a2c33', padding: '4px', borderRadius: '6px', marginBottom: '24px'}}
                value={newStatusData.color}
                onChange={e => setNewStatusData({...newStatusData, color: e.target.value})}
              />

              <button className="qa-btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={addNewStatus}>Save Status</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'rejection' && selectedIssue && (
        <div className="qa-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="qa-modal" onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h3>Reject Issue - {selectedIssue.issueId}</h3>
              <X size={20} className="qa-modal-close" onClick={() => setActiveModal(null)} />
            </div>
            <div className="qa-comment-input">
              <p style={{fontSize: '13px', color: '#a0a3b1', marginBottom: '12px'}}>
                Please provide a mandatory reason for rejecting this issue.
              </p>
              <textarea 
                placeholder="Reason for rejection..." 
                value={rejectionData}
                onChange={e => setRejectionData(e.target.value)}
                style={{minHeight: '120px'}}
              ></textarea>
              <button className="qa-btn-primary" style={{background: '#ef4444', color: '#fff'}} onClick={submitRejection}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {showWaSettings && waConfig && (
        <div className="qa-modal-overlay" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }}>
          <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', margin: 0}}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{width: '20px'}}/> 
                Issue WhatsApp Configuration
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
                  <span style={{color: 'inherit', fontWeight: 500}}>Selected Issue Group</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {!isChangingGroup ? (
                      <>
                        <span style={{color: 'inherit', fontWeight: 500}}>
                          {waConfig.issueDefaultGroup ? waChats.find(c => c.id === waConfig.issueDefaultGroup)?.name || waConfig.issueDefaultGroup : 'Not Configured'}
                        </span>
                        {waConfig.status === 'Connected' && (
                          <button style={{background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={() => { setIsChangingGroup(true); fetchWaChats(); }}>Change</button>
                        )}
                      </>
                    ) : (
                      <div style={{display: 'flex', gap: '8px'}}>
                        <select className="qa-inline-select" style={{background: 'var(--bg-secondary, #fff)', color: 'inherit', border: '1px solid var(--border-color, #d1d5db)', width: '150px'}} value={selectedGroupToSave} onChange={e => setSelectedGroupToSave(e.target.value)}>
                          <option value="">Select Group...</option>
                          {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button style={{background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer'}} onClick={saveWaGroup}>Save</button>
                        <button style={{background: 'none', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '2px 4px', fontSize: '11px', cursor: 'pointer'}} onClick={() => setIsChangingGroup(false)}><X size={12}/></button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))'}}>
                  <span style={{color: 'inherit', fontWeight: 500}}>Last Message Sent</span>
                  <span style={{color: 'inherit', fontWeight: 500}}>{waConfig.lastMessageSent ? new Date(waConfig.lastMessageSent).toLocaleString() : 'Never'}</span>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'inherit', fontWeight: 500}}>Messages Sent</span>
                  <span style={{color: 'inherit', fontWeight: 500}}>{waConfig.messagesSentCount || 0}</span>
                </div>

              </div>
              
              <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                <button className="qa-btn-secondary" style={{flex: 1, justifyContent: 'center'}} onClick={() => { setShowWaSettings(false); navigate('/whatsapp'); }}>Reconnect WhatsApp</button>
                <button className="qa-btn-primary" style={{flex: 1, justifyContent: 'center'}} onClick={() => fetchWaChats()}>Refresh Groups</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QAIssuesManagement;

