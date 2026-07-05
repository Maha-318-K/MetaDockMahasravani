import React, { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import './SystemSettings.css';

const SystemSettings = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/v1/settings');
      const data = await res.json();
      if (data.success) {
        setAdminEmail(data.data.adminEmail || '');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage(data.message || 'Failed to save settings');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="system-settings-container">
      <div className="settings-header">
        <h2><Settings size={28} /> System Settings</h2>
        <p>Manage application-wide configurations.</p>
      </div>

      <div className="settings-card">
        {message && (
          <div className={`alert ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Contact Administrator Email</label>
            <input 
              type="email" 
              value={adminEmail} 
              onChange={(e) => setAdminEmail(e.target.value)} 
              placeholder="e.g. admin@metadock.com"
              required
            />
            <small>This email is displayed on the Login page for users who need help.</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={isLoading}>
              <Save size={18} />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;
