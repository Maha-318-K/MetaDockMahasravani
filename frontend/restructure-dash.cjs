const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// 1. Calculate missing chart data
const calcDataLogic = `
  // Requirements Chart Data
  const reqStatusCount = {};
  filteredRequirements.forEach(r => {
    const s = r.status || 'Draft';
    reqStatusCount[s] = (reqStatusCount[s] || 0) + 1;
  });
  const reqStatusData = Object.keys(reqStatusCount).map(k => ({
    name: k, value: reqStatusCount[k], color: statusColors[k] || '#a855f7'
  }));

  // Prod Issues Priority Data
  const prodPriorityCount = {};
  filteredProdIssues.forEach(i => {
    const s = i.priority || 'Medium';
    prodPriorityCount[s] = (prodPriorityCount[s] || 0) + 1;
  });
  const prodPriorityData = Object.keys(prodPriorityCount).map(k => ({
    name: k, value: prodPriorityCount[k], color: prioColors[k] || '#f59e0b'
  }));

  // QA Issues Severity Data
  const qaSeverityCount = {};
  filteredQaIssues.forEach(i => {
    const s = i.severity || 'Medium';
    qaSeverityCount[s] = (qaSeverityCount[s] || 0) + 1;
  });
  const qaSeverityData = Object.keys(qaSeverityCount).map(k => ({
    name: k, value: qaSeverityCount[k], color: prioColors[k] || '#eab308'
  }));

  // Action Items Status Data
  const actionStatusCount = {};
  pendingActions.forEach(a => {
    const s = a.status || 'Open';
    actionStatusCount[s] = (actionStatusCount[s] || 0) + 1;
  });
  const actionStatusData = Object.keys(actionStatusCount).map(k => ({
    name: k, value: actionStatusCount[k], color: statusColors[k] || '#3b82f6'
  }));
`;

// Insert the calculation logic before the return statement
content = content.replace('  return (', calcDataLogic + '\n  return (');

// 2. We need to replace the entire bottom half of the dashboard, starting from `      {/* SECTION 1: ENTIRE PROJECT GRAPHS */}` to the end of `</div>\n    </div>\n  );\n};\n`

const remainingSections = `
      {/* SECTION 2: PRODUCTION ISSUES OVERVIEW */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <AlertTriangle size={20} color="#ef4444" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Production Issues Overview</h3>
      </div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card trendy-glass">
          <div className="chart-header-row">
             <LayoutGrid color="#ef4444" size={18}/>
             <h4>Issues by Priority</h4>
          </div>
          <div className="chart-content">
            {prodPriorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={prodPriorityData} innerRadius={70} outerRadius={100} dataKey="value" stroke="none" paddingAngle={5}>
                    {prodPriorityData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 18, 22, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{color: '#a0a3b1'}}>No production issues found.</p>
            )}
          </div>
        </div>
        
        <div className="trendy-glass table-widget">
          <div className="widget-header">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <AlertTriangle size={18} color="#ef4444" />
              <h4>Recent Prod Issues</h4>
            </div>
            <a onClick={() => navigate('/issues')}>View all →</a>
          </div>
          <div className="qa-table-container" style={{border: 'none', borderRadius: 0, flex: 1}}>
            <table className="qa-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Module</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {topProdIssues.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign: 'center', color: '#a0a3b1'}}>No production issues found.</td></tr>
                ) : topProdIssues.map(i => (
                  <tr key={i.id}>
                    <td><a onClick={() => navigate(\`/issues/\${i.id}\`)} style={{color: '#3b82f6', cursor: 'pointer', textDecoration: 'none', fontWeight: 500}}>{i.issueId}</a></td>
                    <td>{i.module}</td>
                    <td><span className={formatBadge(i.priority === 'Critical' ? i.priority : i.status)}>{i.priority === 'Critical' ? 'Critical' : i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: QA ISSUES OVERVIEW */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <Bug size={20} color="#eab308" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>QA Issues Overview</h3>
      </div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card trendy-glass">
          <div className="chart-header-row">
             <LayoutGrid color="#eab308" size={18}/>
             <h4>Issues by Severity</h4>
          </div>
          <div className="chart-content">
            {qaSeverityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={qaSeverityData} innerRadius={70} outerRadius={100} dataKey="value" stroke="none" paddingAngle={5}>
                    {qaSeverityData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 18, 22, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{color: '#a0a3b1'}}>No QA issues found.</p>
            )}
          </div>
        </div>
        
        <div className="trendy-glass table-widget">
          <div className="widget-header">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Bug size={18} color="#eab308" />
              <h4>Recent QA Issues</h4>
            </div>
            <a onClick={() => navigate('/qa-issues')}>View all →</a>
          </div>
          <div className="qa-table-container" style={{border: 'none', borderRadius: 0, flex: 1}}>
            <table className="qa-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Module</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {topQaIssues.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign: 'center', color: '#a0a3b1'}}>No QA issues found.</td></tr>
                ) : topQaIssues.map(i => (
                  <tr key={i.id}>
                    <td style={{fontWeight: 500, color: '#a0a3b1'}}>{i.issueId}</td>
                    <td>{i.module}</td>
                    <td><span className={formatBadge(i.severity === 'Critical' ? i.severity : i.status)}>{i.severity === 'Critical' ? 'Critical' : i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 4: REQUIREMENTS OVERVIEW */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <ClipboardList size={20} color="#a855f7" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Requirements Overview</h3>
      </div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card trendy-glass">
          <div className="chart-header-row">
             <LayoutGrid color="#a855f7" size={18}/>
             <h4>Requirements by Status</h4>
          </div>
          <div className="chart-content">
            {reqStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={reqStatusData} innerRadius={70} outerRadius={100} dataKey="value" stroke="none" paddingAngle={5}>
                    {reqStatusData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 18, 22, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{color: '#a0a3b1'}}>No requirements found.</p>
            )}
          </div>
        </div>
        
        <div className="trendy-glass table-widget">
          <div className="widget-header">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <ClipboardList size={18} color="#a855f7" />
              <h4>Recent Requirements</h4>
            </div>
            <a onClick={() => navigate('/requirements')}>View all →</a>
          </div>
          <div className="qa-table-container" style={{border: 'none', borderRadius: 0, flex: 1}}>
            <table className="qa-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequirements.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign: 'center', color: '#a0a3b1'}}>No requirements found.</td></tr>
                ) : recentRequirements.map(r => (
                  <tr key={r.id}>
                    <td style={{fontWeight: 500, maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.title}>{r.title}</td>
                    <td>{r.module}</td>
                    <td><span className={formatBadge(r.status)}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 5: ACTION ITEMS OVERVIEW */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <CheckCircle2 size={20} color="#3b82f6" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Pending Action Items</h3>
      </div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card trendy-glass">
          <div className="chart-header-row">
             <LayoutGrid color="#3b82f6" size={18}/>
             <h4>Action Items by Status</h4>
          </div>
          <div className="chart-content">
            {actionStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={actionStatusData} innerRadius={70} outerRadius={100} dataKey="value" stroke="none" paddingAngle={5}>
                    {actionStatusData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 18, 22, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{color: '#a0a3b1'}}>No pending action items.</p>
            )}
          </div>
        </div>
        
        <div className="trendy-glass table-widget">
          <div className="widget-header">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <CheckCircle2 size={18} color="#3b82f6" />
              <h4>Upcoming Action Items</h4>
            </div>
            <a onClick={() => navigate('/minutes')}>View all →</a>
          </div>
          <div className="qa-table-container" style={{border: 'none', borderRadius: 0, flex: 1}}>
            <table className="qa-table">
              <thead>
                <tr>
                  <th>Action Item</th>
                  <th>Meeting</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {pendingActions.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign: 'center', color: '#a0a3b1'}}>No pending action items found.</td></tr>
                ) : pendingActions.slice(0, 5).map((pa, idx) => (
                  <tr key={idx}>
                    <td style={{maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={pa.task}>{pa.task}</td>
                    <td><a onClick={() => navigate(\`/minutes/tracker/\${pa.momId}\`)} style={{color: '#3b82f6', cursor: 'pointer', textDecoration: 'none'}}>{pa.meeting}</a></td>
                    <td>{pa.dueDate || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
`;

const startIndex = content.indexOf('{/* SECTION 1: ENTIRE PROJECT GRAPHS */}');
if (startIndex !== -1) {
  content = content.substring(0, startIndex) + remainingSections;
} else {
  console.log("Could not find SECTION 1");
}

fs.writeFileSync('src/pages/Dashboard.jsx', content);
console.log('Restructured Dashboard.jsx successfully');
