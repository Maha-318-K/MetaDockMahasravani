import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Trash2, History, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Extract unique roles from the users array (flattening arrays since roles can be multiple) and merge with defaults
  const uniqueRoles = [...new Set(['Admin', 'Manager', 'Employee', ...users.flatMap(u => Array.isArray(u.role) ? u.role : [u.role]).filter(Boolean)])].sort();
  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : {};
  const [currentRole] = useState(loggedInUser.role || 'User');
  const [currentName] = useState(loggedInUser.name || 'You');
  const [showLogsModal, setShowLogsModal] = useState(null);
  const [showProjectsHover, setShowProjectsHover] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchActionLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/v1/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActionLogs = async () => {
    try {
      const response = await fetch('/api/v1/users/logs/action-history');
      const data = await response.json();
      if (data.success) {
        setActionLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterRole: currentRole,
          requesterName: currentName
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchActionLogs();
      } else {
        alert(data.error || 'Failed to delete user due to permissions.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting.');
    }
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`/api/v1/users/${user.id || user._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          requesterName: currentName
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchActionLogs();
      }
    } catch (error) {
      console.error('Status toggle error:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === '' || (Array.isArray(user.role) ? user.role.includes(roleFilter) : user.role === roleFilter);
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);



  return (
    <div className="users-page">
      


      <div className="users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '8px', textTransform: 'uppercase' }}>Users Management</div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1F2328', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Users</h2>
          <p style={{ color: '#6E6E73', fontSize: '1.05rem', margin: 0 }}>Manage all system users.</p>
        </div>
      </div>

      <div className="users-toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ width: '350px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search Users..." 
              value={searchQuery}
              onChange={handleSearch}
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '36px' }}
            />
          </div>
          <div className="page-select-wrapper" style={{ position: 'relative' }}>
            <select 
              className="rows-select" 
              value={roleFilter} 
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              style={{ paddingRight: '24px', appearance: 'none' }}
            >
              <option value="">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a0a3b1' }} />
          </div>
          <div className="page-select-wrapper" style={{ position: 'relative' }}>
            <select 
              className="rows-select" 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ paddingRight: '24px', appearance: 'none' }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a0a3b1' }} />
          </div>
        </div>
        <button className="create-user-btn" onClick={() => navigate('/users/create')}>
          <Plus size={16} />
          Create User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Emp ID</th>
              <th>Phone Number</th>
              <th>Role</th>
              <th>Projects</th>
              <th>Status</th>
              <th className="action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading users...</td></tr>
            ) : currentUsers.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found.</td></tr>
            ) : (
              currentUsers.map((user, idx) => (
                <tr key={user.id || user._id}>
                  <td>{indexOfFirstUser + idx + 1}</td>
                  <td>
                    <div className="user-name-cell">
                      <img src={user.avatar ? user.avatar.replace(/7A2434|3b1820|5D1825|8B4513/gi, '16A34A') : ''} alt={user.name} className="user-avatar" />
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td className="emp-id-text">{user.empId}</td>
                  <td>{user.phoneNumber ? `${user.phoneCode || '+91'} ${user.phoneNumber}` : 'N/A'}</td>
                  <td>
                    {Array.isArray(user.role) && user.role.length > 0 ? (
                      user.role.map(r => (
                        <span key={r} style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginRight: '4px', display: 'inline-block', marginBottom: '4px' }}>
                          {r}
                        </span>
                      ))
                    ) : (
                      <span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                        {user.role || 'Employee'}
                      </span>
                    )}
                  </td>
                  <td>
                    {Array.isArray(user.projects) && user.projects.length > 0 ? (
                      <div 
                        style={{ position: 'relative', display: 'inline-block' }}
                        onMouseEnter={() => setShowProjectsHover(user.id || user._id)} 
                        onMouseLeave={() => setShowProjectsHover(null)}
                      >
                        {user.projects.slice(0, 3).map((p, i) => (
                          <span key={i} style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginRight: '4px', display: 'inline-block', marginBottom: '4px' }}>
                            {p}
                          </span>
                        ))}
                        {user.projects.length > 3 && (
                          <span style={{ color: '#16A34A', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                            +{user.projects.length - 3} more
                          </span>
                        )}
                        {showProjectsHover === (user.id || user._id) && user.projects.length > 3 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: 'max-content', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {user.projects.map((p, idx) => (
                              <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>• {p}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No projects</span>
                    )}
                  </td>
                  <td>
                    <div 
                      className={`status-pill ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => toggleUserStatus(user)}
                      style={{ cursor: 'pointer', display: 'inline-block', padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${user.status === 'Active' ? '#10b981' : '#ef4444'}`, color: user.status === 'Active' ? '#10b981' : '#ef4444', backgroundColor: user.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
                      title="Click to toggle status"
                    >
                      {user.status || 'Active'}
                    </div>
                  </td>
                  <td className="action-col">
                    <div className="action-buttons">
                      {(currentRole === 'Admin' || currentRole === 'Super Admin') && (
                        <button className="action-btn" onClick={() => navigate(`/users/edit/${user.id || user._id}`)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button className="action-btn" onClick={() => navigate(`/users/${user.id || user._id}`)} title="View">
                        <ArrowRight size={16} />
                      </button>
                      <div 
                        style={{ position: 'relative', display: 'inline-block' }}
                        onMouseEnter={() => setShowLogsModal(user.id || user._id)} 
                        onMouseLeave={() => setShowLogsModal(null)}
                      >
                        <button className="action-btn" title="Action History" style={{ color: '#16A34A' }}>
                          <History size={16} />
                        </button>
                        
                        {showLogsModal === (user.id || user._id) && (
                          <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '12px', background: 'var(--bg-main)', width: '350px', maxHeight: '250px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', cursor: 'default' }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                              <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem' }}>Action History</h4>
                            </div>
                            <div style={{ padding: '12px', overflowY: 'auto', flex: 1, textAlign: 'left' }}>
                              {actionLogs.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>No actions recorded yet.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {actionLogs.map(log => (
                                    <div key={log.id} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 600, color: '#16A34A', fontSize: '0.8rem' }}>{log.what}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                      </div>
                                      <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-main)' }}>{log.why}</p>
                                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {log.who}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {(currentRole === 'Admin' || currentRole === 'Super Admin') && (
                        <button className="action-btn" onClick={() => handleDelete(user.id || user._id)} title="Delete" style={{ color: '#ef4444' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="users-footer">
        <div className="rows-per-page">
          <span>Rows per page:</span>
          <div className="page-select-wrapper">
            <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="rows-select">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <span className="showing-text">
            Showing {filteredUsers.length === 0 ? 0 : indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
          </span>
        </div>
        
        <div className="pagination">
          <button 
            className="page-btn" 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1 || totalPages === 0}
          >
            <ChevronLeft size={16} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button 
              key={i + 1} 
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button 
            className="page-btn" 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Users;
