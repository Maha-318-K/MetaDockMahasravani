import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const q = queryParams.get('q') || '';

  const [results, setResults] = useState({ users: [], projects: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, projectsRes] = await Promise.all([
          fetch('/api/v1/users'),
          fetch('/api/v1/projects')
        ]);
        
        const usersData = await usersRes.json();
        const projectsData = await projectsRes.json();

        const filteredUsers = (usersData.data || []).filter(u => 
          u.name?.toLowerCase().includes(q.toLowerCase()) || 
          u.empId?.toLowerCase().includes(q.toLowerCase())
        );

        const filteredProjects = (projectsData.data || []).filter(p => 
          p.name?.toLowerCase().includes(q.toLowerCase()) || 
          p.description?.toLowerCase().includes(q.toLowerCase())
        );

        setResults({ users: filteredUsers, projects: filteredProjects });
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [q]);

  return (
    <div className="page-content" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}>
        <SearchIcon size={24} /> Search Results for "{q}"
      </h2>
      
      {loading ? (
        <p style={{ marginTop: '20px', color: '#6b7280' }}>Searching...</p>
      ) : (
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <section>
            <h3 style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', color: '#374151' }}>
              Users ({results.users.length})
            </h3>
            {results.users.length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0, marginTop: '15px' }}>
                {results.users.map(u => (
                  <li key={u._id || u.empId} style={{ padding: '15px', backgroundColor: '#f9fafb', marginBottom: '10px', borderRadius: '6px' }}>
                    <Link to={`/users/${u.empId}`} style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '600', fontSize: '16px' }}>
                      {u.name} ({u.empId})
                    </Link> 
                    <div style={{ marginTop: '5px', color: '#4b5563', fontSize: '14px' }}>{u.designation}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#9ca3af', marginTop: '10px' }}>No users found.</p>
            )}
          </section>

          <section>
            <h3 style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', color: '#374151' }}>
              Projects ({results.projects.length})
            </h3>
            {results.projects.length > 0 ? (
              <ul style={{ listStyleType: 'none', padding: 0, marginTop: '15px' }}>
                {results.projects.map(p => (
                  <li key={p._id || p.id} style={{ padding: '15px', backgroundColor: '#f9fafb', marginBottom: '10px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827' }}>{p.name}</div>
                    <div style={{ marginTop: '5px', color: '#4b5563', fontSize: '14px' }}>{p.description || 'No description provided'}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#9ca3af', marginTop: '10px' }}>No projects found.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Search;
