import React, { useState, useEffect, useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  FileText, Download, Printer, Filter, LayoutGrid, Folder, Calendar, Layers, User, ChevronDown, Activity, Heart, Users
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import './Reports.css';

const Reports = () => {
  const { projects, activeProject, setActiveProject } = useContext(ProjectContext);
  const [activeTab, setActiveTab] = useState('health');
  
  const [prodIssues, setProdIssues] = useState([]);
  const [qaIssues, setQaIssues] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [reportStatus, setReportStatus] = useState('All');
  const [reportAssignee, setReportAssignee] = useState('All');

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, qaRes, reqRes, userRes] = await Promise.all([
          fetch('/api/v1/issues').then(r => r.json()),
          fetch('/api/v1/qa-issues').then(r => r.json()),
          fetch('/api/v1/requirements').then(r => r.json()),
          fetch('/api/v1/users').then(r => r.json())
        ]);
        setProdIssues(prodRes.data || []);
        setQaIssues(qaRes.data || []);
        setRequirements(reqRes.data || []);
        setUsers(userRes.data || []);
      } catch (err) {
        console.error('Failed to fetch data for reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePreviewPDF = () => {
    setIsGenerating(true);
    const element = document.getElementById('report-content');
    const opt = {
      margin: 10,
      filename: `Report_${activeProject}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).output('bloburl').then(url => {
      setPreviewUrl(url);
      setIsGenerating(false);
    });
  };

  const handleExportCSV = () => {
    let data = [];
    if (activeTab === 'health') {
      data = [
        ['Metric', 'Count'],
        ['Total Production Issues', filteredProd.length],
        ['Total QA Issues', filteredQa.length],
        ['Total Requirements', filteredReq.length]
      ];
    }
    // Simple CSV generator
    let csvContent = "data:text/csv;charset=utf-8," 
      + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading) return <div style={{padding: '40px', color: '#fff'}}>Loading Reports...</div>;

  // Filters
  const now = new Date();
  const filterByDate = (dateString) => {
    if (!dateString || dateRange === 'all') return true;
    const date = new Date(dateString);
    if (dateRange === 'custom') {
      if (customStartDate && date < new Date(customStartDate)) return false;
      // Add one day to customEndDate to include the entire end day
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setDate(end.getDate() + 1);
        if (date >= end) return false;
      }
      return true;
    }
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (dateRange === '7days') return diffDays <= 7;
    if (dateRange === '30days') return diffDays <= 30;
    return true;
  };

  const filteredProd = prodIssues.filter(i => 
    (activeProject === 'All' || i.module === activeProject || i.project === activeProject || i.pageName === activeProject) && 
    filterByDate(i.raisedDate) &&
    (reportStatus === 'All' || i.status === reportStatus) &&
    (reportAssignee === 'All' || i.assignee === reportAssignee || i.assignedTo === reportAssignee)
  );
  
  const filteredQa = qaIssues.filter(i => 
    (activeProject === 'All' || i.module === activeProject || i.project === activeProject) && 
    filterByDate(i.raisedDate) &&
    (reportStatus === 'All' || i.status === reportStatus) &&
    (reportAssignee === 'All' || i.assignedTo === reportAssignee || i.assignee === reportAssignee)
  );

  const filteredReq = requirements.filter(r => 
    (activeProject === 'All' || r.module === activeProject || r.project === activeProject) && 
    filterByDate(r.requestedDate) &&
    (reportStatus === 'All' || r.status === reportStatus)
  );

  // Data Aggregations
  // 1. Health Data
  const issueStatusCounts = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
  [...filteredProd, ...filteredQa].forEach(i => {
    if (issueStatusCounts[i.status] !== undefined) issueStatusCounts[i.status]++;
  });
  const healthChartData = Object.keys(issueStatusCounts).map(k => ({ name: k, count: issueStatusCounts[k] }));

  // 2. Team Performance Data
  const assigneeCounts = {};
  filteredQa.forEach(i => {
    if (i.assignee) {
      if (!assigneeCounts[i.assignee]) assigneeCounts[i.assignee] = { name: i.assignee, QAIssues: 0, ProdIssues: 0 };
      assigneeCounts[i.assignee].QAIssues++;
    }
  });
  filteredProd.forEach(i => {
    if (i.assignedTo) {
      if (!assigneeCounts[i.assignedTo]) assigneeCounts[i.assignedTo] = { name: i.assignedTo, QAIssues: 0, ProdIssues: 0 };
      assigneeCounts[i.assignedTo].ProdIssues++;
    }
  });
  const performanceData = Object.values(assigneeCounts);

  return (
    <div className="reports-container app-content">
      <div className="reports-header-row">
        <div className="reports-title-group">
          <div className="title-icon-box">
            <Activity size={24} color="#f97316" strokeWidth={2.5} />
          </div>
          <div className="reports-title">
            <h2>System Reports</h2>
            <p>Key metrics and traceability based on your data.</p>
          </div>
        </div>
        <div className="reports-actions">
          <button className="report-action-btn primary" onClick={handlePreviewPDF} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : <><Printer size={16} /> Preview & Export PDF <ChevronDown size={16} /></>}
          </button>
        </div>
      </div>

      <div className="reports-filters new-glass-panel">
        <div className="filter-group">
          <label><Folder size={14} /> Project</label>
          <div className="filter-input-wrap">
            <select value={activeProject} onChange={e => setActiveProject(e.target.value)}>
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>
        <div className="filter-group">
          <label><Calendar size={14} /> Time Range</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="filter-input-wrap" style={{ flex: 1 }}>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              <ChevronDown size={14} className="select-chevron" />
            </div>
            {dateRange === 'custom' && (
              <>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={e => setCustomStartDate(e.target.value)} 
                  className="filter-date-input"
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={e => setCustomEndDate(e.target.value)} 
                  className="filter-date-input"
                />
              </>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label><Layers size={14} /> Status</label>
          <div className="filter-input-wrap">
            <select value={reportStatus} onChange={e => setReportStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>

        <div className="filter-group">
          <label><User size={14} /> Assignee</label>
          <div className="filter-input-wrap">
            <select value={reportAssignee} onChange={e => setReportAssignee(e.target.value)}>
              <option value="All">All Assignees</option>
              {users.map(u => (
                <option key={u.id || u.name} value={u.name}>{u.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>
      </div>

      <div className="reports-text-tabs">
        <button className={`text-tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>
          <Heart size={16} /> Project Health
        </button>
        <button className={`text-tab-btn ${activeTab === 'rtm' ? 'active' : ''}`} onClick={() => setActiveTab('rtm')}>
          <LayoutGrid size={16} /> Traceability Matrix (RTM)
        </button>
        <button className={`text-tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
          <Users size={16} /> Team Performance
        </button>
        <button className={`text-tab-btn ${activeTab === 'detailed' ? 'active' : ''}`} onClick={() => setActiveTab('detailed')}>
          <FileText size={16} /> Detailed Issues
        </button>
      </div>

      <div id="report-content" className="report-content-area">
        {/* REPORT: PROJECT HEALTH */}
        {activeTab === 'health' && (
          <div className="report-section fade-in">
            <h3><LayoutGrid size={18} /> Project Health Overview</h3>
            <div className="health-kpi-grid">
              <div className="kpi-box">
                <h4>Total Requirements</h4>
                <div className="kpi-value">{filteredReq.length}</div>
              </div>
              <div className="kpi-box">
                <h4>Total QA Issues</h4>
                <div className="kpi-value" style={{color: '#f59e0b'}}>{filteredQa.length}</div>
              </div>
              <div className="kpi-box">
                <h4>Total Prod Issues</h4>
                <div className="kpi-value" style={{color: '#ef4444'}}>{filteredProd.length}</div>
              </div>
            </div>

            <div className="chart-container trendy-glass">
              <h4>Issue Status Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={healthChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#a0a3b1" />
                  <YAxis stroke="#a0a3b1" />
                  <Tooltip contentStyle={{ background: '#111216', border: '1px solid #2a2c33', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* REPORT: TRACEABILITY MATRIX */}
        {activeTab === 'rtm' && (
          <div className="report-section fade-in">
            <div className="section-header-box">
              <div className="section-title-wrap">
                <div className="title-icon-box small">
                  <FileText size={20} color="#f97316" strokeWidth={2.5} />
                </div>
                <div>
                  <h3>Requirements Traceability Matrix</h3>
                  <p className="report-desc" style={{margin: 0}}>Maps requirements to their linked test cases (QA Issues) and production issues.</p>
                </div>
              </div>
              {/* Placeholder for the target/document illustration */}
              <div className="section-header-illustration rtm-illustration"></div>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Requirement ID</th>
                    <th>Requirement Title</th>
                    <th>Status</th>
                    <th>Linked QA Issues</th>
                    <th>Linked Prod Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReq.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <div className="empty-state-illustration">
                          <Folder size={48} color="#fcd34d" strokeWidth={1} style={{fill: '#fef3c7'}} />
                          <p>No requirements found for the selected filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReq.map(req => {
                    // Find linked issues (assuming issues mention the requirement ID or name, simplistic approach for now)
                    // In a real app, there'd be a direct relationship field.
                    const linkedQa = filteredQa.filter(q => q.description?.includes(req.reqId) || q.module === req.module).length;
                    const linkedProd = filteredProd.filter(p => p.description?.includes(req.reqId) || p.module === req.module).length;
                    
                    return (
                      <tr key={req.id || req._id}>
                        <td style={{fontWeight: '600'}}>{req.reqId}</td>
                        <td>{req.title}</td>
                        <td><span className={`badge-status-${(req.status||'draft').toLowerCase().replace(' ', '')}`}>{req.status}</span></td>
                        <td>{linkedQa > 0 ? <span style={{color: '#f59e0b', fontWeight: 'bold'}}>{linkedQa} Issues</span> : 'None'}</td>
                        <td>{linkedProd > 0 ? <span style={{color: '#ef4444', fontWeight: 'bold'}}>{linkedProd} Issues</span> : 'None'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT: TEAM PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="report-section fade-in">
            <div className="section-header-box">
              <div className="section-title-wrap">
                <div className="title-icon-box small">
                  <Users size={20} color="#f97316" strokeWidth={2.5} />
                </div>
                <div>
                  <h3>Team Performance (Issues Assigned)</h3>
                  <p className="report-desc" style={{margin: 0}}>Track how many issues are assigned to team members.</p>
                </div>
              </div>
            </div>
            <div className="chart-container trendy-glass" style={{marginBottom: '24px'}}>
              <h4>Issues Load per Assignee</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#a0a3b1" />
                  <YAxis stroke="#a0a3b1" />
                  <Tooltip contentStyle={{ background: '#111216', border: '1px solid #2a2c33', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="QAIssues" name="QA Issues" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ProdIssues" name="Prod Issues" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Assignee Name</th>
                    <th>QA Issues Assigned</th>
                    <th>Prod Issues Assigned</th>
                    <th>Total Load</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.length === 0 ? (
                    <tr><td colSpan="4" style={{textAlign: 'center'}}>No assignee data found.</td></tr>
                  ) : performanceData.map((d, i) => (
                    <tr key={i}>
                      <td style={{fontWeight: '500'}}>{d.name}</td>
                      <td>{d.QAIssues}</td>
                      <td>{d.ProdIssues}</td>
                      <td style={{fontWeight: 'bold'}}>{d.QAIssues + d.ProdIssues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT: DETAILED ISSUES */}
        {activeTab === 'detailed' && (
          <div className="report-section fade-in">
            <div className="section-header-box">
              <div className="section-title-wrap">
                <div className="title-icon-box small">
                  <FileText size={20} color="#f97316" strokeWidth={2.5} />
                </div>
                <div>
                  <h3>Detailed Issues Data</h3>
                  <p className="report-desc" style={{margin: 0}}>Full breakdown of all Requirements, QA Issues, and Production Issues based on current filters.</p>
                </div>
              </div>
            </div>
            
            <h4 style={{marginTop: '20px', marginBottom: '10px', color: 'var(--text-main)'}}>Requirements ({filteredReq.length})</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Req ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReq.length === 0 ? <tr><td colSpan="5">No requirements found.</td></tr> : filteredReq.map(r => (
                    <tr key={r.id}>
                      <td>{r.reqId}</td>
                      <td>{r.title}</td>
                      <td>{r.status}</td>
                      <td>{r.priority}</td>
                      <td>{r.requestedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{marginTop: '30px', marginBottom: '10px', color: 'var(--text-main)'}}>QA Issues ({filteredQa.length})</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Issue ID</th>
                    <th>Page / Module</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQa.length === 0 ? <tr><td colSpan="6">No QA issues found.</td></tr> : filteredQa.map(q => (
                    <tr key={q.id}>
                      <td>{q.issueId}</td>
                      <td>{q.pageName || q.module}</td>
                      <td>{q.issueTitle}</td>
                      <td>{q.severity}</td>
                      <td>{q.status}</td>
                      <td>{q.assignedTo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{marginTop: '30px', marginBottom: '10px', color: 'var(--text-main)'}}>Production Issues ({filteredProd.length})</h4>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Page Name</th>
                    <th>Issue</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Deploy Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProd.length === 0 ? <tr><td colSpan="5">No production issues found.</td></tr> : filteredProd.map(p => (
                    <tr key={p.id}>
                      <td>{p.pageName}</td>
                      <td>{p.issue}</td>
                      <td>{p.status}</td>
                      <td>{p.assignee || '-'}</td>
                      <td>{p.deployDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

      {/* PDF PREVIEW MODAL */}
      {previewUrl && (
        <div className="pdf-preview-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="pdf-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="pdf-preview-header">
              <h3>Report Preview</h3>
              <div className="pdf-preview-actions">
                <button className="report-action-btn" onClick={() => setPreviewUrl(null)}>
                  Close
                </button>
                <button className="report-action-btn primary" onClick={() => {
                  const a = document.createElement('a');
                  a.href = previewUrl;
                  a.download = `Report_${activeProject}_${new Date().toISOString().split('T')[0]}.pdf`;
                  a.click();
                }}>
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
            <iframe className="pdf-preview-iframe" src={previewUrl} title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
