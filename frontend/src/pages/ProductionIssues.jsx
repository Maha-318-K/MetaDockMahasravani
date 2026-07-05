import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, Plus, MessageCircle, Bug,
  Clock, Activity, AlertCircle, CheckCircle2,
  Eye, MoreVertical, Paperclip, Calendar,
  Edit2, Trash2, Download, Upload, X, RefreshCw,
  ChevronLeft, ChevronRight, Image as ImageIcon, Film,
  FileSpreadsheet, FileText, File, Settings2, Grid, TriangleAlert, HeartPulse, Hourglass, TrendingDown, TrendingUp, Minus
} from 'lucide-react';
import './ProductionIssues.css';
import { ProjectContext } from '../context/ProjectContext';



const STATUS_CONFIG = {
  'Open': { color: '#ef4444', bg: 'rgba(245, 242, 242, 0.12)' },
  'In Progress': { color: '#16A34A', bg: 'rgba(248,171,55,0.12)' },
  'Pending': { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  'Future Implementation': { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  'Closed': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

const ProductionIssues = () => {
  const navigate = useNavigate();
  const { activeProject } = React.useContext(ProjectContext);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyId, setHistoryId] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [waConfig, setWaConfig] = useState(null);
  const [waChats, setWaChats] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [isChangingGroup, setIsChangingGroup] = useState(false);
  const [selectedGroupToSave, setSelectedGroupToSave] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [hoveredAttachments, setHoveredAttachments] = useState(null);
  const [viewingAttachments, setViewingAttachments] = useState(null);
  const [customColumns, setCustomColumns] = useState([]);
  const [colWidths, setColWidths] = useState({
    sno: 70, pageName: 160, issue: 260, status: 150, assignee: 180, deployDate: 150, raised: 180, attachments: 80, actions: 100
  });
  const [usersList, setUsersList] = useState([]);
  const [avatarsDict, setAvatarsDict] = useState({});
  const [assigneeDropdown, setAssigneeDropdown] = useState(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [headers, setHeaders] = useState({
    sno: 'S.No',
    pageName: 'Page Name',
    issue: 'Issue',
    status: 'Status',
    assignee: 'Assigned To',
    deployDate: 'Deploy Date',
    raised: 'Issue Raised'
  });
  const fileInputRef = useRef(null);

  // â”€â”€ Fetch Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    fetchIssues();
    fetchUsers();
    fetchWaConfig();

    // Automatic Background Sync every 10 seconds
    const intervalId = setInterval(() => {
      fetchIssues(false, true); // Pass a flag to indicate it's a background sync
    }, 10000);
    const waInterval = setInterval(fetchWaConfig, 10000);

    return () => {
      clearInterval(intervalId);
      clearInterval(waInterval);
    };
  }, []);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        const names = data.data.map(u => u.name);
        setUsersList(names);
        const avatarMap = {};
        data.data.forEach(u => { avatarMap[u.name] = u.avatar ? u.avatar.replace(/7A2434|3b1820|5D1825|8B4513/gi, '16A34A') : ''; });
        setAvatarsDict(avatarMap);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchIssues = async (isSync = false, isBackground = false) => {
    if (isSync) setSyncing(true);
    try {
      const res = await fetch('/api/v1/issues');
      const data = await res.json();
      if (data.success) {
        setIssues(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      if (!isBackground) setLoading(false);
      if (isSync) setTimeout(() => setSyncing(false), 500); // Visual feedback
    }
  };

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveWaGroup = async () => {
    if (!selectedGroupToSave) return;
    try {
      const res = await fetch('/api/v1/whatsapp/issue-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroupToSave })
      });
      if (res.ok) {
        setIsChangingGroup(false);
        fetchWaConfig();
        alert('Default group updated!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update group');
    }
  };

  const updateIssue = async (id, field, value) => {
    const issueToUpdate = issues.find(i => i.id === id);
    if (!issueToUpdate) return;

    // Auto-move feature for "Future Implementation"
    if (field === 'status' && value === 'Future Implementation') {
      if (window.confirm('Move this issue to Requirements? This will remove it from Production Issues and create a new Requirement.')) {
        const payload = {
          title: issueToUpdate.pageName ? `${issueToUpdate.pageName} - ${issueToUpdate.issue}` : issueToUpdate.issue,
          module: issueToUpdate.pageName || 'General',
          description: `Imported from Production Issues.\n\nOriginal issue: ${issueToUpdate.issue}`,
          priority: 'Medium',
          status: 'Open',
          requestedBy: 'System',
          requestedDate: new Date().toLocaleString('en-GB'),
          targetDate: '-',
          source: 'Production Issues',
          notes: `Migrated from Production Issues (ID: ${issueToUpdate.id})`
        };
        try {
          await fetch('http://localhost:5000/api/v1/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          setIssues(prev => prev.filter(i => i.id !== id));
          await fetch(`/api/v1/issues/${id}`, { method: 'DELETE' });
          return;
        } catch (err) {
          console.error('Failed to move to requirements', err);
          alert('Failed to move item to requirements');
        }
      }
    }

    // Optimistic update
    const entry = { field, oldValue: issueToUpdate[field] || '', newValue: value || '', timestamp: new Date().toISOString(), who: (JSON.parse(localStorage.getItem('user'))?.name || 'System') };
    setIssues(prev => prev.map(iss => iss.id === id ? { ...iss, [field]: value, history: [...(iss.history || []), entry] } : iss));

    try {
      await fetch(`/api/v1/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value, historyEntry: entry })
      });
    } catch (err) {
      console.error('Failed to update issue', err);
    }
  };

  const shareToWhatsApp = async (issue) => {
    try {
      const payload = {
        pageName: issue.pageName || 'Unknown Page',
        issueDetails: issue.issue || 'No details provided.',
        attachments: issue.attachments || []
      };
      const res = await fetch('/api/v1/whatsapp/send-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Issue shared to WhatsApp successfully!');
      } else {
        alert(data.error || 'Failed to share to WhatsApp');
      }
    } catch (err) {
      console.error('Failed to share to WhatsApp', err);
      alert('Error sharing to WhatsApp');
    }
    setActiveMenu(null);
  };

  const deleteIssue = async (id) => {
    if (!window.confirm('Delete this issue?')) return;
    setIssues(prev => prev.filter(i => i.id !== id));
    setActiveMenu(null);
    try {
      await fetch(`/api/v1/issues/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete issue', err);
    }
  };

  const addRow = async () => {
    const newIssue = { pageName: '', issue: '', status: 'Open', assignee: '', deployDate: '-', deployVer: '', raisedSrc: '', attachments: [] };
    try {
      const res = await fetch('/api/v1/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });
      const data = await res.json();
      if (data.success) {
        setIssues(prev => [data.data, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create issue', err);
    }
  };

  const handleAddColumn = () => {
    const colName = window.prompt("Enter new column name:");
    if (colName) {
      setCustomColumns([...customColumns, colName]);
      setHeaders(prev => ({ ...prev, [colName]: colName }));
    }
  };


  const handleAddUser = (name, issueId) => {
    if (!name || usersList.includes(name)) return;
    setUsersList(prev => [...prev, name]);
    updateIssue(issueId, 'assignee', name);
    setAssigneeDropdown(null);
    setAssigneeSearch('');
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

  const getAttachmentSrc = (attachment) => {
    if (attachment?.url) return `http://localhost:5000${attachment.url}`;
    return attachment?.previewUrl || attachment?.src || attachment?.dataUrl || '';
  };

  // â”€â”€ Metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const total = issues.length;
  const openCount = issues.filter(i => i.status === 'Open').length;
  const inProg = issues.filter(i => i.status === 'In Progress').length;
  const pending = issues.filter(i => i.status === 'Pending').length;
  const closed = issues.filter(i => i.status === 'Closed').length;

  // â”€â”€ Filter + Paginate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = issues.filter(i => {
    if (activeProject !== 'All' && i.project !== activeProject) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    return (i.pageName + i.issue + i.assignee).toLowerCase().includes(search.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const startIdx = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);

  // â”€â”€ Export CSV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleExportCSV = () => {
    let csv = 'Issue ID,Page Name,Issue,Status,Assignee,Deployment Date,Raised Date\n';
    issues.forEach((iss, i) => {
      csv += `PI-2025-000${String(56 - i).padStart(2, '0')},"${iss.pageName}","${iss.issue}","${iss.status}","${iss.assignee}","${iss.deployDate}","${iss.raisedDate}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ProductionIssues_${Date.now()}.csv`; a.click();
    setExportOpen(false);
  };

  const handleExportDoc = () => {
    let html = '<html><head><meta charset="utf-8"></head><body><h2>Production Issues</h2><table border="1" cellpadding="6"><tr><th>Issue ID</th><th>Page</th><th>Issue</th><th>Status</th><th>Assignee</th><th>Deploy Date</th></tr>';
    issues.forEach((iss, i) => {
      html += `<tr><td>PI-2025-000${String(56 - i).padStart(2, '0')}</td><td>${iss.pageName}</td><td>${iss.issue}</td><td>${iss.status}</td><td>${iss.assignee}</td><td>${iss.deployDate}</td></tr>`;
    });
    html += '</table></body></html>';
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ProductionIssues_${Date.now()}.doc`; a.click();
    setExportOpen(false);
  };

  // â”€â”€ History modal helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const historyIssue = issues.find(i => i.id === historyId);

  const renderHeader = (key, label) => {
    let style = {};
    if (key === 'issue') {
      style = { minWidth: 350, width: 350 };
    } else if (key === 'status') {
      style = { minWidth: 110, width: 110 };
    }
    return (
      <th key={key} style={style}>
        <span style={{ fontWeight: 600 }}>{headers[key] || label}</span>
      </th>
    );
  };

  const baseCols = ['sno', 'pageName', 'issue', 'status', 'assignee', 'deployDate', 'raised', 'attachments', 'actions'];

  return (
    <div className="pi-page" onClick={() => { setActiveMenu(null); setExportOpen(false); setAssigneeDropdown(null); setIsAddMenuOpen(false); }}>

      {/* ── History Modal ── */}
      {historyId && historyIssue && (
        <div className="pi-modal-overlay" onClick={() => setHistoryId(null)}>
          <div className="pi-modal" onClick={e => e.stopPropagation()}>
            <div className="pi-modal-header">
              <h3>Action History — {historyIssue.pageName}</h3>
              <button className="pi-modal-close" onClick={() => setHistoryId(null)}><X size={18} /></button>
            </div>
            <div className="pi-modal-body">
              {historyIssue.history.length === 0
                ? <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No history recorded yet.</p>
                : historyIssue.history.slice().reverse().map((h, i) => (
                  <div key={i} className="pi-history-item">
                    <div className="pi-history-dot"><Clock size={12} /></div>
                    <div className="pi-history-detail">
                      <span className="pi-history-who">{h.who}</span>
                      <span className="pi-history-action">
                        Changed <strong>{h.field}</strong> from <code>{h.oldValue || 'empty'}</code> → <code>{h.newValue || 'empty'}</code>
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

      {/* ── Header ── */}
      <div className="pi-header">
        <div className="pi-header-left">
          <div className="pi-header-icon">
            <TriangleAlert size={28} />
          </div>
          <div className="pi-header-titles">
            <h2>Production Issues</h2>
            <p>Issues raised by clients are automatically captured and tracked here.</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="wa-badge">
            <div className={`dot ${waConfig?.status === 'Connected' ? 'connected' : 'disconnected'}`}></div>
            {waConfig?.status === 'Connected' ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
          </div>
          <button className="header-btn" onClick={() => { fetchWaChats(); setShowWaSettings(true); }}>
            <Settings2 size={16} /> WhatsApp Settings
          </button>
          <button className="header-btn" onClick={() => fetchIssues(true)} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? 'Syncing...' : 'Sync WhatsApp'}
          </button>
          <button className="header-btn-primary" onClick={() => navigate('/issues/create')}>
            <Plus size={16} /> Create Issue
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="pi-metrics">
        {[
          { label: 'Total Issues', val: total, sub: 'All Time', icon: <Grid size={24} strokeWidth={1.5} />, iconBg: '#FFF7ED', iconColor: '#EA580C', trend: '100%', trendIcon: <TrendingUp size={14} />, trendColor: '#EF4444' },
          { label: 'Open', val: openCount, sub: `${total ? ((openCount / total) * 100).toFixed(1) : 0}%`, icon: <HeartPulse size={24} strokeWidth={1.5} />, iconBg: '#FEF2F2', iconColor: '#EF4444', trend: '2.2%', trendSub: 'vs last month', trendIcon: <TrendingDown size={14} />, trendColor: '#EF4444' },
          { label: 'In Progress', val: inProg, sub: `${total ? ((inProg / total) * 100).toFixed(1) : 0}%`, icon: <Clock size={24} strokeWidth={1.5} />, iconBg: '#FFFBEB', iconColor: '#F59E0B', trend: '0%', trendSub: 'vs last month', trendIcon: <Minus size={14} />, trendColor: '#9CA3AF' },
          { label: 'Pending', val: pending, sub: `${total ? ((pending / total) * 100).toFixed(1) : 0}%`, icon: <Hourglass size={24} strokeWidth={1.5} />, iconBg: '#F5F3FF', iconColor: '#8B5CF6', trend: '1%', trendSub: 'vs last month', trendIcon: <TrendingUp size={14} />, trendColor: '#8B5CF6' },
          { label: 'Closed', val: closed, sub: `${total ? ((closed / total) * 100).toFixed(1) : 0}%`, icon: <CheckCircle2 size={24} strokeWidth={1.5} />, iconBg: '#F0FDF4', iconColor: '#22C55E', trend: '3%', trendSub: 'vs last month', trendIcon: <TrendingUp size={14} />, trendColor: '#22C55E' },
        ].map(m => (
          <div key={m.label} className={`metric-card ${filterStatus === m.label || (m.label === 'Total Issues' && !filterStatus) ? 'active' : ''}`}
            onClick={() => setFilterStatus(m.label === 'Total Issues' ? null : m.label)}>
            <div className="metric-icon" style={{ background: m.iconBg, color: m.iconColor }}>{m.icon}</div>
            <div className="metric-info">
              <h4>{m.label}</h4>
              <h2>{m.val}</h2>
            </div>
            {m.trend && (
              <div className="metric-trend">
                <span className="trend-val" style={{ color: m.trendColor }}>{m.trendIcon} {m.trend}</span>
                {m.trendSub && <span className="trend-sub">{m.trendSub}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="pi-toolbar" onClick={e => e.stopPropagation()}>
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={16} />
            <input type="text" placeholder="Search issues by title, page, or description..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <button className="header-btn" style={{ padding: '8px 12px' }}>
            <FileText size={14} /> Filters
          </button>
        </div>

        <div className="toolbar-right">
          <button className="header-btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Upload CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} />

          <div style={{ position: 'relative' }}>
            <button className="header-btn" onClick={e => { e.stopPropagation(); setExportOpen(o => !o); }}>
              <Download size={14} /> Export <ChevronDown size={14} />
            </button>
            {exportOpen && (
              <div className="pi-dropdown-menu">
                <button onClick={handleExportCSV} style={{ color: '#22c55e' }}><FileSpreadsheet size={14} /> Download CSV</button>
                <button onClick={handleExportDoc} style={{ color: '#38bdf8' }}><FileText size={14} /> Download Doc</button>
                <button onClick={() => { window.print(); setExportOpen(false); }} style={{ color: '#ef4444' }}><File size={14} /> Download PDF</button>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button className="header-btn" onClick={(e) => { e.stopPropagation(); setIsAddMenuOpen(!isAddMenuOpen); }}>
              <Settings2 size={14} /> Add Action <ChevronDown size={14} />
            </button>
            {isAddMenuOpen && (
              <div className="pi-dropdown-menu">
                <button onClick={() => { addRow(); setIsAddMenuOpen(false); }}>Add Row</button>
                <button onClick={() => { handleAddColumn(); setIsAddMenuOpen(false); }}>Add Column</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="pi-table-container" style={{ overflowX: 'auto' }}>
        <table className="pi-table pi-table-editable" style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              {renderHeader('sno', 'S.No')}
              {renderHeader('pageName', 'Page Name')}
              {renderHeader('issue', 'Issue')}
              {renderHeader('status', 'Status')}
              {renderHeader('assignee', 'Assigned To')}
              {renderHeader('deployDate', 'Deploy Date')}
              {renderHeader('raised', 'Issue Raised')}
              {customColumns.map(col => renderHeader(col, col))}
              <th style={{ textAlign: 'center' }}>Attachments</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((iss, idx) => {
              const sc = STATUS_CONFIG[iss.status] || { color: '#6B7280', bg: '#F3F4F6' };
              const avatar = avatarsDict[iss.assignee];
              return (
                <tr key={iss.id} style={{ position: 'relative', zIndex: assigneeDropdown === iss.id ? 99 : 1 }}>
                  {/* S.No */}
                  <td className="text-center" style={{ color: '#9CA3AF', fontWeight: 600 }}>{String(startIdx + idx + 1).padStart(2, '0')}</td>

                  {/* Page Name ── inline editable */}
                  <td>
                    <input
                      className="pi-inline-input pi-no-underline"
                      value={iss.pageName}
                      onChange={e => updateIssue(iss.id, 'pageName', e.target.value)}
                      placeholder="Page name..."
                    />
                  </td>

                  {/* Issue ── inline textarea */}
                  <td>
                    <textarea
                      className="pi-inline-textarea pi-no-underline"
                      value={iss.issue}
                      onChange={e => updateIssue(iss.id, 'issue', e.target.value)}
                      placeholder="Describe issue..."
                    />
                  </td>

                  {/* Status */}
                  <td>
                    <div className="pi-status-pill" style={{ color: sc.color, borderColor: sc.color, background: sc.bg }}>
                      <select
                        className="pi-status-select"
                        value={iss.status}
                        style={{ color: sc.color }}
                        onChange={e => updateIssue(iss.id, 'status', e.target.value)}
                      >
                        {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={12} style={{ pointerEvents: 'none' }} />
                    </div>
                  </td>

                  {/* Assignee */}
                  <td>
                    <div className="pi-assignee" style={{ position: 'relative' }}>
                      <div className={`pi-assignee-avatar ${!iss.assignee ? 'unassigned' : ''}`} style={{ background: iss.assignee ? '#22C55E' : '' }}>
                        {avatar ? <img src={avatar} alt="" /> : (iss.assignee ? iss.assignee.substring(0, 2).toUpperCase() : <Search size={10} />)}
                      </div>
                      <div
                        className="pi-inline-select pi-no-underline"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onClick={(e) => { e.stopPropagation(); setAssigneeDropdown(assigneeDropdown === iss.id ? null : iss.id); setAssigneeSearch(''); }}
                      >
                        <span className="pi-assignee-name" style={{ color: iss.assignee ? 'var(--brown-dark)' : '#9CA3AF' }}>
                          {iss.assignee || 'Unassigned'}
                        </span>
                        <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
                      </div>

                      {assigneeDropdown === iss.id && (
                        <div className="pi-assignee-menu" onClick={e => e.stopPropagation()}>
                          <div className="pi-assignee-search">
                            <Search size={12} color="#a0a3b1" />
                            <input
                              autoFocus
                              placeholder="Search or add user..."
                              value={assigneeSearch}
                              onChange={e => setAssigneeSearch(e.target.value)}
                            />
                          </div>
                          <div className="pi-assignee-list">
                            <div className="pi-assignee-opt" onClick={() => { updateIssue(iss.id, 'assignee', ''); setAssigneeDropdown(null); }}>
                              Clear assignee
                            </div>
                            {usersList.filter(u => u.toLowerCase().includes(assigneeSearch.toLowerCase())).map(u => (
                              <div key={u} className="pi-assignee-opt" onClick={() => { updateIssue(iss.id, 'assignee', u); setAssigneeDropdown(null); }}>
                                {avatarsDict[u] ? <img src={avatarsDict[u]} alt="" className="pi-inline-avatar" style={{ width: 20, height: 20 }} /> : <div className="pi-inline-avatar-ph" style={{ width: 20, height: 20 }}><Search size={9} /></div>}
                                {u}
                              </div>
                            ))}
                            {assigneeSearch && !usersList.some(u => u.toLowerCase() === assigneeSearch.toLowerCase()) && (
                              <div className="pi-assignee-add-opt" onClick={() => handleAddUser(assigneeSearch, iss.id)}>
                                <Plus size={12} /> Add "{assigneeSearch}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Deploy Date */}
                  <td>
                    <div
                      className="pi-date-cell"
                      style={{ position: 'relative' }}
                      onClick={(e) => openDatePicker(e, 'input[type="date"]')}
                    >
                      <Calendar size={13} className="pi-date-cal-icon" />
                      <div className="pi-date-display">{iss.deployDate && iss.deployDate !== '-' ? iss.deployDate : 'Pick date'}</div>
                      <input
                        type="date"
                        className="pi-inline-date"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker();
                        }}
                        onChange={e => updateIssue(iss.id, 'deployDate', e.target.value
                          ? new Date(e.target.value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '-'
                        )}
                        style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </td>

                  {/* Issue Raised */}
                  <td>
                    <div
                      className="pi-date-cell"
                      style={{ position: 'relative' }}
                      onClick={(e) => openDatePicker(e, 'input[type="datetime-local"]')}
                    >
                      <Calendar size={13} className="pi-date-cal-icon" />
                      <div className="pi-date-display">{iss.raisedDate}</div>
                      <input
                        type="datetime-local"
                        className="pi-inline-date"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker();
                        }}
                        onChange={e => {
                          if (!e.target.value) return;
                          const d = new Date(e.target.value);
                          const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          updateIssue(iss.id, 'raisedDate', formatted);
                        }}
                        style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </td>

                  {/* Custom Columns */}
                  {customColumns.map(col => (
                    <td key={col}>
                      <input
                        className="pi-inline-input pi-no-underline"
                        value={iss[col] || ''}
                        onChange={e => updateIssue(iss.id, col, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}

                  {/* Attachments */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
                         onMouseEnter={() => setHoveredAttachments(iss.id)}
                         onMouseLeave={() => setHoveredAttachments(null)}>
                      <div className="pi-attach-badge" style={{ cursor: 'pointer' }} onClick={() => setViewingAttachments(iss)}>
                        <ImageIcon size={14} />
                        {Array.isArray(iss.attachments) ? iss.attachments.length : 0}
                      </div>
                      
                      {hoveredAttachments === iss.id && Array.isArray(iss.attachments) && iss.attachments.length > 0 && (
                        <div className="pi-attach-hover-menu">
                          {iss.attachments.map((att, aIdx) => (
                            <img key={aIdx} src={getAttachmentSrc(att)} alt="" className="pi-attach-thumb" />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="pi-actions" style={{ justifyContent: 'center' }}>
                      <button className="pi-action-btn" title="View Details" onClick={() => navigate(`/issues/${iss.id}`)}>
                        <Eye size={14} />
                      </button>
                      <button className="pi-action-btn" title="View History" onClick={() => setHistoryId(iss.id)}>
                        <Clock size={14} />
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button className="pi-action-btn" title="More" onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === iss.id ? null : iss.id); }}>
                          <MoreVertical size={14} />
                        </button>
                        {activeMenu === iss.id && (
                          <div className="pi-dropdown-menu" onClick={e => e.stopPropagation()}>
                            {waConfig?.status === 'Connected' && (
                              <button onClick={() => shareToWhatsApp(iss)} style={{ color: '#22c55e' }}>
                                <MessageCircle size={14} /> Share via WA
                              </button>
                            )}
                            <button onClick={() => navigate('/issues/create')}><Edit2 size={14} /> Edit</button>
                            <button className="text-red" onClick={() => deleteIssue(iss.id)}><Trash2 size={14} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td></td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr><td colSpan={10 + customColumns.length} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No issues found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* â”€â”€ Pagination Footer â”€â”€ */}
      <div className="qa-footer">
        <div className="footer-left">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select className="rows-select" value={rowsPerPage} onChange={e => { setRowsPerPage(+e.target.value); setCurrentPage(1); }}>
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span>Showing {filtered.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + rowsPerPage, filtered.length)} of {filtered.length} entries</span>
        </div>
        <div className="qa-pagination">
          <button className="qa-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`qa-page-btn${currentPage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
          ))}
          <button className="qa-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* ── Attachments Modal ── */}
      {viewingAttachments && (
        <div className="pi-modal-overlay" onClick={() => setViewingAttachments(null)}>
          <div className="pi-modal" style={{ width: '800px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="pi-modal-header">
              <h3>attachments — {viewingAttachments.pageName}</h3>
              <button className="pi-modal-close" onClick={() => setViewingAttachments(null)}><X size={18} /></button>
            </div>
            <div className="pi-modal-body" style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '16px 0', alignItems: 'center' }}>
              {Array.isArray(viewingAttachments.attachments) && viewingAttachments.attachments.length > 0 ? (
                viewingAttachments.attachments.map((att, aIdx) => (
                  <img key={aIdx} src={getAttachmentSrc(att)} alt="" style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                ))
              ) : (
                <p style={{ color: '#6b7280', margin: '0 auto' }}>no attachments available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Settings Modal */}
      {showWaSettings && waConfig && (
        <div className="pi-modal-overlay" onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="pi-modal" style={{ width: '450px', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="pi-modal-header" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#111827', fontSize: '1.2rem', fontWeight: 600 }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{ width: '24px' }} />
                Production Issues Configuration
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }} onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 0', color: '#374151', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: 500 }}>Connection Status</span>
                  <span style={{ color: waConfig.status === 'Connected' ? '#22c55e' : '#ef4444', fontWeight: 600, padding: '4px 12px', background: waConfig.status === 'Connected' ? '#dcfce7' : '#fee2e2', borderRadius: '20px', fontSize: '0.85rem' }}>{waConfig.status}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: 500 }}>Connected Device</span>
                  <span style={{ fontWeight: 500 }}>{waConfig.connectedDeviceId || 'None'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: 500 }}>Default WhatsApp Group</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isChangingGroup ? (
                      <>
                        <span style={{ fontWeight: 500, color: '#1f2937' }}>
                          {waConfig.issueDefaultGroup ? waChats.find(c => c.id === waConfig.issueDefaultGroup)?.name || waConfig.issueDefaultGroup : 'Not Configured'}
                        </span>
                        {waConfig.status === 'Connected' && (
                          <button style={{ background: '#f3f4f6', border: '1px solid #d1d5db', color: '#374151', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }} onClick={() => { setIsChangingGroup(true); fetchWaChats(); }}>Change</button>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select style={{ background: '#fff', width: '180px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', color: '#1f2937', fontSize: '13px' }} value={selectedGroupToSave} onChange={e => setSelectedGroupToSave(e.target.value)}>
                          <option value="">Select Group...</option>
                          {waChats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }} onClick={saveWaGroup}>Save</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', color: '#374151', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => { setShowWaSettings(false); setIsChangingGroup(false); }}>Close</button>
              {waConfig.status !== 'Connected' && (
                <button style={{ flex: 1, padding: '10px', background: '#25D366', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => { setShowWaSettings(false); navigate('/whatsapp'); }}>Connect WhatsApp</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionIssues;

