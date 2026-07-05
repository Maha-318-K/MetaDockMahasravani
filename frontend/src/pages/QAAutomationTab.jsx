import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Calendar, 
  Edit2, MoreVertical, Activity, Clock, 
  CheckCircle, CheckSquare, ChevronRight, X, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './QAIssuesManagement.css';

const QAAutomationTab = () => {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add Record Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({ project: 'Evergreen Farms', module: '', pageName: '', totalTestCases: '', automatedCases: '' });

  // Inline Editing
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/v1/automation');
      const data = await res.json();
      if (data.success) {
        setAutomations(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.module || !newRecord.pageName || !newRecord.totalTestCases) {
      alert("Please fill in the required fields (Module, Page, Total TC).");
      return;
    }
    try {
      const res = await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (res.ok) {
        fetchAutomations();
        setShowAddModal(false);
        setNewRecord({ project: 'Evergreen Farms', module: '', pageName: '', totalTestCases: '', automatedCases: '' });
      }
    } catch (err) {
      console.error("Failed to add automation record", err);
    }
  };

  const startEdit = (id, field, value) => {
    setEditingId(id);
    setEditingField(field);
    setEditingValue(value);
  };

  const saveEdit = async (id) => {
    setEditingId(null);
    setEditingField(null);
    try {
      await fetch(`/api/v1/automation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingField]: editingValue })
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to update record", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this automation record?")) return;
    try {
      await fetch(`/api/v1/automation/${id}`, { method: 'DELETE' });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to delete record", err);
    }
  };

  const filteredAutomations = automations.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      return (
        a.module.toLowerCase().includes(q) ||
        a.pageName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAutomations.length / itemsPerPage);
  const currentData = filteredAutomations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusClass = (status) => {
    if (status === 'Not Started') return 'badge-status-open';
    if (status === 'In Progress') return 'badge-status-inprogress';
    if (status === 'Completed') return 'badge-status-resolved';
    return 'badge-status-blocked';
  };

  const totalCases = automations.reduce((sum, a) => sum + (Number(a.totalTestCases) || 0), 0);
  const totalAutomated = automations.reduce((sum, a) => sum + (Number(a.automatedCases) || 0), 0);
  const avgCoverage = totalCases === 0 ? 0 : Math.round((totalAutomated / totalCases) * 100);

  return (
    <div className="qa-page">
      <div className="qa-breadcrumbs">
        <span>QA Workspace</span> {'>'} <span className="current">Automation Tracker</span>
      </div>
      
      <div className="qa-tabs">
        <button 
          className="qa-tab-btn"
          onClick={() => navigate('/qa-issues')}
        >
          Issues
        </button>
        <button 
          className="qa-tab-btn active"
          onClick={() => navigate('/qa-automation')}
        >
          Automation Tracker
        </button>
      </div>

      <div className="qa-metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="qa-metric-card">
          <div className="qa-metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Activity size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Total Modules/Pages</h4>
            <h2>{automations.length}</h2>
          </div>
        </div>
        <div className="qa-metric-card">
          <div className="qa-metric-icon" style={{ background: 'rgba(248, 171, 55, 0.1)', color: '#16A34A' }}>
            <CheckSquare size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Total Test Cases</h4>
            <h2>{totalCases}</h2>
          </div>
        </div>
        <div className="qa-metric-card">
          <div className="qa-metric-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <CheckCircle size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Automated Cases</h4>
            <h2>{totalAutomated}</h2>
          </div>
        </div>
        <div className="qa-metric-card">
          <div className="qa-metric-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <Clock size={20} />
          </div>
          <div className="qa-metric-content">
            <h4>Overall Coverage</h4>
            <h2>{avgCoverage}%</h2>
          </div>
        </div>
      </div>

      <div className="qa-toolbar">
        <div className="qa-search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by project, module, or page..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        
        <button className="qa-btn-primary" style={{marginLeft: 'auto'}} onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Automation Record
        </button>
      </div>

      <div className="qa-table-container" style={{overflowX: 'auto'}}>
        <table className="qa-table" style={{minWidth: '1000px'}}>
          <thead>
            <tr>
              <th>Module</th>
              <th>Page Name</th>
              <th>Total TC</th>
              <th>Automated</th>
              <th>Coverage</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{textAlign: 'center', padding: '30px'}}>Loading...</td></tr>
            ) : currentData.length === 0 ? (
              <tr><td colSpan="9" style={{textAlign: 'center', padding: '30px'}}>No records found.</td></tr>
            ) : (
              currentData.map((a) => {
                const cov = a.totalTestCases === 0 ? 0 : Math.round((a.automatedCases / a.totalTestCases) * 100);
                return (
                  <tr key={a.id}>
                    <td>{a.module}</td>
                    <td>{a.pageName}</td>
                    <td style={{textAlign: 'center'}}>
                      {editingId === a.id && editingField === 'totalTestCases' ? (
                        <input 
                          type="number" 
                          autoFocus 
                          value={editingValue} 
                          onChange={e => setEditingValue(e.target.value)} 
                          onBlur={() => saveEdit(a.id)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(a.id)}
                          style={{width: '60px', background: '#111216', border: '1px solid #3b82f6', color: '#fff', textAlign: 'center'}}
                        />
                      ) : (
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
                          <span style={{cursor: 'pointer'}} onDoubleClick={() => startEdit(a.id, 'totalTestCases', a.totalTestCases)} title="Double click to edit">{a.totalTestCases}</span>
                          <Edit2 size={12} color="#a0a3b1" style={{cursor: 'pointer'}} onClick={() => startEdit(a.id, 'totalTestCases', a.totalTestCases)} />
                        </div>
                      )}
                    </td>
                    <td style={{textAlign: 'center', color: '#16A34A'}}>
                      {editingId === a.id && editingField === 'automatedCases' ? (
                        <input 
                          type="number" 
                          autoFocus 
                          value={editingValue} 
                          onChange={e => setEditingValue(e.target.value)} 
                          onBlur={() => saveEdit(a.id)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(a.id)}
                          style={{width: '60px', background: '#111216', border: '1px solid #3b82f6', color: '#16A34A', textAlign: 'center'}}
                        />
                      ) : (
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
                          <span style={{cursor: 'pointer'}} onDoubleClick={() => startEdit(a.id, 'automatedCases', a.automatedCases)} title="Double click to edit">{a.automatedCases}</span>
                          <Edit2 size={12} color="#a0a3b1" style={{cursor: 'pointer'}} onClick={() => startEdit(a.id, 'automatedCases', a.automatedCases)} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{width: '35px', fontSize: '12px', textAlign: 'right'}}>{cov}%</span>
                        <div className="qa-progress-bar-bg">
                          <div className="qa-progress-bar-fill" style={{ width: `${cov}%`, background: cov === 100 ? '#22c55e' : '#16A34A' }}></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        className={`qa-inline-select ${getStatusClass(a.status)}`}
                        style={{ padding: '2px 4px', fontSize: '11px', fontWeight: 600, border: 'none', background: 'transparent', outline: 'none' }}
                        value={a.status}
                        onChange={async (e) => {
                          const val = e.target.value;
                          try {
                            await fetch(`/api/v1/automation/${a.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: val })
                            });
                            fetchAutomations();
                          } catch (err) {}
                        }}
                      >
                        <option value="Not Started" style={{color: 'var(--text-main)'}}>Not Started</option>
                        <option value="In Progress" style={{color: 'var(--text-main)'}}>In Progress</option>
                        <option value="Completed" style={{color: 'var(--text-main)'}}>Completed</option>
                        <option value="Blocked" style={{color: 'var(--text-main)'}}>Blocked</option>
                      </select>
                    </td>
                    <td style={{color: '#a0a3b1'}}>{a.lastUpdated}</td>
                    <td>
                      <div className="qa-actions-cell">
                        <div className="qa-action-icon" onClick={() => handleDelete(a.id)}><Trash2 size={14} color="#ef4444" /></div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="qa-footer">
          <div>Showing {(currentPage - 1) * itemsPerPage + (filteredAutomations.length > 0 ? 1 : 0)} to {Math.min(currentPage * itemsPerPage, filteredAutomations.length)} of {filteredAutomations.length} records</div>
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

      {showAddModal && (
        <div className="qa-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="qa-modal" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
            <div className="qa-modal-header">
              <h3>Add Automation Record</h3>
              <X size={20} className="qa-modal-close" onClick={() => setShowAddModal(false)} />
            </div>
            
            <div className="qa-comment-input">
              <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Module <span style={{color: '#ef4444'}}>*</span></label>
              <input 
                className="ci-input" 
                style={{marginBottom: '16px'}} 
                placeholder="e.g. POS"
                value={newRecord.module}
                onChange={e => setNewRecord({...newRecord, module: e.target.value})}
              />

              <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Page Name <span style={{color: '#ef4444'}}>*</span></label>
              <input 
                className="ci-input" 
                style={{marginBottom: '16px'}} 
                placeholder="e.g. Checkout"
                value={newRecord.pageName}
                onChange={e => setNewRecord({...newRecord, pageName: e.target.value})}
              />

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                <div>
                  <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Total Test Cases <span style={{color: '#ef4444'}}>*</span></label>
                  <input 
                    type="number"
                    className="ci-input" 
                    style={{marginBottom: '24px'}} 
                    value={newRecord.totalTestCases}
                    onChange={e => setNewRecord({...newRecord, totalTestCases: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '12px', color: '#a0a3b1', marginBottom: '8px'}}>Automated Cases</label>
                  <input 
                    type="number"
                    className="ci-input" 
                    style={{marginBottom: '24px'}} 
                    value={newRecord.automatedCases}
                    onChange={e => setNewRecord({...newRecord, automatedCases: e.target.value})}
                  />
                </div>
              </div>
              
              <button className="qa-btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={handleAddRecord}>Create Record</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QAAutomationTab;

