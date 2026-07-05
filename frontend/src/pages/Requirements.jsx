import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Plus, 
  Filter, 
  Eye, 
  MoreVertical,
  Settings,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  CheckSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar
} from 'lucide-react';
import './Requirements.css';
import { ProjectContext } from '../context/ProjectContext';

const STATUS_CONFIG = {
  'Under Review': { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  'In Progress': { color: '#16A34A', bg: 'rgba(248,171,55,0.12)' },
  'Approved': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'Rejected': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'Completed': { color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const Requirements = () => {
  const navigate = useNavigate();
  const { activeProject } = React.useContext(ProjectContext);
  const [requirements, setRequirements] = useState([]);
  const [filteredReqs, setFilteredReqs] = useState([]);
  const [search, setSearch] = useState('');
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [triggerStatuses, setTriggerStatuses] = useState([]);
  const [availableStatuses] = useState(['Open', 'Pending', 'In Progress', 'Future Implementation', 'Closed', 'Under Review', 'Approved', 'Rejected', 'Completed']);
  const [users, setUsers] = useState([]);
  const [saveStatus, setSaveStatus] = useState('Last Updated');
  
  // PI Match State
  const [filterStatus, setFilterStatus] = useState(null);
  const [colWidths, setColWidths] = useState({ sno: 60, reqId: 120, title: 180, module: 50, desc: 400 });
  const [headers, setHeaders] = useState({
    sno: 'S.No', reqId: 'Req ID', title: 'Requirement Title', module: 'Module', desc: 'Description', 
    priority: 'Priority', status: 'Status', requestedBy: 'Requested By', 
    requestedDate: 'Requested Date', targetDate: 'Target Date', actions: 'Actions'
  });
  const [assigneeDropdown, setAssigneeDropdown] = useState(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [historyId, setHistoryId] = useState(null);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [assigneeDropdownTarget, setAssigneeDropdownTarget] = useState(null);
  
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchRequirements();
    fetchSettings();
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

  useEffect(() => {
    let result = requirements;
    if (activeProject !== 'All') {
      result = result.filter(r => r.module === activeProject || r.project === activeProject);
    }
    if (filterStatus && filterStatus !== 'Total Req.') {
      result = result.filter(r => r.status === filterStatus);
    }
    if (search) {
      result = result.filter(r => 
        (r.title || '').toLowerCase().includes(search.toLowerCase()) || 
        (r.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.module || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (priorityFilter) {
      result = result.filter(r => (r.priority || '').toLowerCase() === priorityFilter.toLowerCase());
    }
    setFilteredReqs(result);
  }, [search, requirements, filterStatus, activeProject, priorityFilter]);

  const fetchRequirements = async () => {
    try {
      const res = await fetch('/api/v1/requirements');
      const data = await res.json();
      if (data.success) {
        setRequirements(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/v1/settings');
      const data = await res.json();
      if (data.success && data.data.requirementTriggerStatuses) {
        setTriggerStatuses(data.data.requirementTriggerStatuses);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementTriggerStatuses: triggerStatuses })
      });
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateRequirement = async (id, field, value) => {
    setSaveStatus('Saving...');
    const issueToUpdate = requirements.find(r => r.id === id);
    if (!issueToUpdate) return;
    
    const entry = { field, oldValue: issueToUpdate[field] || '', newValue: value || '', timestamp: new Date().toISOString(), who: (JSON.parse(localStorage.getItem('user'))?.name || 'System') };
    const updatedReqs = requirements.map(r => r.id === id ? { ...r, [field]: value, history: [...(r.history || []), entry] } : r);
    setRequirements(updatedReqs);
    
    try {
      const reqToUpdate = updatedReqs.find(r => r.id === id);
      await fetch(`/api/v1/requirements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reqToUpdate, historyEntry: entry })
      });
      setSaveStatus('All changes saved');
      setTimeout(() => setSaveStatus('Last Updated'), 3000);
    } catch (error) {
      console.error('Failed to update requirement:', error);
      setSaveStatus('Save Failed');
    }
  };

  const handleAddAssigneeSubmit = async () => {
    if (!newAssigneeName.trim()) return;
    const cleanName = newAssigneeName.trim();
    
    const newUserObj = {
      name: cleanName,
      empId: `EMP-${Math.floor(Math.random() * 10000)}`,
      email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      password: 'Password123!',
      designation: 'Employee',
      role: 'User',
      status: 'Active'
    };

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserObj)
      });
      const data = await res.json();
      
      if (data.success) {
        setUsers(prev => [...prev, data.data]);
        if (assigneeDropdownTarget) {
          updateRequirement(assigneeDropdownTarget, 'requestedBy', data.data.name);
        }
        setIsAssigneeModalOpen(false);
        setNewAssigneeName('');
        setAssigneeDropdownTarget(null);
      }
    } catch (err) {
      console.error('Failed to add new user:', err);
    }
  };

  const openDatePicker = (e, selector) => {
    const input = e.currentTarget.querySelector(selector);
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const toggleTriggerStatus = (status) => {
    if (triggerStatuses.includes(status)) {
      setTriggerStatuses(triggerStatuses.filter(s => s !== status));
    } else {
      setTriggerStatuses([...triggerStatuses, status]);
    }
  };

  const getMetrics = () => {
    const total = filteredReqs.length;
    if (total === 0) return { total: 0, approved: { count: 0, percent: '0%' }, inProgress: { count: 0, percent: '0%' }, underReview: { count: 0, percent: '0%' }, rejected: { count: 0, percent: '0%' }, completed: { count: 0, percent: '0%' } };
    
    const count = (status) => filteredReqs.filter(r => r.status === status).length;
    const percent = (num) => ((num / total) * 100).toFixed(2) + '%';
    
    return {
      total,
      approved: { count: count('Approved'), percent: percent(count('Approved')) },
      inProgress: { count: count('In Progress'), percent: percent(count('In Progress')) },
      underReview: { count: count('Under Review'), percent: percent(count('Under Review')) },
      rejected: { count: count('Rejected'), percent: percent(count('Rejected')) },
      completed: { count: count('Completed'), percent: percent(count('Completed')) }
    };
  };

  const metrics = getMetrics();

  const getPriorityClass = (priority) => {
    switch(priority.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'in progress': return 'status-in-progress';
      case 'under review': return 'status-under-review';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const historyIssue = requirements.find(i => i.id === historyId);

  return (
    <div className="requirements-page pi-page" onClick={() => { setAssigneeDropdown(null); setShowFiltersMenu(false); }}>
      {/* â”€â”€ History Modal â”€â”€ */}
      {historyId && historyIssue && (
        <div className="pi-modal-overlay" onClick={() => setHistoryId(null)}>
          <div className="pi-modal" onClick={e => e.stopPropagation()}>
            <div className="pi-modal-header">
              <h3>Action History â€” {historyIssue.title || historyIssue.id}</h3>
              <button className="pi-modal-close" onClick={() => setHistoryId(null)}><X size={18} /></button>
            </div>
            <div className="pi-modal-body">
              {(!historyIssue.history || historyIssue.history.length === 0)
                ? <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No history recorded yet.</p>
                : historyIssue.history.slice().reverse().map((h, i) => (
                  <div key={i} className="pi-history-item">
                    <div className="pi-history-dot"><Clock size={12} /></div>
                    <div className="pi-history-detail">
                      <span className="pi-history-who">{h.who}</span>
                      <span className="pi-history-action">
                        Changed <strong>{h.field}</strong> from <code>{h.oldValue || 'empty'}</code> â†’ <code>{h.newValue || 'empty'}</code>
                      </span>
                      <span className="pi-history-time">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Add New Assignee Modal */}
      {isAssigneeModalOpen && (
        <div className="pi-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setIsAssigneeModalOpen(false)}>
          <div className="pi-modal" style={{ width: '400px', background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
            <div className="pi-modal-header" style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: '600' }}>Add New Name</h3>
              <button onClick={() => setIsAssigneeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="pi-modal-body" style={{ padding: '20px' }}>
              <input
                autoFocus
                type="text"
                placeholder="Enter user name..."
                value={newAssigneeName}
                onChange={(e) => setNewAssigneeName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddAssigneeSubmit();
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button onClick={() => setIsAssigneeModalOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-strong)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                <button onClick={handleAddAssigneeSubmit} style={{ padding: '8px 16px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Add Name</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="req-header">
        <div className="req-title-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>Requirements</h1>
            <div className="last-updated" style={{ fontSize: '13px', marginLeft: '16px' }}>
              <span className={saveStatus === 'Saving...' ? 'text-orange' : saveStatus === 'All changes saved' ? 'text-green' : 'text-gray'}>
                {saveStatus === 'Last Updated' 
                  ? `Last Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}`
                  : saveStatus}
              </span>
            </div>
          </div>
          <p>Track and manage all requirements for the production system.</p>
        </div>
        <div className="req-header-actions">
          <button className="settings-btn" onClick={() => setShowSettingsModal(true)}>
            <Settings size={18} />
          </button>
          <button className="qa-btn-secondary">
            <Download size={16} /> Export
          </button>
          <button className="qa-btn-primary" onClick={() => navigate('/requirements/create')}>
            <Plus size={16} /> Add Requirement
          </button>
        </div>
      </div>

      <div className="pi-metrics summary-cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
        {[
          { label: 'Total Req.', val: metrics.total, sub: 'All Time', icon: <FileText size={20} />, iconBg: 'rgba(22, 163, 74, 0.1)', iconColor: '#16A34A' },
          { label: 'Approved', val: metrics.approved.count || 0, sub: metrics.approved.percent || '0%', icon: <CheckCircle size={20} />, iconBg: 'rgba(34,197,94,0.12)', iconColor: '#22c55e' },
          { label: 'In Progress', val: metrics.inProgress.count || 0, sub: metrics.inProgress.percent || '0%', icon: <Clock size={20} />, iconBg: 'rgba(248,171,55,0.12)', iconColor: '#f59e0b' },
          { label: 'Under Review', val: metrics.underReview.count || 0, sub: metrics.underReview.percent || '0%', icon: <AlertCircle size={20} />, iconBg: 'rgba(168,85,247,0.12)', iconColor: '#a855f7' },
          { label: 'Rejected', val: metrics.rejected.count || 0, sub: metrics.rejected.percent || '0%', icon: <XCircle size={20} />, iconBg: 'rgba(239,68,68,0.12)', iconColor: '#ef4444' },
          { label: 'Completed', val: metrics.completed.count || 0, sub: metrics.completed.percent || '0%', icon: <CheckSquare size={20} />, iconBg: 'rgba(107,114,128,0.12)', iconColor: '#6b7280' },
        ].map(m => (
          <div key={m.label} className="metric-card" 
               style={{ border: filterStatus === m.label || (m.label === 'Total Req.' && !filterStatus) ? `1px solid ${m.iconColor}` : undefined, cursor: 'pointer' }}
               onClick={() => setFilterStatus(m.label === 'Total Req.' ? null : m.label)}>
            <div className="metric-icon" style={{ background: m.iconBg, color: m.iconColor }}>{m.icon}</div>
            <div className="metric-info">
              <h4>{m.label}</h4>
              <h2>{m.val}</h2>
              <span>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pi-toolbar-row" onClick={e => e.stopPropagation()} style={{ marginTop: '8px', marginBottom: '8px' }}>
        <div className="filter-search" style={{ maxWidth: 260 }}>
          <Search size={15} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search requirements..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div className="date-range">
          <span>01 May 2025 - 30 May 2025</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="filter-btn" onClick={(e) => { e.stopPropagation(); setShowFiltersMenu(!showFiltersMenu); }}>
            <Filter size={16} /> Filters
          </button>
          {showFiltersMenu && (
            <div className="pi-dropdown-menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 5px)', minWidth: '150px', zIndex: 50, background: '#ffffff', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', padding: '4px 12px', textTransform: 'uppercase' }}>Priority</div>
              {['All', 'High', 'Medium', 'Low'].map(p => {
                const isActive = priorityFilter === (p === 'All' ? '' : p);
                return (
                  <button 
                    key={p} 
                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isActive ? '#16A34A' : '#000000', fontSize: '0.85rem' }}
                    onClick={() => { setPriorityFilter(p === 'All' ? '' : p); setShowFiltersMenu(false); }}
                  >
                    {p} {isActive && <CheckCircle size={14} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pi-table-container">
        <table className="pi-table pi-table-editable">
          <thead>
            <tr>
              <th style={{ width: colWidths.sno, minWidth: colWidths.sno }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <input className="pi-header-input" title={headers.sno} value={headers.sno} onChange={e => setHeaders(p => ({ ...p, sno: e.target.value }))} style={{ textAlign: 'center' }} />
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, sno: Math.max(40, p.sno - 10) }))}><ChevronLeft size={11} /></button>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, sno: p.sno + 10 }))}><ChevronRight size={11} /></button>
                  </div>
                </div>
              </th>
              <th style={{ width: colWidths.reqId, minWidth: colWidths.reqId }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <input className="pi-header-input" title={headers.reqId} value={headers.reqId} onChange={e => setHeaders(p => ({ ...p, reqId: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, reqId: Math.max(60, p.reqId - 20) }))}><ChevronLeft size={11} /></button>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, reqId: p.reqId + 20 }))}><ChevronRight size={11} /></button>
                  </div>
                </div>
              </th>
              <th style={{ width: colWidths.title, minWidth: colWidths.title }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <input className="pi-header-input" title={headers.title} value={headers.title} onChange={e => setHeaders(p => ({ ...p, title: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, title: Math.max(100, p.title - 40) }))}><ChevronLeft size={11} /></button>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, title: p.title + 40 }))}><ChevronRight size={11} /></button>
                  </div>
                </div>
              </th>
              <th style={{ width: colWidths.module, minWidth: colWidths.module }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <input className="pi-header-input" title={headers.module} value={headers.module} onChange={e => setHeaders(p => ({ ...p, module: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, module: Math.max(80, p.module - 20) }))}><ChevronLeft size={11} /></button>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, module: p.module + 20 }))}><ChevronRight size={11} /></button>
                  </div>
                </div>
              </th>
              <th style={{ width: colWidths.desc, minWidth: colWidths.desc }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <input className="pi-header-input" title={headers.desc} value={headers.desc} onChange={e => setHeaders(p => ({ ...p, desc: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, desc: Math.max(150, p.desc - 40) }))}><ChevronLeft size={11} /></button>
                    <button className="pi-resize-btn" onClick={() => setColWidths(p => ({ ...p, desc: p.desc + 40 }))}><ChevronRight size={11} /></button>
                  </div>
                </div>
              </th>
              <th style={{ minWidth: 100 }}><input className="pi-header-input" title={headers.priority} value={headers.priority} onChange={e => setHeaders(p => ({ ...p, priority: e.target.value }))} /></th>
              <th style={{ minWidth: 120 }}><input className="pi-header-input" title={headers.status} value={headers.status} onChange={e => setHeaders(p => ({ ...p, status: e.target.value }))} /></th>
              <th style={{ minWidth: 160 }}><input className="pi-header-input" title={headers.requestedBy} value={headers.requestedBy} onChange={e => setHeaders(p => ({ ...p, requestedBy: e.target.value }))} /></th>
              <th style={{ minWidth: 160 }}><input className="pi-header-input" title={headers.requestedDate} value={headers.requestedDate} onChange={e => setHeaders(p => ({ ...p, requestedDate: e.target.value }))} /></th>
              <th style={{ minWidth: 140 }}><input className="pi-header-input" title={headers.targetDate} value={headers.targetDate} onChange={e => setHeaders(p => ({ ...p, targetDate: e.target.value }))} /></th>
              <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReqs.map((req, index) => {
              const sc = STATUS_CONFIG[req.status] || { color: '#a0a3b1', bg: 'rgba(160,163,177,0.1)' };
              return (
              <tr key={req.id}>
                <td style={{ width: colWidths.sno, minWidth: colWidths.sno, color: '#6b7280', fontWeight: 500, textAlign: 'center' }}>{index + 1}</td>
                <td style={{ width: colWidths.reqId, minWidth: colWidths.reqId, color: '#6b7280', fontWeight: 500 }}>{req.id}</td>
                <td style={{ width: colWidths.title, minWidth: colWidths.title }}>
                  <textarea
                    className="pi-inline-textarea pi-no-underline"
                    value={req.title || ''}
                    onChange={(e) => updateRequirement(req.id, 'title', e.target.value)}
                    placeholder="Requirement title..."
                    style={{ minHeight: '30px' }}
                  />
                </td>
                <td style={{ width: colWidths.module, minWidth: colWidths.module }}>
                  <input 
                    className="pi-inline-input pi-no-underline"
                    type="text"
                    value={req.module || ''}
                    onChange={(e) => updateRequirement(req.id, 'module', e.target.value)}
                    placeholder="Module..."
                  />
                </td>
                <td style={{ width: colWidths.desc, minWidth: colWidths.desc }}>
                  <textarea 
                    className="pi-inline-textarea pi-no-underline"
                    value={req.description || ''}
                    onChange={(e) => updateRequirement(req.id, 'description', e.target.value)}
                    placeholder="Description..."
                    style={{ minHeight: '30px' }}
                  />
                </td>
                <td>
                  <select 
                    className="pi-status-select"
                    value={req.priority || 'Medium'} 
                    onChange={(e) => updateRequirement(req.id, 'priority', e.target.value)}
                    style={{ color: '#fff' }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </td>
                <td>
                  <div className="pi-status-wrapper" style={{ background: sc.bg, borderColor: sc.color + '55', boxShadow: `0 0 6px ${sc.color}22` }}>
                    <select 
                      className="pi-status-select"
                      value={req.status || 'Under Review'} 
                      onChange={(e) => updateRequirement(req.id, 'status', e.target.value)}
                      style={{ color: sc.color }}
                    >
                      {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ color: sc.color, flexShrink: 0, pointerEvents: 'none', marginRight: 4 }} />
                  </div>
                </td>
                <td>
                  <div className="pi-assignee-cell" style={{ position: 'relative' }}>
                    {(() => {
                      const reqUser = users.find(u => u.name === req.requestedBy);
                      return reqUser ? (
                        <img src={reqUser.avatar ? reqUser.avatar.replace(/7A2434|3b1820|5D1825|8B4513/gi, '16A34A') : ''} alt={req.requestedBy} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Search size={12} color="#fff" /></div>
                      );
                    })()}
                    <div 
                      className="pi-inline-select pi-no-underline" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onClick={(e) => { e.stopPropagation(); setAssigneeDropdown(assigneeDropdown === req.id ? null : req.id); setAssigneeSearch(''); }}
                    >
                      <span style={{ color: req.requestedBy ? '#000000' : '#6b7280' }}>
                        {req.requestedBy || 'Select...'}
                      </span>
                      <ChevronDown size={12} style={{ color: '#6b7280' }} />
                    </div>

                    {assigneeDropdown === req.id && (
                      <div className="pi-assignee-menu" onClick={e => e.stopPropagation()}>
                        <div className="pi-assignee-search">
                          <Search size={12} color="#a0a3b1" />
                          <input 
                            autoFocus
                            placeholder="Search user..." 
                            value={assigneeSearch}
                            onChange={e => setAssigneeSearch(e.target.value)}
                          />
                        </div>
                        <div className="pi-assignee-list">
                          {users.filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase())).map(u => (
                            <div key={u.id || u.name} className="pi-assignee-opt" onClick={() => { updateRequirement(req.id, 'requestedBy', u.name); setAssigneeDropdown(null); }}>
                              <img src={u.avatar ? u.avatar.replace(/7A2434|3b1820|5D1825|8B4513/gi, '16A34A') : ''} alt={u.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                              {u.name}
                            </div>
                          ))}
                          <div className="pi-assignee-add-opt" onClick={() => { setAssigneeDropdownTarget(req.id); setIsAssigneeModalOpen(true); setAssigneeDropdown(null); }}>
                            <Plus size={14} /> Add New Name
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="pi-date-cell" onClick={(e) => openDatePicker(e, 'input[type="datetime-local"]') }>
                    <Calendar size={13} style={{ position: 'absolute', left: 0, top: 4, color: '#a0a3b1' }} />
                    <div className="pi-date-display" style={{ paddingLeft: 20 }}>{req.requestedDate}</div>
                    <input
                      type="datetime-local"
                      className="pi-inline-date"
                      onChange={e => {
                        if (!e.target.value) return;
                        const d = new Date(e.target.value);
                        updateRequirement(req.id, 'requestedDate', d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div className="pi-date-cell" onClick={(e) => openDatePicker(e, 'input[type="date"]') }>
                    <Calendar size={13} style={{ position: 'absolute', left: 0, top: 4, color: '#a0a3b1' }} />
                    <div className="pi-date-display" style={{ paddingLeft: 20 }}>{req.targetDate && req.targetDate !== '-' ? req.targetDate : 'Pick date'}</div>
                    <input
                      type="date"
                      className="pi-inline-date"
                      onChange={e => {
                        if (!e.target.value) return;
                        updateRequirement(req.id, 'targetDate', new Date(e.target.value).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }));
                      }}
                    />
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className="pi-row-actions">
                    <button className="pi-row-btn" title="View History" onClick={() => setHistoryId(req.id)}>
                      <Clock size={15} />
                    </button>
                    <button className="pi-row-btn" title="More"><MoreVertical size={15} /></button>
                  </div>
                </td>
              </tr>
            )})}
            {filteredReqs.length === 0 && (
              <tr>
                <td colSpan="10" className="no-data">No requirements found.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="table-footer">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select><option>10</option></select>
            <span>Showing 1 to {Math.min(10, filteredReqs.length)} of {filteredReqs.length} entries</span>
          </div>
          <div className="qa-pagination">
            <button className="qa-page-btn">{'<'}</button>
            <button className="page-btn active">1</button>
            <button className="qa-page-btn">{'>'}</button>
          </div>
        </div>
      </div>

      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content settings-modal">
            <div className="modal-header">
              <h2>Requirement Automation Settings</h2>
              <button className="close-btn" onClick={() => setShowSettingsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="settings-desc">
                Select the statuses that should automatically create a Requirement from Production Issues or MoM Tracker points.
              </p>
              <div className="status-triggers-list">
                {availableStatuses.map(status => (
                  <label key={status} className="trigger-checkbox">
                    <input 
                      type="checkbox" 
                      checked={triggerStatuses.includes(status)}
                      onChange={() => toggleTriggerStatus(status)}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowSettingsModal(false)}>Cancel</button>
              <button className="btn-save" onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requirements;

