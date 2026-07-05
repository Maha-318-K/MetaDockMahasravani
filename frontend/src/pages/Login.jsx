import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.png';
import bgImg from '../assets/bg.png';
import './Login.css';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@metadock.com');
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmpId = localStorage.getItem('savedEmpId');
    if (savedEmpId) {
      setEmployeeId(savedEmpId);
      setRememberMe(true);
    }

    fetch('/api/v1/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.adminEmail) {
          setAdminEmail(data.data.adminEmail);
        }
      })
      .catch(err => console.error('Failed to fetch admin email:', err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId: employeeId || 'admin', password })
      });
      const data = await res.json();

      if (data.success) {
        if (rememberMe) {
          localStorage.setItem('savedEmpId', employeeId);
        } else {
          localStorage.removeItem('savedEmpId');
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout" style={{ backgroundImage: `url(${bgImg})` }}>
      <div className="glass-login-container">
        <div className="dark-glass-card">
          <div className="login-card-header">
            <img src={logoImg} alt="Meta Dock Logo" className="logo-img" />
            <h2>Welcome back</h2>
            <p>Sign in to your MetaDock account</p>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="field-wrapper">
              <label className="field-label">Employee ID</label>
              <div className="input-group">
                <span className="input-icon">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Enter your Emp ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field-wrapper">
              <label className="field-label">Password</label>
              <div className="input-group">
                <span className="input-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
                Remember me
              </label>
              <a href={`mailto:${adminEmail}?subject=Password Reset Request`} className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Signing In...' : (
                <>
                  Sign in <ArrowRight size={20} className="login-arrow-icon" />
                </>
              )}
            </button>
          </form>

          <div className="card-footer">
            New to MetaDock? <a href={`mailto:${adminEmail}`} className="contact-link">Contact your administrator</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
