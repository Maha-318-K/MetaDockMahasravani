import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, Phone, Briefcase, ChevronRight, Activity, Shield } from 'lucide-react';
import './CreateUser.css'; // Re-use styling

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/v1/users/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setUser(data.data);
        } else {
          alert('User not found');
          navigate('/users');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  if (loading) return <div style={{ padding: '32px', color: 'var(--text-main)' }}>Loading user details...</div>;
  if (!user) return null;

  return (
    <div className="create-user-page">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/users">Users & Roles</Link>
        <ChevronRight size={14} className="crumb-icon" />
        <Link to="/users">Users</Link>
        <ChevronRight size={14} className="crumb-icon" />
        <span className="current">User Profile</span>
      </div>

      <div className="create-header">
        <div>
          <h2>User Profile</h2>
          <p>View complete details and access rights for {user.name}.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="submit-btn" onClick={() => navigate(`/users/edit/${user.id || user._id}`)} style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Edit2 size={16} /> Edit User
          </button>
          <button 
            className="back-btn"
            onClick={() => navigate('/users')}
          >
            <ArrowLeft size={16} /> Back to Users
          </button>
        </div>
      </div>

      <div className="create-form-card" style={{ display: 'flex', gap: '32px' }}>
        
        {/* Left Col: Avatar & Basic */}
        <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '32px' }}>
          <img 
            src={user.avatar ? user.avatar.replace(/7A2434|3b1820|5D1825|8B4513/gi, '16A34A') : `https://i.pravatar.cc/150?u=${user.id}`} 
            alt={user.name} 
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} 
          />
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>{user.name}</h3>
            <p style={{ margin: 0, color: '#16A34A', fontWeight: 600 }}>{user.designation}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem' }}>{user.role || 'User'}</span>
            <span style={{ 
              background: user.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
              color: user.status === 'Active' ? '#10b981' : '#ef4444', 
              padding: '4px 12px', 
              borderRadius: '16px', 
              fontSize: '0.8rem',
              border: `1px solid ${user.status === 'Active' ? '#10b981' : '#ef4444'}`
            }}>
              {user.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Right Col: Details Grid */}
        <div style={{ flex: 1 }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '24px', fontWeight: 900, color: '#16A34A' }}>Contact Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}><Shield size={20} color="#a0a3b1" /></div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#a0a3b1' }}>Employee ID</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#000000' }}>{user.empId}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}><Mail size={20} color="#a0a3b1" /></div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#a0a3b1' }}>Email Address (Office)</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#000000' }}>{user.email || 'Not provided'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}><Phone size={20} color="#a0a3b1" /></div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#a0a3b1' }}>Phone Number</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#000000' }}>{user.phoneNumber ? `${user.phoneCode || '+91'} ${user.phoneNumber}` : 'Not provided'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}><Briefcase size={20} color="#a0a3b1" /></div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#a0a3b1' }}>Assigned Projects</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#000000' }}>{user.projects || 'Evergreen Farms'}</p>
              </div>
            </div>
          </div>
          
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', margin: '32px 0 24px 0', fontWeight: 900, color: '#16A34A' }}>Activity Overview</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Activity size={24} color="#10b981" />
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#10b981' }}>Account Status is Healthy</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#a0a3b1' }}>This user last logged in recently and has active permissions across their assigned projects.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDetails;

