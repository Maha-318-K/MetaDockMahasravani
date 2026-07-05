import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Upload, Plus, RefreshCw, Trash2, Edit2, Calendar, Check, Search, ChevronLeft, ChevronRight, ChevronDown, LayoutList, MoreHorizontal, Cloud, Server, Clock, X, AlertCircle, Activity, Hourglass, CheckCircle2 } from 'lucide-react';
import { parseMomNotes } from '../utils/momParser';
import './MomTracker.css';

const getStatusStyles = (statusName, statuses = []) => {
  const styles = {
    'Open': { bg: '#FEF3C7', text: '#F59E0B', border: '#FDE68A' },
    'In Progress': { bg: '#EDE9FE', text: '#8B5CF6', border: '#DDD6FE' },
    'Closed': { bg: '#D1FAE5', text: '#10B981', border: '#A7F3D0' },
    'Staging Deployment': { bg: '#F3E8FF', text: '#A855F7', border: '#E9D5FF' },
    'Production Deployed': { bg: '#E0F2FE', text: '#0EA5E9', border: '#BAE6FD' }
  };

  if (styles[statusName]) return styles[statusName];

  const customStatus = statuses.find(s => s.name === statusName);
  if (customStatus && customStatus.color) {
    return { bg: `${customStatus.color}22`, text: customStatus.color, border: `${customStatus.color}55` };
  }

  return { bg: '#f8fafc', text: '#29251C', border: '#e2e8f0' };
};

const MomTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [points, setPoints] = useState([]);
  const [statuses, setStatuses] = useState([
    { name: 'Open', color: '#f8ab37' },
    { name: 'In Progress', color: '#3b82f6' },
    { name: 'Staging Deployment', color: '#a855f7' },
    { name: 'Closed', color: '#22c55e' },
    { name: 'Production Deployed', color: '#06b6d4' }
  ]);
  const [users, setUsers] = useState([]);
  const [customColumns, setCustomColumns] = useState([]);
  const [colWidths, setColWidths] = useState({ pageName: 120, issue: 300 });
  const [loading, setLoading] = useState(true);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [historyModalPointId, setHistoryModalPointId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const fileInputRef = useRef(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#22c55e');
  const [statusDropdownTarget, setStatusDropdownTarget] = useState(null);

  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [assigneeDropdownTarget, setAssigneeDropdownTarget] = useState(null);

  const actionsRef = useRef(null);

  const PRESET_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#16A34A', '#ef4444', '#a855f7'];

  const [saveStatus, setSaveStatus] = useState('Last Updated');
  const [trackerSearch, setTrackerSearch] = useState('');
  const [hoveredHistoryPointId, setHoveredHistoryPointId] = useState(null);

  // Filters
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    let userStr = localStorage.getItem('user');
    let name = userStr ? JSON.parse(userStr).name : 'Unknown User';
    setCurrentUserName(name);
    fetchData();

    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id]);



  const fetchData = async () => {
    try {
      const momRes = await fetch('/api/v1/mom');
      const momData = await momRes.json();
      const currentMeeting = momData.data.find(m => m.id === parseInt(id));
      setMeeting(currentMeeting);

      const userRes = await fetch('/api/v1/users');
      const userData = await userRes.json();
      setUsers(userData.data);

      const settingsRes = await fetch('/api/v1/tracker/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.data) {
        if (settingsData.data.statuses && settingsData.data.statuses.length > 0) {
          const mappedStatuses = settingsData.data.statuses.map(s => {
            if (typeof s === 'string') {
              return { name: s, color: '#16A34A' };
            }
            return s;
          });
          if (!mappedStatuses.some(s => s.name === 'Open')) {
            mappedStatuses.unshift({ name: 'Open', color: '#16A34A' });
          }
          setStatuses(mappedStatuses);
        } else {
          setStatuses([{ name: 'Open', color: '#16A34A' }]);
        }
        if (settingsData.data.columns && settingsData.data.columns.length > 0) {
          setCustomColumns(settingsData.data.columns);
        }
      }

      const pointsRes = await fetch(`/api/v1/tracker/${id}`);
      const pointsData = await pointsRes.json();

      if (!pointsData.data || pointsData.data.length === 0) {
        let initialPoints = [];
        if (currentMeeting && currentMeeting.notes) {
          const parsedPoints = parseMomNotes(currentMeeting.notes);
          initialPoints = parsedPoints.map((parsed, idx) => {
            return {
              id: Date.now() + idx,
              pageName: parsed.pageName,
              issue: parsed.issueText,
              status: 'Open',
              assignee: '',
              stagingDate: '',
              prodDate: ''
            };
          });
        }

        if (initialPoints.length === 0) {
          initialPoints = [{ id: Date.now() + 1, pageName: '', issue: '', status: 'Open', assignee: '', stagingDate: '', prodDate: '' }];
        }
        setPoints(initialPoints);

        fetch(`/api/v1/tracker/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: initialPoints })
        }).catch(err => console.error(err));
      } else {
        setPoints(pointsData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const savePoints = async (newPoints) => {
    setSaveStatus('Saving...');
    try {
      await fetch(`/api/v1/tracker/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints })
      });
      setSaveStatus('All changes saved');
      setTimeout(() => setSaveStatus('Last Updated'), 3000);
    } catch (err) {
      console.error('Failed to save points', err);
      setSaveStatus('Save Failed');
    }
  };

  const updatePoint = (pointId, field, value) => {
    const updatedPoints = points.map(p => {
      if (p.id === pointId) {
        if (p[field] !== value) {
          const newHistoryItem = {
            field,
            oldValue: p[field] || '',
            newValue: value || '',
            timestamp: new Date().toISOString(),
            who: currentUserName || 'Unknown'
          };
          return {
            ...p,
            [field]: value,
            history: [...(p.history || []), newHistoryItem]
          };
        }
      }
      return p;
    });
    setPoints(updatedPoints);
    savePoints(updatedPoints);
  };

  const handleStatusChange = async (point, newStatus) => {
    // Auto-move feature for "Future Implementation"
    if (newStatus === 'Future Implementation') {
      if (window.confirm(`Move this item to Requirements? This will remove it from the MOM Tracker and create a new Requirement.`)) {
        const payload = {
          title: point.pageName ? `${point.pageName} - ${point.issue}` : point.issue || 'Untitled Point',
          module: point.pageName || 'General',
          description: `Imported from MOM Tracker.\n\nOriginal issue: ${point.issue}`,
          priority: 'Medium',
          status: 'Open',
          requestedBy: currentUserName || 'System',
          requestedDate: new Date().toLocaleString('en-GB'),
          targetDate: '-',
          source: 'MOM Tracker',
          notes: `Migrated from MOM Tracker (Meeting ID: ${id})`
        };

        try {
          await fetch('/api/v1/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          // Remove from tracker immediately
          const updatedPoints = points.filter(p => p.id !== point.id);
          setPoints(updatedPoints);
          savePoints(updatedPoints);
          return;
        } catch (err) {
          console.error('Failed to move to requirements', err);
          alert('Failed to move item to requirements');
        }
      }
    }
    updatePoint(point.id, 'status', newStatus);
  };

  const addPoint = () => {
    const updatedPoints = [
      ...points,
      { id: Date.now(), pageName: '', issue: '', status: 'Open', assignee: '', stagingDate: '', prodDate: '' }
    ];
    setPoints(updatedPoints);
    savePoints(updatedPoints);
  };

  const removePoint = (pointId) => {
    if (!window.confirm("Delete this row?")) return;
    const updatedPoints = points.filter(p => p.id !== pointId);
    setPoints(updatedPoints);
    savePoints(updatedPoints);
  };

  const handleAddStatusSubmit = async () => {
    if (!newStatusName.trim()) return;
    const statusObj = { name: newStatusName.trim(), color: newStatusColor };
    try {
      const res = await fetch('/api/v1/tracker/settings/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusObj })
      });
      const data = await res.json();
      if (data.success) {
        setStatuses(data.data);
        if (statusDropdownTarget) {
          updatePoint(statusDropdownTarget, 'status', statusObj.name);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setIsStatusModalOpen(false);
    setNewStatusName('');
    setStatusDropdownTarget(null);
  };

  const handleAddAssigneeSubmit = async () => {
    if (!newAssigneeName.trim()) return;
    const cleanName = newAssigneeName.trim();

    // Auto-generate fields required by the user endpoint
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
          updatePoint(assigneeDropdownTarget, 'assignee', data.data.name);
        }
      } else {
        alert(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error(err);
      // Fallback for local update if backend fails
      const localUser = { ...newUserObj, id: Date.now() };
      setUsers(prev => [...prev, localUser]);
      if (assigneeDropdownTarget) {
        updatePoint(assigneeDropdownTarget, 'assignee', cleanName);
      }
    }
    setIsAssigneeModalOpen(false);
    setNewAssigneeName('');
    setAssigneeDropdownTarget(null);
  };

  const handleAddColumn = async () => {
    const colName = window.prompt("Enter new column name:");
    if (!colName || !colName.trim()) return;
    const cleanColName = colName.trim();
    if (customColumns.includes(cleanColName)) {
      alert("Column already exists");
      return;
    }

    const newColumns = [...customColumns, cleanColName];
    try {
      const res = await fetch('/api/v1/tracker/settings/columns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns })
      });
      const data = await res.json();
      if (data.success) {
        setCustomColumns(data.data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add column");
    }
    setIsAddMenuOpen(false);
  };

  const handleUploadExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim());
      const newPoints = [];
      let maxId = points.reduce((max, p) => p.id > max ? p.id : max, 0);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let inQuotes = false;
        let currentVal = '';
        const values = [];

        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim());
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim());

        const point = {
          id: ++maxId,
          pageName: '',
          issue: '',
          status: 'Open',
          assignee: '',
          stagingDate: '',
          prodDate: '',
          history: [{
            field: 'status',
            oldValue: '',
            newValue: 'Imported',
            timestamp: new Date().toISOString(),
            who: currentUserName || 'Unknown'
          }]
        };

        headers.forEach((h, index) => {
          const val = values[index] || '';
          if (h === 'Page Name') point.pageName = val;
          else if (h === 'Issue / Point') point.issue = val;
          else if (h === 'Status') point.status = val;
          else if (h === 'Assignee') point.assignee = val;
          else if (h === 'Staging Deployment') point.stagingDate = val;
          else if (h === 'Production Deployment') point.prodDate = val;
          else if (customColumns.includes(h)) point[h] = val;
        });

        newPoints.push(point);
      }

      if (newPoints.length > 0) {
        const updated = [...points, ...newPoints];
        setPoints(updated);
        savePoints(updated);
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportExcel = () => {
    let csv = 'S.No,Page Name,Issue / Point,Status,Assignee,Staging Deployment,Production Deployment';
    customColumns.forEach(col => csv += `,${col}`);
    csv += '\n';

    points.forEach((p, index) => {
      let row = [
        index + 1,
        `"${(p.pageName || '').replace(/"/g, '""')}"`,
        `"${(p.issue || '').replace(/"/g, '""')}"`,
        `"${(p.status || '').replace(/"/g, '""')}"`,
        `"${(p.assignee || '').replace(/"/g, '""')}"`,
        `"${(p.stagingDate || '').replace(/"/g, '""')}"`,
        `"${(p.prodDate || '').replace(/"/g, '""')}"`
      ];
      customColumns.forEach(col => {
        row.push(`"${(p[col] || '').replace(/"/g, '""')}"`);
      });
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Tracker_Export_${Date.now()}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportDoc = () => {
    let html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    html += "<h2>Tracker Export</h2><table border='1' cellpadding='5' cellspacing='0'><thead><tr>";
    html += "<th>S.No</th><th>Page Name</th><th>Issue / Point</th><th>Status</th><th>Assignee</th><th>Staging Deployment</th><th>Production Deployment</th>";
    customColumns.forEach(col => html += `<th>${col}</th>`);
    html += "</tr></thead><tbody>";

    points.forEach((p, index) => {
      html += "<tr>";
      html += `<td>${index + 1}</td>`;
      html += `<td>${p.pageName || ''}</td>`;
      html += `<td>${p.issue || ''}</td>`;
      html += `<td>${p.status || ''}</td>`;
      html += `<td>${p.assignee || ''}</td>`;
      html += `<td>${p.stagingDate || ''}</td>`;
      html += `<td>${p.prodDate || ''}</td>`;
      customColumns.forEach(col => {
        html += `<td>${p[col] || ''}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table></body></html>";

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Tracker_Export_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportPdf = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  // Filter Logic
  const filteredPoints = points.filter(p => {
    if (selectedAssignee && p.assignee !== selectedAssignee) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (selectedDeployment === 'Staging' && !p.stagingDate) return false;
    if (selectedDeployment === 'Production' && !p.prodDate) return false;

    if (trackerSearch) {
      return (p.pageName || '').toLowerCase().includes(trackerSearch.toLowerCase()) ||
        (p.issue || '').toLowerCase().includes(trackerSearch.toLowerCase());
    }
    return true;
  });

  // Summary Logic
  const totalPoints = points.length;
  const openCount = points.filter(p => p.status === 'Open').length;
  const inProgressCount = points.filter(p => p.status === 'In Progress').length;
  const closedCount = points.filter(p => p.status === 'Closed').length;
  const stagingCount = points.filter(p => p.stagingDate).length;
  const prodCount = points.filter(p => p.prodDate).length;

  const getPercent = (count) => totalPoints ? ((count / totalPoints) * 100).toFixed(2) : '0.00';

  let assigneeStats = { assigned: 0, open: 0, inProgress: 0, closed: 0 };
  let assigneeDetails = null;
  if (selectedAssignee) {
    const assignPoints = points.filter(p => p.assignee === selectedAssignee);
    assigneeStats.assigned = assignPoints.length;
    assigneeStats.open = assignPoints.filter(p => p.status === 'Open').length;
    assigneeStats.inProgress = assignPoints.filter(p => p.status === 'In Progress').length;
    assigneeStats.closed = assignPoints.filter(p => p.status === 'Closed').length;
    assigneeDetails = users.find(u => u.name === selectedAssignee);
  }

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredPoints.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredPoints.length / rowsPerPage);

  if (loading || !meeting) return <div className="tracker-loading">Loading Tracker...</div>;

  return (
    <div className="mom-tracker-page">
      {/* History Modal */}
      {historyModalPointId && (
        <div className="history-modal-overlay">
          <div className="history-modal-content">
            <div className="history-modal-header">
              <h3>Action History</h3>
              <button className="history-close-btn" onClick={() => setHistoryModalPointId(null)}><X size={20} /></button>
            </div>
            <div className="history-timeline">
              {(() => {
                const point = points.find(p => p.id === historyModalPointId);
                const hist = point?.history || [];
                if (hist.length === 0) return <div className="history-empty">No actions recorded yet.</div>;
                return hist.slice().reverse().map((h, i) => (
                  <div key={i} className="history-item">
                    <div className="history-item-icon"><Clock size={14} /></div>
                    <div className="history-item-details">
                      <div className="history-item-who">{h.who}</div>
                      <div className="history-item-action">
                        Changed <strong>{h.field}</strong> from <code>{h.oldValue || 'empty'}</code> to <code>{h.newValue || 'empty'}</code>
                      </div>
                      <div className="history-item-time">{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="tracker-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left: Breadcrumbs & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="tracker-top-nav" style={{ margin: 0, fontSize: '0.85rem' }}>
            <span style={{ cursor: 'pointer', color: '#a0a3b1' }} onClick={() => navigate('/minutes')}>Minutes of Meeting</span>
            <span style={{ margin: '0 8px', color: '#a0a3b1' }}>{'>'}</span>
            <span className="current" style={{ color: '#16A34A' }}>MOM Tracker</span>
          </div>
          <div className="tracker-title" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <h2 style={{ color: '#000000', fontWeight: 'bold', margin: 0 }}>Minutes of Meeting</h2>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="tracker-actions" ref={actionsRef} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
          <div className="add-dropdown-container">
            <button className="export-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload Excel
            </button>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleUploadExcel}
            />
          </div>
          <div className="add-dropdown-container" style={{ position: 'relative' }}>
            <button className="export-btn" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
              <Download size={16} /> Export
            </button>
            {isExportMenuOpen && (
              <div className="add-dropdown-menu">
                <button className="export-opt-pdf" onClick={handleExportPdf}>Download PDF</button>
                <button className="export-opt-excel" onClick={handleExportExcel}>Download Excel (CSV)</button>
                <button className="export-opt-doc" onClick={handleExportDoc}>Download Doc</button>
              </div>
            )}
          </div>
          <div className="add-dropdown-container" style={{ position: 'relative' }}>
            <button className="add-point-btn" onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} style={{ color: '#ffffff' }}>
              <Plus size={16} /> Add Action
            </button>
            {isAddMenuOpen && (
              <div className="add-dropdown-menu add-action-menu-white">
                <button onClick={() => { addPoint(); setIsAddMenuOpen(false); }}>Add Row</button>
                <button onClick={handleAddColumn}>Add Column</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="summary-cards-row" style={{ gridTemplateColumns: selectedAssignee ? 'repeat(7, 1fr)' : 'repeat(6, 1fr)' }}>
        <div className="summary-card">
          <div className="card-icon-left" style={{ background: '#F8F3EA', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutList size={24} style={{ color: '#29251C' }} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-label" style={{ fontSize: '0.75rem', color: '#a0a3b1' }}>Total Points</div>
            <div className="card-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#29251C', marginTop: '4px' }}>{totalPoints}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-left" style={{ background: '#FEF3C7', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} style={{ color: '#F59E0B' }} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-label" style={{ fontSize: '0.75rem', color: '#a0a3b1' }}>Open</div>
            <div className="card-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#29251C', marginTop: '4px' }}>{openCount}</div>
            <div className="card-percent" style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: '600' }}>{getPercent(openCount)}%</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-left" style={{ background: '#EDE9FE', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} style={{ color: '#8B5CF6' }} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-label" style={{ fontSize: '0.75rem', color: '#a0a3b1' }}>In Progress</div>
            <div className="card-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#29251C', marginTop: '4px' }}>{inProgressCount}</div>
            <div className="card-percent" style={{ fontSize: '0.7rem', color: '#8B5CF6', fontWeight: '600' }}>{getPercent(inProgressCount)}%</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-left" style={{ background: '#D1FAE5', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} style={{ color: '#10B981' }} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-label" style={{ fontSize: '0.75rem', color: '#a0a3b1' }}>Closed</div>
            <div className="card-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#29251C', marginTop: '4px' }}>{closedCount}</div>
            <div className="card-percent" style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '600' }}>{getPercent(closedCount)}%</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-left" style={{ background: '#F3E8FF', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Server size={24} style={{ color: '#A855F7' }} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-label" style={{ fontSize: '0.75rem', color: '#a0a3b1' }}>Staging Dep.</div>
            <div className="card-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#29251C', marginTop: '4px' }}>{stagingCount}<span style={{ fontSize: '0.85rem', color: '#a0a3b1', marginLeft: '4px' }}>/ {totalPoints}</span></div>
            <div className="card-percent" style={{ fontSize: '0.7rem', color: '#A855F7', fontWeight: '600' }}>{getPercent(stagingCount)}%</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-left" style={{ background: '#E0F2FE', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cloud size={24} style={{ color: '#0EA5E9' }} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-label" style={{ fontSize: '0.75rem', color: '#a0a3b1' }}>Prod Dep.</div>
            <div className="card-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#29251C', marginTop: '4px' }}>{prodCount}<span style={{ fontSize: '0.85rem', color: '#a0a3b1', marginLeft: '4px' }}>/ {totalPoints}</span></div>
            <div className="card-percent" style={{ fontSize: '0.7rem', color: '#0EA5E9', fontWeight: '600' }}>{getPercent(prodCount)}%</div>
          </div>
        </div>

        {selectedAssignee && (
          <div className="summary-card card-assignee-summary">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="card-icon assignee-icon-placeholder">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <span style={{ fontWeight: 'bold' }}>Assignee</span>
              </div>
              <MoreHorizontal size={16} color="#a0a3b1" />
            </div>
            <div className="card-body" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px 16px' }}>
              <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {assigneeDetails ? `${assigneeDetails.name}` : 'All'}
              </div>
              <div className="assignee-stats-grid">
                <div className="stat-item">
                  <span className="stat-label text-blue">Assig</span>
                  <span className="stat-val text-blue">{assigneeStats.assigned}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-red">Open</span>
                  <span className="stat-val text-red">{assigneeStats.open}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-orange">In Prg</span>
                  <span className="stat-val text-orange">{assigneeStats.inProgress}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-green">Closed</span>
                  <span className="stat-val text-green">{assigneeStats.closed}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="tracker-controls-panel">
        <div className="meta-col">
          <label>Meeting Date</label>
          <div className="meta-readonly-box">
            <Calendar size={16} />
            <span>{meeting.date}, {meeting.time}</span>
          </div>
        </div>

        <div className="meta-col">
          <label>Filter Assignee</label>
          <select
            className="control-select"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
          >
            <option value="">All Assignees</option>
            {users.map(u => <option key={u.id} value={u.name}>{u.name} ({u.empId})</option>)}
          </select>
        </div>

        <div className="meta-col">
          <label>Filter Status</label>
          <select
            className="control-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        <div className="meta-col">
          <label>Filter Deployment</label>
          <select
            className="control-select"
            value={selectedDeployment}
            onChange={(e) => setSelectedDeployment(e.target.value)}
          >
            <option value="">All Points</option>
            <option value="Staging">Has Staging Date</option>
            <option value="Production">Has Production Date</option>
          </select>
        </div>

        <div className="meta-right">
          <span className="total-points-box">Total Points: {totalPoints}</span>
          <div className="last-updated">
            <span className={saveStatus === 'Saving...' ? 'text-orange' : saveStatus === 'All changes saved' ? 'text-green' : ''}>
              {saveStatus === 'Last Updated'
                ? `Last Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : saveStatus}
            </span>
            <button className="refresh-btn" onClick={fetchData}><RefreshCw size={14} /></button>
          </div>
        </div>
      </div>

      <div className="qa-table-container" style={{ overflowX: 'auto' }}>
        <table className="qa-table" style={{ minWidth: '1200px' }}>
          {(() => {
            const col1W = 60;
            const col2W = colWidths.pageName;
            const col3W = colWidths.issue;
            const col4W = 140;

            const left1 = 0;
            const left2 = left1 + col1W;
            const left3 = left2 + col2W;
            const left4 = left3 + col3W;

            return (
              <>
                <thead>
                  <tr>
                    <th style={{ width: col1W, minWidth: col1W, maxWidth: col1W, background: '#F8F3EA', color: '#29251C', borderBottom: 'none', padding: '16px' }}>S.No</th>
                    <th style={{ width: col2W, minWidth: col2W, maxWidth: col2W, background: '#F8F3EA', color: '#29251C', borderBottom: 'none', padding: '16px' }}>Page Name</th>
                    <th style={{ width: col3W, minWidth: col3W, maxWidth: col3W, background: '#F8F3EA', color: '#29251C', borderBottom: 'none', padding: '16px' }}>Issue / Point</th>
                    <th style={{ width: col4W, minWidth: col4W, maxWidth: col4W, background: '#F8F3EA', color: '#29251C', borderBottom: 'none', padding: '16px' }}>Status</th>
                    <th style={{ width: 220, minWidth: 220, background: '#F8F3EA', color: '#29251C', borderBottom: 'none', padding: '16px' }}>Assignee</th>
                    <th style={{ width: 150, minWidth: 150, background: '#F8F3EA', color: '#29251C', borderBottom: 'none', padding: '16px' }}>Staging Deployment</th>
                    <th style={{ width: 150, minWidth: 150, background: '#F8F3EA', color: '#29251C', borderBottom: 'none', padding: '16px' }}>Production Deployment</th>
                    {customColumns.map(col => (
                      <th key={col} style={{ width: 150, minWidth: 150, maxWidth: 150 }}>{col} <Edit2 size={12} className="th-icon" /></th>
                    ))}
                    <th style={{ width: 80, minWidth: 80, maxWidth: 80, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((point, index) => {
                    return (
                      <tr key={point.id}>
                        <td style={{ width: col1W, minWidth: col1W, maxWidth: col1W }}>
                          <span style={{ display: 'inline-block', background: '#F8F3EA', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', color: '#29251C' }}>
                            {indexOfFirstRow + index + 1}
                          </span>
                        </td>
                        <td style={{ width: col2W, minWidth: col2W, maxWidth: col2W }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              className="editable-input"
                              value={point.pageName}
                              onChange={(e) => updatePoint(point.id, 'pageName', e.target.value)}
                              placeholder="Page name..."
                              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontWeight: '600', color: '#29251C' }}
                            />
                          </div>
                        </td>
                        <td style={{ width: col3W, minWidth: col3W, maxWidth: col3W }}>
                          <textarea
                            className="editable-textarea"
                            value={point.issue}
                            onChange={(e) => updatePoint(point.id, 'issue', e.target.value)}
                            placeholder="Describe issue..."
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', resize: 'none', color: '#29251C', minHeight: '60px' }}
                          />
                        </td>
                        <td style={{ width: col4W, minWidth: col4W, maxWidth: col4W }}>
                          <div className="status-dropdown-container" style={{ position: 'relative', width: '100%' }}>
                            <select
                              className="status-select-pill"
                              value={point.status}
                              onChange={(e) => handleStatusChange(point, e.target.value)}
                              style={{
                                appearance: 'none',
                                background: getStatusStyles(point.status, statuses).bg,
                                color: getStatusStyles(point.status, statuses).text,
                                border: '1px solid',
                                borderColor: getStatusStyles(point.status, statuses).border,
                                padding: '6px 28px 6px 12px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                outline: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              {statuses.map(s => (
                                <option key={s.name} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: getStatusStyles(point.status, statuses).text }} />
                          </div>
                        </td>
                        <td>
                          <div className="assignee-dropdown-container" style={{ position: 'relative', width: '100%' }}>
                            <select
                              value={point.assignee}
                              onChange={(e) => updatePoint(point.id, 'assignee', e.target.value)}
                              style={{
                                appearance: 'none',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                padding: '6px 28px 6px 32px',
                                borderRadius: '6px',
                                fontWeight: '500',
                                color: '#29251C',
                                outline: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="">Select Assignee</option>
                              {users.map(u => (
                                <option key={u.id} value={u.name}>{u.name}</option>
                              ))}
                            </select>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a0a3b1' }} />
                          </div>
                        </td>
                        <td>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="date"
                              className="date-input-pill"
                              value={point.stagingDate}
                              onChange={(e) => updatePoint(point.id, 'stagingDate', e.target.value)}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                color: '#29251C',
                                outline: 'none',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="date"
                              className="date-input-pill"
                              value={point.prodDate}
                              onChange={(e) => updatePoint(point.id, 'prodDate', e.target.value)}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                color: '#29251C',
                                outline: 'none',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </td>
                        {customColumns.map(col => (
                          <td key={col}>
                            <input
                              className="inline-input"
                              type="text"
                              value={point[col] || ''}
                              onChange={e => updatePoint(point.id, col, e.target.value)}
                              placeholder="Enter..."
                            />
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <div style={{ position: 'relative' }} onMouseEnter={() => setHoveredHistoryPointId(point.id)} onMouseLeave={() => setHoveredHistoryPointId(null)}>
                              <button
                                style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#29251C', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Clock size={16} />
                              </button>
                              {hoveredHistoryPointId === point.id && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: '50%',
                                  transform: 'translateX(50%)',
                                  marginTop: '8px',
                                  background: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  width: '240px',
                                  maxHeight: '180px',
                                  overflowY: 'auto',
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                  zIndex: 999,
                                  textAlign: 'left'
                                }}>
                                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#29251C', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>Action History</h4>
                                  {point.history && point.history.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                      {point.history.map((h, i) => (
                                        <li key={i} style={{ marginBottom: '8px', borderBottom: i < point.history.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '6px' }}>
                                          <div style={{ fontWeight: '600', color: '#29251C', marginBottom: '2px' }}>
                                            Changed {h.field} to {h.newValue || 'empty'}
                                          </div>
                                          <div>{new Date(h.timestamp).toLocaleString()} - {h.who}</div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div style={{ fontSize: '0.75rem', color: '#a0a3b1', fontStyle: 'italic' }}>No history recorded yet.</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => removePoint(point.id)}
                              title="Delete Row"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {currentRows.length === 0 && (
                    <tr><td colSpan={8 + customColumns.length} style={{ textAlign: 'center', padding: '32px', color: '#a0a3b1' }}>No points found matching filters.</td></tr>
                  )}
                </tbody>
              </>
            );
          })()}
        </table>

        <div className="tracker-pagination-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <div className="tp-left" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', color: '#29251C' }}>
            <span>Rows per page:</span>
            <div style={{ position: 'relative' }}>
              <select style={{ appearance: 'none', background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 24px 4px 12px', borderRadius: '6px', color: '#29251C', cursor: 'pointer' }} value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a0a3b1' }} />
            </div>
            <span style={{ marginLeft: '12px', color: '#a0a3b1' }}>Showing {filteredPoints.length === 0 ? 0 : indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredPoints.length)} of {filteredPoints.length} entries</span>
          </div>
          <div className="tp-right" style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#e2e8f0' : '#29251C' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /></button>
            <button style={{ background: '#29251C', border: '1px solid #29251C', padding: '4px 12px', borderRadius: '4px', color: '#ffffff' }}>{currentPage}</button>
            {currentPage < totalPages && <button style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: '4px', color: '#29251C' }} onClick={() => setCurrentPage(p => p + 1)}>{currentPage + 1}</button>}
            <button style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', color: currentPage === totalPages || totalPages === 0 ? '#e2e8f0' : '#29251C' }} disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {isStatusModalOpen && (
        <div className="history-modal-overlay" onClick={() => setIsStatusModalOpen(false)}>
          <div className="history-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="history-modal-header">
              <h3>Create Custom Status</h3>
              <button className="history-modal-close" onClick={() => setIsStatusModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="history-modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#a0a3b1' }}>Status Name</label>
                <input
                  type="text"
                  value={newStatusName}
                  onChange={e => setNewStatusName(e.target.value)}
                  placeholder="e.g. Blocked"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    color: '#000000',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#a0a3b1' }}>Select Color</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(color => (
                    <div
                      key={color}
                      onClick={() => setNewStatusColor(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: newStatusColor === color ? '2px solid #fff' : '2px solid transparent',
                        boxShadow: newStatusColor === color ? `0 0 12px ${color}` : 'none',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddStatusSubmit}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#16A34A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Status
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssigneeModalOpen && (
        <div className="history-modal-overlay" onClick={() => setIsAssigneeModalOpen(false)}>
          <div className="history-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="history-modal-header">
              <h3>Add New Assignee</h3>
              <button className="history-modal-close" onClick={() => setIsAssigneeModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="history-modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#a0a3b1' }}>Assignee Name</label>
                <input
                  type="text"
                  value={newAssigneeName}
                  onChange={e => setNewAssigneeName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}
                  placeholder="Enter name..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="cancel-btn" onClick={() => setIsAssigneeModalOpen(false)}>Cancel</button>
                <button className="save-btn" onClick={handleAddAssigneeSubmit}>Add Assignee</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomTracker;
