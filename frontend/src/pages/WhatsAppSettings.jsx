import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './WhatsAppSettings.css';

const API_BASE = 'http://localhost:5000/api/v1/whatsapp';

export default function WhatsAppSettings() {
  const [statusData, setStatusData] = useState({ status: 'Disconnected', qrCode: null, monitoredGroups: [], lastSyncTime: null, lastProcessedMessageTime: null });
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingIssueGroup, setSavingIssueGroup] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedIssueGroup, setSelectedIssueGroup] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      setStatusData(data);
      if (data.issueDefaultGroup) {
        setSelectedIssueGroup(data.issueDefaultGroup);
      }
      if (data.status === 'Connected') {
        fetchGroups();
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/chats`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvailableGroups(data);
      } else {
        setAvailableGroups([]);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setAvailableGroups([]);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGroupToggle = (groupId) => {
    const updated = statusData.monitoredGroups.includes(groupId)
      ? statusData.monitoredGroups.filter(id => id !== groupId)
      : [...statusData.monitoredGroups, groupId];
    
    setStatusData(prev => ({ ...prev, monitoredGroups: updated }));
  };

  const saveGroups = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: statusData.monitoredGroups })
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save groups:', error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const saveIssueGroup = async () => {
    setSavingIssueGroup(true);
    try {
      await fetch(`${API_BASE}/issue-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedIssueGroup })
      });
      alert('Default issue alert group saved successfully!');
    } catch (error) {
      console.error('Failed to save issue group:', error);
      alert('Failed to save settings.');
    } finally {
      setSavingIssueGroup(false);
    }
  };

  const handleDisconnect = async () => {
    setShowDisconnectModal(false);
    try {
      await fetch(`${API_BASE}/disconnect`, { method: 'POST' });
      fetchStatus();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect.');
    }
  };

  return (
    <div className="whatsapp-settings-page">
      <div className="ws-header">
        <h1>WhatsApp Integration</h1>
        <p>Connect your WhatsApp account to automatically track production issues from groups.</p>
      </div>

      {loading ? (
        <div className="ws-loading"><Loader2 className="animate-spin" /> Loading status...</div>
      ) : (
        <div className="ws-content">
          <div className="ws-card">
            <h2>Connection Status</h2>
            <div className="ws-status-display" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {statusData.status === 'Connected' ? (
                  <div className="status-badge connected">
                    <CheckCircle size={24} />
                    <span>Connected</span>
                  </div>
                ) : statusData.status === 'Reconnecting' ? (
                  <div className="status-badge reconnecting">
                    <RefreshCw size={24} className="animate-spin" />
                    <span>Reconnecting...</span>
                  </div>
                ) : (
                  <div className="status-badge disconnected">
                    <XCircle size={24} />
                    <span>Disconnected</span>
                  </div>
                )}
              </div>
              
              {(statusData.status === 'Connected' || statusData.status === 'Reconnecting') && (
                <button onClick={() => setShowDisconnectModal(true)} className="ws-disconnect-btn">
                  Disconnect
                </button>
              )}
            </div>

            {statusData.status === 'Disconnected' && statusData.qrCode && (
              <div className="qr-section">
                <p>Scan this QR code with your WhatsApp app to link devices.</p>
                <div className="qr-code-wrapper">
                  <QRCodeSVG value={statusData.qrCode} size={200} />
                </div>
              </div>
            )}
            {statusData.status === 'Disconnected' && !statusData.qrCode && (
              <div className="qr-section" style={{ textAlign: 'center', padding: '30px 0' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px', color: '#a0a3b1' }} />
                <p style={{ color: '#a0a3b1', margin: 0 }}>Generating fresh QR Code... please wait</p>
              </div>
            )}
          </div>

          <div className="ws-card">
            <h2>Health Monitoring</h2>
            <div className="ws-health-grid">
              <div className="ws-health-item">
                <span className="ws-health-label">Last Sync Time</span>
                <span className="ws-health-value">
                  {statusData.lastSyncTime ? new Date(statusData.lastSyncTime).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="ws-health-item">
                <span className="ws-health-label">Last Processed Message</span>
                <span className="ws-health-value">
                  {statusData.lastProcessedMessageTime ? new Date(statusData.lastProcessedMessageTime).toLocaleString() : 'None'}
                </span>
              </div>
            </div>
          </div>

          <div className="ws-card">
            <h2>Group Monitoring</h2>
            <p>Select which WhatsApp groups to monitor for production issues.</p>
            {statusData.status !== 'Connected' ? (
              <div className="group-warning">
                Connect WhatsApp to view and configure monitored groups.
              </div>
            ) : availableGroups.length === 0 ? (
              <div className="group-warning">
                No groups found. Ensure the connected account is part of at least one group.
              </div>
            ) : (
              <div className="group-list">
                {availableGroups.map(group => (
                  <label key={group.id} className="group-item">
                    <input
                      type="checkbox"
                      checked={statusData.monitoredGroups.includes(group.id)}
                      onChange={() => handleGroupToggle(group.id)}
                    />
                    <span className="group-name">{group.name}</span>
                  </label>
                ))}
                <button 
                  className="save-btn" 
                  onClick={saveGroups} 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}
          </div>

          <div className="ws-card">
            <h2>Outgoing Messages Configuration</h2>
            <p>Select the default WhatsApp group where new issues or documents should be sent.</p>
            {statusData.status !== 'Connected' ? (
              <div className="group-warning">
                Connect WhatsApp to view and configure outgoing groups.
              </div>
            ) : availableGroups.length === 0 ? (
              <div className="group-warning">
                No groups found. Ensure the connected account is part of at least one group.
              </div>
            ) : (
              <div className="group-list" style={{ marginTop: '16px' }}>
                <select 
                  value={selectedIssueGroup} 
                  onChange={(e) => setSelectedIssueGroup(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}
                >
                  <option value="">-- Select a Group --</option>
                  {availableGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
                
                <button 
                  className="save-btn" 
                  onClick={saveIssueGroup} 
                  disabled={savingIssueGroup}
                >
                  {savingIssueGroup ? 'Saving...' : 'Save Alert Group'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showDisconnectModal && (
        <div className="ws-modal-overlay">
          <div className="ws-modal">
            <div className="ws-modal-icon">
              <AlertCircle size={32} color="#ef4444" />
            </div>
            <h3>Disconnect WhatsApp</h3>
            <p>Are you sure you want to disconnect? This will log you out immediately. A new QR code will be generated so you can connect again.</p>
            <div className="ws-modal-actions">
              <button className="ws-modal-cancel" onClick={() => setShowDisconnectModal(false)}>Cancel</button>
              <button className="ws-modal-confirm" onClick={handleDisconnect}>Yes, Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
