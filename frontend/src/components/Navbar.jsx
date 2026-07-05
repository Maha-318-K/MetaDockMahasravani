import React, { useState, useContext, useEffect, useRef } from 'react';
import './Navbar.css';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown,
  Folder,
  LogOut,
  User,
  Sun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectContext } from '../context/ProjectContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { projects, activeProject, setActiveProject } = useContext(ProjectContext);
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [issuesRes, reqsRes] = await Promise.all([
          fetch('/api/v1/issues'),
          fetch('/api/v1/requirements')
        ]);
        const issuesData = await issuesRes.json();
        const reqsData = await reqsRes.json();

        let notifs = [];
        
        if (issuesData.success) {
          notifs = [...notifs, ...issuesData.data.slice(0, 2).map(i => ({
            id: i.id,
            title: `Issue reported: ${i.issue || i.pageName}`,
            time: i.raisedDate || 'Recently',
            type: 'issue',
            read: false,
            link: '/issues'
          }))];
        }

        if (reqsData.success) {
          notifs = [...notifs, ...reqsData.data.slice(0, 2).map(r => ({
            id: r.id,
            title: `Requirement updated: ${r.title}`,
            time: r.createdAt || 'Recently',
            type: 'requirement',
            read: false,
            link: '/requirements'
          }))];
        }

        setNotifications(notifs.slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const handleNotificationClick = (index, link) => {
    setNotifications(prev => {
      const newNotifs = [...prev];
      newNotifs[index].read = true;
      return newNotifs;
    });
    setShowNotifDropdown(false);
    if (link) navigate(link);
  };

  const markAllAsRead = (e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-left">
     
        <div className="mockup-search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search anything in MetaDoc..." />
          <div className="search-shortcut">⌘ K</div>
        </div>
      </div>
      
      <div className="navbar-right">

        
        <div className="nav-actions">

          <div className="notif-wrapper" ref={notifRef}>
            <button className="icon-btn" onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
            }}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            {showNotifDropdown && (
              <div className="dropdown-menu notif-dropdown">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '16px' }}>
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer', fontWeight: '500' }} onClick={markAllAsRead}>Mark all as read</span>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div className="notif-item" key={i} onClick={() => handleNotificationClick(i, n.link)} style={{ opacity: n.read ? 0.6 : 1, background: n.read ? '#f9f9f9' : '#fff' }}>
                        <span className="notif-dot" style={{ backgroundColor: n.read ? '#ccc' : (n.type === 'issue' ? '#ef4444' : '#3b82f6') }}></span>
                        <div className="notif-content">
                          <p>{n.title}</p>
                          <small>{n.time}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="notif-item">
                      <div className="notif-content">
                        <p>No new notifications</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="user-profile-wrapper" ref={profileRef}>
          <div className="user-profile" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <div className="avatar">
              <img src={user?.avatar ? user.avatar.replace(/7A2434|3b1820|5D1825|8B4513|16A34A/gi, '29251C') : "https://ui-avatars.com/api/?name=User&background=29251C&color=fff"} alt="User Avatar" />
            </div>
            <div className="user-info">
              <span className="user-id">{user?.empId || 'EMP0000'}</span>
              <span className="user-name">{user?.name || 'Guest'}</span>
            </div>
            <ChevronDown size={14} className="chevron" />
          </div>

          {showProfileDropdown && (
            <div className="dropdown-menu profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar">
                  <img src={user?.avatar ? user.avatar.replace(/7A2434|3b1820|5D1825|8B4513|16A34A/gi, '29251C') : "https://ui-avatars.com/api/?name=User&background=29251C&color=fff"} alt="Avatar" />
                </div>
                <div className="profile-details">
                  <strong>{user?.name || 'Guest User'}</strong>
                  <span>{user?.empId || 'EMP0000'}</span>
                </div>
              </div>
              <div className="profile-meta">
                <div className="meta-row">
                  <User size={14} /> <span>{user?.role || 'User'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Designation:</span> <span>{user?.designation || 'Employee'}</span>
                </div>
              </div>
              <div className="profile-footer">
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
