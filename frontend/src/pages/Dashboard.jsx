import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { ProjectContext } from '../context/ProjectContext';
import { 
  ChevronDown, 
  Calendar,
  ClipboardList,
  AlertTriangle,
  Bug,
  Folder,
  Activity,
  MoreVertical,
  ArrowRight,
  Upload,
  BarChart2,
  FileText
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';

const mockSparklineData = [
  { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 }, { value: 18 }, { value: 25 }, { value: 22 }
];

const mockSparklineDataDown = [
  { value: 25 }, { value: 22 }, { value: 24 }, { value: 18 }, { value: 20 }, { value: 15 }, { value: 12 }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeProject } = useContext(ProjectContext);
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'Mahananda Sai';

  const [loading, setLoading] = useState(true);
  const [prodIssues, setProdIssues] = useState([]);
  const [qaIssues, setQaIssues] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [issueFilter, setIssueFilter] = useState('All');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [prodRes, qaRes, reqRes, docRes, momRes] = await Promise.all([
          fetch('/api/v1/issues').then(r => r.json()),
          fetch('/api/v1/qa-issues').then(r => r.json()),
          fetch('/api/v1/requirements').then(r => r.json()),
          fetch('/api/v1/documents').then(r => r.json()),
          fetch('/api/v1/mom').then(r => r.json())
        ]);
        
        setProdIssues(prodRes?.data || []);
        setQaIssues(qaRes?.data || []);
        setRequirements(reqRes?.data || []);
        setDocuments(docRes?.data || []);
        setMeetings(momRes?.data || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (loading) {
    return <div style={{padding: '40px', fontFamily: 'Inter'}}>Loading Dashboard...</div>;
  }

  // Calculate Metrics
  const filteredProd = activeProject === 'All' ? prodIssues : prodIssues.filter(i => i.module === activeProject || i.project === activeProject);
  const filteredQa = activeProject === 'All' ? qaIssues : qaIssues.filter(i => i.module === activeProject || i.project === activeProject);
  const filteredReqs = activeProject === 'All' ? requirements : requirements.filter(r => r.module === activeProject || r.project === activeProject);
  
  const openProdIssues = filteredProd.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
  const openQaIssues = filteredQa.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
  
  const displayIssues = filteredProd.filter(issue => {
    if (issueFilter === 'All') return true;
    return issue.status === issueFilter;
  });
  
  // Table Data Formatting
  const formatBadge = (val) => {
    if (!val) return 'badge-open';
    const s = val.toLowerCase().replace(' ', '');
    if (['high', 'critical'].includes(s)) return 'badge-high';
    if (['medium', 'inprogress'].includes(s)) return 'badge-medium';
    if (['low', 'resolved', 'closed'].includes(s)) return 'badge-low';
    return 'badge-open';
  };

  const getAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  const mockSystemReports = [
    { id: 'SR-101', type: 'Sales Report', generatedOn: '04 Jul 2026', status: 'Generated' },
    { id: 'SR-102', type: 'Performance', generatedOn: '03 Jul 2026', status: 'Generated' },
    { id: 'SR-103', type: 'Inventory', generatedOn: '02 Jul 2026', status: 'Failed' },
    { id: 'SR-104', type: 'Audit Log', generatedOn: '01 Jul 2026', status: 'Generated' },
    { id: 'SR-105', type: 'Financial', generatedOn: '30 Jun 2026', status: 'Generated' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {/* Main Left Column */}
        <div className="dashboard-main">
          
          {/* Top Section */}
          <div className="dashboard-header-section" style={{marginBottom: '24px'}}>
            <div className="dashboard-header-flex" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <div>
                <h1 style={{fontSize: '24px', fontWeight: '700', margin: '0 0 6px 0', color: '#111'}}>Good Morning, {userName.split(' ')[0]} 👋</h1>
                <p style={{margin: '0', color: '#666', fontSize: '14px'}}>Here's what's happening with your projects.</p>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="kpi-grid">
              {/* Production Issues */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-icon" style={{background: '#fef2f2', color: '#ef4444'}}><AlertTriangle size={18}/></div>
                  <span className="kpi-title">Production Issues</span>
                </div>
                <h3 className="kpi-value">24</h3>
                <span className="kpi-subtitle">Open</span>
                <div className="kpi-chart-area" style={{height: '40px', width: '100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSparklineDataDown}>
                      <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{r: 2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-trend">
                  <span className="trend-down">↓ 5%</span> <span className="trend-text">from last week</span>
                </div>
              </div>

              {/* MoM Meetings */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-icon" style={{background: '#eff6ff', color: '#3b82f6'}}><Activity size={18}/></div>
                  <span className="kpi-title">MoM Meetings</span>
                </div>
                <h3 className="kpi-value">16</h3>
                <span className="kpi-subtitle">Total</span>
                <div className="kpi-chart-area" style={{height: '40px', width: '100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSparklineData}>
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{r: 2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-trend">
                  <span className="trend-up" style={{color: '#3b82f6'}}>↑ 8%</span> <span className="trend-text">from last week</span>
                </div>
              </div>

              {/* QA Open Issues */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-icon" style={{background: '#fefce8', color: '#eab308'}}><Bug size={18}/></div>
                  <span className="kpi-title">QA Issues</span>
                </div>
                <h3 className="kpi-value">{openQaIssues}</h3>
                <span className="kpi-subtitle">Open</span>
                <div className="kpi-chart-area" style={{height: '40px', width: '100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSparklineDataDown}>
                      <Line type="monotone" dataKey="value" stroke="#eab308" strokeWidth={2} dot={{r: 2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-trend">
                  <span className="trend-down">↓ 3%</span> <span className="trend-text">from last week</span>
                </div>
              </div>

              {/* Requirements */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-icon" style={{background: '#f0fdf4', color: '#16a34a'}}><ClipboardList size={18}/></div>
                  <span className="kpi-title">Requirements</span>
                </div>
                <h3 className="kpi-value">128</h3>
                <span className="kpi-subtitle">Total</span>
                <div className="kpi-chart-area" style={{height: '40px', width: '100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSparklineData}>
                      <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={{r: 2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-trend">
                  <span className="trend-up">↑ 12%</span> <span className="trend-text">from last week</span>
                </div>
              </div>

              {/* System Reports */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-icon" style={{background: '#faf5ff', color: '#9333ea'}}><FileText size={18}/></div>
                  <span className="kpi-title">System Reports</span>
                </div>
                <h3 className="kpi-value">12</h3>
                <span className="kpi-subtitle">Generated</span>
                <div className="kpi-chart-area" style={{height: '40px', width: '100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSparklineData}>
                      <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={2} dot={{r: 2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-trend">
                  <span className="trend-up" style={{color: '#9333ea'}}>↑ 15%</span> <span className="trend-text">from last week</span>
                </div>
              </div>

              {/* Documents */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-icon" style={{background: '#ccfbf1', color: '#0d9488'}}><Folder size={18}/></div>
                  <span className="kpi-title">Documents</span>
                </div>
                <h3 className="kpi-value">82</h3>
                <span className="kpi-subtitle">Total</span>
                <div className="kpi-chart-area" style={{height: '40px', width: '100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSparklineData}>
                      <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={{r: 2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-trend">
                  <span className="trend-up" style={{color: '#0d9488'}}>↑ 7%</span> <span className="trend-text">from last week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="table-section">
            <div className="table-header">
              <div className="table-title">
                <AlertTriangle size={20} color="#ef4444" />
                Recent Production Issues
              </div>
            </div>

            <div className="table-filters" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{display: 'flex', gap: '24px'}}>
                {['All', 'Open', 'In Progress', 'Closed'].map(status => (
                  <div 
                    key={status} 
                    className={`filter-tab ${issueFilter === status ? 'active' : ''}`}
                    onClick={() => setIssueFilter(status)}
                    style={{cursor: 'pointer'}}
                  >
                    {status}
                  </div>
                ))}
              </div>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/issues'); }} style={{fontSize: '13px', color: '#29251C', textDecoration: 'none', fontWeight: '600'}}>View All &raquo;</a>
            </div>

            <table className="issues-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Module</th>
                  <th>Page / Feature</th>
                  <th>Issue Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Raised On</th>
                </tr>
              </thead>
              <tbody>
                {displayIssues.slice(0, 5).map((issue, idx) => (
                  <tr key={issue.id || idx}>
                    <td>{issue.id}</td>
                    <td>{issue.module || 'General'}</td>
                    <td>{issue.pageName || '-'}</td>
                    <td style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {issue.issue.split('\n')[0]}
                    </td>
                    <td><span className={`badge ${formatBadge(issue.priority)}`}>{issue.priority || 'Medium'}</span></td>
                    <td><span className={`badge ${formatBadge(issue.status)}`}>{issue.status}</span></td>
                    <td>
                      {issue.assignee ? (
                        <img src={getAvatar(issue.assignee)} className="table-avatar" title={issue.assignee} alt={issue.assignee}/>
                      ) : (
                        <span style={{color: '#999', fontStyle: 'italic', fontSize: '12px'}}>Unassigned</span>
                      )}
                    </td>
                    <td>{issue.raisedDate ? issue.raisedDate.split(',')[0] : '-'}</td>
                  </tr>
                ))}
                {displayIssues.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{textAlign: 'center', padding: '24px', color: '#888'}}>No production issues found for this status.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* MoM Meetings Table */}
            <div className="table-header" style={{marginTop: '40px'}}>
              <div className="table-title">
                <Activity size={20} color="#ea580c" />
                Recent MoM Meetings
              </div>
            </div>
            <div className="table-filters" style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/minutes'); }} style={{fontSize: '13px', color: '#29251C', textDecoration: 'none', fontWeight: '600'}}>View All &raquo;</a>
            </div>
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Prepared By</th>
                  <th>Attendees</th>
                </tr>
              </thead>
              <tbody>
                {meetings.slice(0, 5).map((mom, idx) => (
                  <tr key={mom.id || idx}>
                    <td>{mom.agendaTitle || '-'}</td>
                    <td>{mom.date || '-'}</td>
                    <td>{mom.time || '-'}</td>
                    <td>
                      {mom.preparedBy?.name ? (
                        <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <img src={getAvatar(mom.preparedBy.name)} className="table-avatar" alt={mom.preparedBy.name}/>
                          {mom.preparedBy.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{mom.attendees || 0}</td>
                  </tr>
                ))}
                {meetings.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '24px', color: '#888'}}>No MoM meetings found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* QA Issues Table */}
            <div className="table-header" style={{marginTop: '40px'}}>
              <div className="table-title">
                <Bug size={20} color="#eab308" />
                Recent QA Open Issues
              </div>
            </div>
            <div className="table-filters" style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/qa-issues'); }} style={{fontSize: '13px', color: '#29251C', textDecoration: 'none', fontWeight: '600'}}>View All &raquo;</a>
            </div>
            <table className="issues-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Module</th>
                  <th>Issue Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Raised On</th>
                </tr>
              </thead>
              <tbody>
                {filteredQa.slice(0, 5).map((issue, idx) => (
                  <tr key={issue.id || idx}>
                    <td>{issue.id || `QA-${idx}`}</td>
                    <td>{issue.module || 'General'}</td>
                    <td style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {issue.issue ? issue.issue.split('\n')[0] : (issue.title || '-')}
                    </td>
                    <td><span className={`badge ${formatBadge(issue.priority || issue.severity)}`}>{issue.priority || issue.severity || 'Medium'}</span></td>
                    <td><span className={`badge ${formatBadge(issue.status)}`}>{issue.status || 'Open'}</span></td>
                    <td>
                      {issue.assignee ? (
                        <img src={getAvatar(issue.assignee)} className="table-avatar" title={issue.assignee} alt={issue.assignee}/>
                      ) : (
                        <span style={{color: '#999', fontStyle: 'italic', fontSize: '12px'}}>Unassigned</span>
                      )}
                    </td>
                    <td>{issue.raisedDate ? issue.raisedDate.split(',')[0] : '-'}</td>
                  </tr>
                ))}
                {filteredQa.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '24px', color: '#888'}}>No QA issues found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Requirements Table */}
            <div className="table-header" style={{marginTop: '40px'}}>
              <div className="table-title">
                <ClipboardList size={20} color="#16a34a" />
                Recent Requirements
              </div>
            </div>
            <div className="table-filters" style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/requirements'); }} style={{fontSize: '13px', color: '#29251C', textDecoration: 'none', fontWeight: '600'}}>View All &raquo;</a>
            </div>
            <table className="issues-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requirements.slice(0, 5).map((req, idx) => (
                  <tr key={req.id || idx}>
                    <td>{req.reqId || `REQ-${idx}`}</td>
                    <td style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {req.title || '-'}
                    </td>
                    <td>{req.module || '-'}</td>
                    <td><span className={`badge ${formatBadge(req.priority)}`}>{req.priority || 'Medium'}</span></td>
                    <td><span className={`badge ${formatBadge(req.status)}`}>{req.status || 'New'}</span></td>
                  </tr>
                ))}
                {requirements.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '24px', color: '#888'}}>No requirements found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* System Reports Table */}
            <div className="table-header" style={{marginTop: '40px'}}>
              <div className="table-title">
                <FileText size={20} color="#9333ea" />
                Recent System Reports
              </div>
            </div>
            <div className="table-filters" style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/reports'); }} style={{fontSize: '13px', color: '#29251C', textDecoration: 'none', fontWeight: '600'}}>View All &raquo;</a>
            </div>
            <table className="issues-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Generated On</th>
                </tr>
              </thead>
              <tbody>
                {mockSystemReports.map((report, idx) => (
                  <tr key={report.id || idx}>
                    <td>{report.id}</td>
                    <td>{report.type}</td>
                    <td><span className={`badge ${report.status === 'Generated' ? 'badge-resolved' : 'badge-high'}`}>{report.status}</span></td>
                    <td>{report.generatedOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Documents Table */}
            <div className="table-header" style={{marginTop: '40px'}}>
              <div className="table-title">
                <Folder size={20} color="#0d9488" />
                Recent Documents
              </div>
            </div>
            <div className="table-filters" style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/documents'); }} style={{fontSize: '13px', color: '#29251C', textDecoration: 'none', fontWeight: '600'}}>View All &raquo;</a>
            </div>
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Generated On</th>
                </tr>
              </thead>
              <tbody>
                {documents.slice(0, 5).map((doc, idx) => (
                  <tr key={doc.id || idx}>
                    <td>{doc.name || doc.title || `Document ${idx+1}`}</td>
                    <td>{doc.type || 'PDF'}</td>
                    <td>{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : (doc.uploadedAt || doc.date || '-')}</td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{textAlign: 'center', padding: '24px', color: '#888'}}>No documents found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>

      </div>

      {/* Floating Bottom Quick Actions Dock */}
      <div className="quick-actions-dock">
        <div className="dock-title">Quick Actions</div>
        
        <div className="dock-item" onClick={() => navigate('/issues/create')}>
          <div className="dock-icon-wrapper" style={{background: '#fef2f2', color: '#ef4444'}}><AlertTriangle size={16}/></div>
          <span>Log Prod Issue</span>
        </div>
        
        <div className="dock-item" onClick={() => navigate('/minutes/create')}>
          <div className="dock-icon-wrapper" style={{background: '#eff6ff', color: '#3b82f6'}}><Activity size={16}/></div>
          <span>Create MoM</span>
        </div>

        <div className="dock-item" onClick={() => navigate('/qa-issues/create')}>
          <div className="dock-icon-wrapper" style={{background: '#fefce8', color: '#eab308'}}><Bug size={16}/></div>
          <span>Log QA Issue</span>
        </div>

        <div className="dock-item" onClick={() => navigate('/requirements/create')}>
          <div className="dock-icon-wrapper" style={{background: '#f0fdf4', color: '#16a34a'}}><ClipboardList size={16}/></div>
          <span>Requirement</span>
        </div>
        
        <div className="dock-item" onClick={() => navigate('/reports')}>
          <div className="dock-icon-wrapper" style={{background: '#faf5ff', color: '#9333ea'}}><FileText size={16}/></div>
          <span>System Report</span>
        </div>

        <div className="dock-item" onClick={() => navigate('/documents')}>
          <div className="dock-icon-wrapper" style={{background: '#ccfbf1', color: '#0d9488'}}><Folder size={16}/></div>
          <span>Generate Document</span>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
