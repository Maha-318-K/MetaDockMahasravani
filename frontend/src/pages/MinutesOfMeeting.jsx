import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Calendar, Users, Eye, MoreVertical, ChevronLeft, ChevronRight, X, Trash2, FileText, Table, Edit } from 'lucide-react';
import { parseMomNotes } from '../utils/momParser';
import './MinutesOfMeeting.css';
import { ProjectContext } from '../context/ProjectContext';

const MinutesOfMeeting = () => {
  const { activeProject } = React.useContext(ProjectContext);
  const [meetings, setMeetings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Modal States
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedTableMeeting, setSelectedTableMeeting] = useState(null);

  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [drafts, setDrafts] = useState([]);

  // Action Menu State
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
    fetchUsers();

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDraftsModal) {
      setDrafts(JSON.parse(localStorage.getItem('mom-drafts') || '[]'));
    }
  }, [showDraftsModal]);

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/v1/mom');
      const data = await response.json();
      if (data.success) {
        setMeetings(data.data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.success) {
        setUsersList(data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;

    try {
      const response = await fetch(`/api/v1/mom/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setMeetings(prev => prev.filter(m => m.id !== id));
        setActiveMenu(null);
      } else {
        alert('Failed to delete meeting.');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const handleDeleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem('mom-drafts', JSON.stringify(updated));
  };

  const handleView = (meeting) => {
    setSelectedMeeting(meeting);
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleTableView = (meeting) => {
    navigate(`/minutes/tracker/${meeting.id}`);
  };



  // Filter implementation based on search and date
  const filteredMeetings = meetings.filter(m => {
    if (activeProject !== 'All' && m.project !== activeProject && m.module !== activeProject) return false;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = m.agendaTitle.toLowerCase().includes(searchLower) ||
      (m.agendaSubtitle || '').toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (selectedDate) {
      const meetingDate = new Date(m.date);
      const filterDate = new Date(selectedDate);
      if (!isNaN(meetingDate.getTime()) && !isNaN(filterDate.getTime())) {
        matchesDate = meetingDate.toDateString() === filterDate.toDateString();
      }
    }

    return matchesSearch && matchesDate;
  });

  // Pagination Logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredMeetings.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredMeetings.length / rowsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="mom-page">
      <div className="mom-header">
        <div>
          <h2>Minutes of Meeting</h2>
          <p>View and manage all minutes of meeting.</p>
        </div>
      </div>

      <div className="mom-toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ width: '350px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search Meeting by Agenda"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '36px' }}
            />
          </div>
          <div
            className="date-filter-box"
            style={{ display: 'flex', alignItems: 'center', background: 'transparent', borderRadius: '6px', padding: '8px 12px', border: '1px solid var(--border-strong)', cursor: 'pointer' }}
            onClick={(e) => {
              const input = document.getElementById('mom-date-picker');
              if (input && input.showPicker) {
                input.showPicker();
              }
            }}
          >
            <Calendar size={16} style={{ color: '#d8b818ff', marginRight: '8px' }} />
            <input
              id="mom-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            />
            {selectedDate && (
              <button
                onClick={() => { setSelectedDate(''); setCurrentPage(1); }}
                style={{ background: 'transparent', border: 'none', color: '#a0a3b1', cursor: 'pointer', marginLeft: '8px', display: 'flex', alignItems: 'center' }}
                title="Clear date filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="create-mom-btn" style={{ backgroundColor: '#2d3345', color: '#fff' }} onClick={() => setShowDraftsModal(true)}>
            Drafts
          </button>
          <button className="create-mom-btn" onClick={() => navigate('/minutes/create')}>
            <Plus size={16} />
            Create Minutes
          </button>
        </div>
      </div>

      <div className="mom-table-container">
        <table className="mom-table">
          <thead>
            <tr>
              <th>Date & Time </th>
              <th>Agenda</th>
              <th>Points Count</th>
              <th>Prepared By</th>
              <th>Attendees</th>
              <th className="action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : filteredMeetings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px' }}>
                  <div className="empty-state">
                    <FileText size={48} className="empty-icon" />
                    <h3>No Meetings Found</h3>
                    <p>We couldn't find any minutes of meeting matching your search.</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentRows.map((meeting) => (
                <tr key={meeting.id}>
                  <td>
                    <div className="date-time-cell">
                      <Calendar size={18} className="cell-icon" style={{ color: 'var(--text-main)' }} />
                      <div>
                        <div className="date-text">{meeting.date}</div>
                        <div className="time-text">{meeting.time}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="agenda-cell">
                      <div className="agenda-title">{meeting.agendaTitle}</div>
                      <div className="agenda-subtitle">{meeting.agendaSubtitle}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="points-badge" title="Total Points">{meeting.pointsCount}</span>
                      <span title="Open Points" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600' }}>
                        {meeting.openCount || 0} Open
                      </span>
                      <span title="In Progress Points" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600' }}>
                        {meeting.inProgressCount || 0} In Prog
                      </span>
                      <span title="Completed Points" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600' }}>
                        {meeting.closedCount || 0} closed
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="prepared-by-cell">
                      <div>
                        <div className="user-name">{meeting.preparedBy.name}</div>
                        <div className="user-id">
                          {usersList.find(u => u.name === meeting.preparedBy.name)?.empId || meeting.preparedBy.empId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="attendees-cell" title={(meeting.attendeesList || []).join(', ')}>
                      <Users size={16} className="cell-icon" />
                      <span style={{ borderBottom: '1px dashed #a0a3b1', cursor: 'help' }}>{meeting.attendees} Attendees</span>
                    </div>
                  </td>
                  <td className="action-col">
                    <div className="action-buttons">
                      <button className="action-btn" title="View Notes" onClick={() => handleView(meeting)}>
                        <Eye size={16} />
                      </button>
                      <button className="action-btn text-orange" title="View Points Table" onClick={() => handleTableView(meeting)}>
                        <Table size={16} />
                      </button>
                      <div className="action-menu-wrapper" ref={activeMenu === meeting.id ? menuRef : null}>
                        <button
                          className="action-btn"
                          title="More"
                          onClick={() => setActiveMenu(activeMenu === meeting.id ? null : meeting.id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenu === meeting.id && (
                          <div className="action-dropdown">
                            <button className="action-dropdown-item" onClick={() => handleDelete(meeting.id)}>
                              <span style={{ color: '#000000', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                <Trash2 size={14} color="#000000" />
                                Delete
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mom-footer">
        <div className="footer-left">
          <span className="showing-text">
            Showing {filteredMeetings.length === 0 ? 0 : indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredMeetings.length)} of {filteredMeetings.length} entries
          </span>
          <div className="rows-per-page">
            <select
              className="rows-select"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 Rows</option>
              <option value={10}>10 Rows</option>
              <option value={20}>20 Rows</option>
            </select>
          </div>
        </div>

        <div className="pagination">
          <button className="page-btn" onClick={handlePrevPage} disabled={currentPage === 1}><ChevronLeft size={16} /></button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button className="page-btn" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Trendy View Modal */}
      {showModal && selectedMeeting && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glassmorphism" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMeeting.agendaTitle}</h3>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-meta">
                <div className="meta-item">
                  <Calendar size={14} className="text-orange" />
                  <span>{selectedMeeting.date} at {selectedMeeting.time}</span>
                </div>
                <div className="meta-item">
                  <Users size={14} className="text-orange" />
                  <span>{selectedMeeting.attendees} Attendees</span>
                </div>
              </div>
              <div className="modal-notes">
                <h4>Meeting Notes <span className="points-badge small">{selectedMeeting.pointsCount} Points</span></h4>
                <div className="notes-text">
                  {selectedMeeting.notes ? selectedMeeting.notes.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  )) : <p className="text-gray">No notes recorded.</p>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn-dark" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Table View Modal */}
      {showTableModal && selectedTableMeeting && (
        <div className="modal-overlay" onClick={() => setShowTableModal(false)}>
          <div className="modal-content glassmorphism" style={{ maxWidth: '900px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTableMeeting.agendaTitle} - Points Table</h3>
              <button className="close-modal-btn" onClick={() => setShowTableModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Point #</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Page Name</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>Issue Text</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTableMeeting.notes ? parseMomNotes(selectedTableMeeting.notes).map((point, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <td style={{ padding: '12px', verticalAlign: 'top', width: '80px', color: '#16A34A' }}>{point.index}</td>
                      <td style={{ padding: '12px', verticalAlign: 'top', fontWeight: 'bold' }}>{point.pageName}</td>
                      <td style={{ padding: '12px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{point.issueText}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" style={{ padding: '12px', textAlign: 'center' }}>No notes found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn-dark" onClick={() => setShowTableModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts Modal */}
      {showDraftsModal && (
        <div className="modal-overlay" onClick={() => setShowDraftsModal(false)}>
          <div className="modal-content glassmorphism" style={{ maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Saved Drafts</h3>
              <button className="close-modal-btn" onClick={() => setShowDraftsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {drafts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#a0a3b1' }}>
                  <p>No drafts saved.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {drafts.map(draft => (
                    <div key={draft.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)' }}>{draft.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#a0a3b1' }}>Drafted: {draft.date}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="action-btn text-orange"
                          onClick={() => navigate('/minutes/create', { state: { draftId: draft.id } })}
                          title="Edit Draft"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn text-red"
                          onClick={() => handleDeleteDraft(draft.id)}
                          title="Delete Draft"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn-dark" onClick={() => setShowDraftsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MinutesOfMeeting;

