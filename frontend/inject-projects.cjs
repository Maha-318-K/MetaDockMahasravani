const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// 1. Update useContext
content = content.replace(
  'const { activeProject } = React.useContext(ProjectContext);',
  'const { projects, activeProject } = React.useContext(ProjectContext);'
);

// 2. Add Project data logic right before the return statement
const projectDataLogic = `
  // --- PROJECT STATUS DATA ---
  const projectStatusCount = {};
  if (projects && projects.length > 0) {
    projects.forEach(p => {
      const s = p.status || 'Unknown';
      projectStatusCount[s] = (projectStatusCount[s] || 0) + 1;
    });
  }
  const projectStatusColors = {
    'Planning': '#3b82f6',
    'In Progress': '#22c55e',
    'In Review': '#a855f7',
    'On Hold': '#f59e0b',
    'Completed': '#6366f1',
    'Cancelled': '#ef4444'
  };
  const projectStatusData = Object.keys(projectStatusCount).map(k => ({
    name: k,
    value: projectStatusCount[k],
    color: projectStatusColors[k] || '#a0a3b1'
  }));
  
  const recentProjects = (projects || []).sort((a,b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())).slice(0, 5);
`;
content = content.replace('return (', projectDataLogic + '\n  return (');

// 3. Insert the new section below KPI grid and before SECTION 1
const newSection = `
      {/* SECTION 0: PROJECTS OVERVIEW */}
      <div className="dashboard-section-title" style={{marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <LayoutGrid size={20} color="#16A34A" />
        <h3 style={{color: '#fff', fontSize: '18px', margin: 0}}>Projects Overview</h3>
      </div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Left: Project Status Pie Chart */}
        <div className="chart-card trendy-glass">
          <div className="chart-header-row">
             <PieChartIcon color="#3b82f6" size={18}/>
             <h4>Projects by Status</h4>
          </div>
          <div className="chart-content">
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={projectStatusData} innerRadius={70} outerRadius={100} dataKey="value" stroke="none" paddingAngle={5}>
                    {projectStatusData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(17, 18, 22, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} itemStyle={{color: '#fff'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{color: '#a0a3b1'}}>No projects data available.</p>
            )}
          </div>
        </div>
        
        {/* Right: Recent Projects */}
        <div className="trendy-glass table-widget">
          <div className="widget-header">
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Activity size={18} color="#16A34A" />
              <h4>Recent Project Updates (Top 5)</h4>
            </div>
            <a onClick={() => navigate('/projects')}>View Projects →</a>
          </div>
          <div className="qa-table-container" style={{border: 'none', borderRadius: 0, flex: 1}}>
            <table className="qa-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign: 'center', color: '#a0a3b1'}}>No recent projects.</td></tr>
                ) : recentProjects.map(p => (
                  <tr key={p.id || p._id}>
                    <td style={{fontWeight: 500, color: '#fff'}}>{p.name}</td>
                    <td style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#a0a3b1'}} title={p.description}>{p.description || 'N/A'}</td>
                    <td><span className={\`badge-status-\${(p.status || 'planning').toLowerCase().replace(' ', '')}\`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
      
      {/* SECTION 1: ENTIRE PROJECT GRAPHS */}
`;

// Wait, Recharts doesn't export PieChartIcon, I need to use another icon from lucide-react. Let's use `LayoutGrid` or `PieChart` imported from lucide-react (wait, PieChart is from recharts. Lucide has PieChart too, but it might conflict).
// Let's use `Activity` or `Folder` for the icon instead.
content = content.replace('<PieChartIcon', '<LayoutGrid');

content = content.replace('{/* SECTION 1: ENTIRE PROJECT GRAPHS */}', newSection);

fs.writeFileSync('src/pages/Dashboard.jsx', content);
console.log('Injected Projects Overview section successfully.');
