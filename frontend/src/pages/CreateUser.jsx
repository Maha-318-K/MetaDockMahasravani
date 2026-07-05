import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, UploadCloud, EyeOff, Eye, ChevronDown, CheckCircle, Search } from 'lucide-react';
import { ProjectContext } from '../context/ProjectContext';
import './CreateUser.css';

const SOFTWARE_ROLES = [
  'Admin', 'Manager', 'Employee', 
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 
  'UI/UX Designer', 'Product Manager', 'QA Engineer', 'DevOps Engineer', 
  'Data Scientist', 'Data Engineer', 'Machine Learning Engineer', 
  'Cloud Architect', 'Scrum Master', 'Business Analyst', 'Systems Administrator',
  'Technical Writer', 'Database Administrator', 'Security Analyst', 'Mobile Developer',
  'Engineering Manager', 'Tech Lead', 'Software Architect'
].sort();

const CreateUser = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  
  const projectsDropdownRef = useRef(null);
  const rolesDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectsDropdownRef.current && !projectsDropdownRef.current.contains(event.target)) {
        setShowProjectsDropdown(false);
      }
      if (rolesDropdownRef.current && !rolesDropdownRef.current.contains(event.target)) {
        setShowRolesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userStr = localStorage.getItem('user');
  const loggedInUser = userStr ? JSON.parse(userStr) : {};

  const [formData, setFormData] = useState({
    name: '',
    role: [],
    empId: '',
    email: '',
    designation: '',
    phoneCode: '+91',
    phoneNumber: '',
    projects: [],
    zohoMail: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Full Name is required';
        else if (!/^[a-zA-Z\s]*$/.test(value)) error = 'Name can only contain letters and spaces';
        break;
      case 'empId':
        if (!value.trim()) error = 'Employee ID is required';
        else if (!/^EMP[0-9]+$/.test(value)) error = 'Must start with EMP followed by numbers';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'phoneNumber':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^\d{10}$/.test(value)) error = 'Must be exactly 10 digits';
        break;
      case 'zohoMail':
        if (value.trim() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) error = 'Invalid email format';
        else if (value.trim() && !value.endsWith('zohomail.com') && !value.endsWith('zoho.com')) error = 'Must be a Zoho email address';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        else if (!/[A-Z]/.test(value)) error = 'Must contain at least one uppercase letter';
        else if (!/[a-z]/.test(value)) error = 'Must contain at least one lowercase letter';
        else if (!/[0-9]/.test(value)) error = 'Must contain at least one number';
        else if (!/[^A-Za-z0-9]/.test(value)) error = 'Must contain at least one special character';
        break;
      case 'role':
        if (!value || value.length === 0) error = 'Please select at least one role';
        break;
      case 'projects':
        if (!value || value.length === 0) error = 'Please select at least one project';
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'empId') {
      let val = value.toUpperCase();
      if (val.startsWith('EMP')) {
        val = val.substring(3);
      } else {
        val = val.replace(/^EMP|^EM|^E/, '');
      }
      const numericVal = val.replace(/\D/g, '');
      const formattedVal = numericVal ? 'EMP' + numericVal : 'EMP';

      setFormData(prev => ({ ...prev, [name]: formattedVal }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: validateField(name, formattedVal) }));
      }
      return;
    }

    if (name === 'phoneNumber') {
      const numericVal = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericVal }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: validateField(name, numericVal) }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'designation') {
        const err = validateField(key, formData[key]);
        if (err) newErrors[key] = err;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; 
    }

    setIsSubmitting(true);

    let finalAvatar = '';
    if (selectedFile) {
      const uploadData = new FormData();
      uploadData.append('files', selectedFile);
      try {
        const uploadRes = await fetch('/api/v1/upload', {
          method: 'POST',
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.urls && uploadResult.urls.length > 0) {
          finalAvatar = uploadResult.urls[0];
        }
      } catch (err) {
        console.error('File upload failed', err);
      }
    }

    try {
      const payload = {
        ...formData,
        avatar: finalAvatar,
        requestedBy: loggedInUser.name || 'System',
        requesterRole: loggedInUser.role || 'Admin'
      };

      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/users');
        }, 3000);
      } else {
        alert(data.error || 'Failed to create user. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedFileName(file.name);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const { projects: projectsList } = useContext(ProjectContext);

  const filteredRoles = SOFTWARE_ROLES.filter(r => r.toLowerCase().includes(roleSearchQuery.toLowerCase()));

  return (
    <div className="create-user-page">
      {showSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '48px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: '#DCFCE7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={48} color="#16A34A" />
            </div>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '28px', fontWeight: '800' }}>User Created Successfully!</h2>
            <p style={{ margin: 0, color: '#4B5563', fontSize: '16px' }}>The new user has been added to the system beautifully.</p>
            <p style={{ margin: 0, color: '#9CA3AF', fontSize: '14px', marginTop: '12px' }}>Redirecting to users list...</p>
          </div>
        </div>
      )}

      <div className="breadcrumbs">
        <Link to="/users">Users & Roles</Link>
        <ChevronRight size={14} className="crumb-icon" />
        <Link to="/users">Users</Link>
        <ChevronRight size={14} className="crumb-icon" />
        <span className="current">Create User</span>
      </div>

      <div className="create-header">
        <div>
          <h2>Create User</h2>
          <p style={{ color: '#16A34A' }}>Add a new user and manage their access to the system.</p>
        </div>
        <button
          onClick={() => navigate('/users')}
          style={{ background: 'transparent', border: '1px solid #16A34A', color: '#16A34A', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(22, 163, 74, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
      </div>

      <form className="create-form-card" onSubmit={handleSubmit}>
        <h3>User Information</h3>

        <div className="form-grid">
          {/* Full Name */}
          <div className="form-group">
            <label>Full Name <span className="req">*</span></label>
            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.name ? 'input-error' : ''}
              required
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          {/* Role */}
          <div className="form-group" ref={rolesDropdownRef}>
            <label>Role <span className="req">*</span></label>
            <div className="custom-multiselect">
              <div
                className={`multiselect-header ${errors.role ? 'input-error' : ''}`}
                onClick={() => setShowRolesDropdown(!showRolesDropdown)}
              >
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {formData.role.length === 0 ? (
                    <span style={{ color: '#9CA3AF' }}>Select roles...</span>
                  ) : (
                    formData.role.map(r => (
                      <span key={r} style={{ background: '#DEF7EC', color: '#03543F', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#03543F' }}>{r}</span>
                        <span
                          style={{ cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const newRoles = formData.role.filter(item => item !== r);
                            setFormData(prev => ({ ...prev, role: newRoles }));
                          }}
                        >×</span>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown size={16} className="select-icon" />
              </div>

              {showRolesDropdown && (
                <div className="multiselect-dropdown">
                  <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input 
                        type="text" 
                        placeholder="Search roles..." 
                        value={roleSearchQuery}
                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%', padding: '6px 8px 6px 28px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                  
                  {filteredRoles.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>No roles found</div>
                  ) : (
                    filteredRoles.map(r => {
                      const isSelected = formData.role.includes(r);
                      return (
                        <div
                          key={r}
                          className={`multiselect-option ${isSelected ? 'selected' : ''}`}
                          style={{
                            backgroundColor: isSelected ? 'rgba(8, 8, 8, 0.1)' : 'transparent',
                            padding: '10px 16px',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => { 
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = '#16A34A';
                              if(e.currentTarget.firstChild) e.currentTarget.firstChild.style.color = 'black';
                            }
                          }}
                          onMouseLeave={(e) => { 
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              if(e.currentTarget.firstChild) e.currentTarget.firstChild.style.color = '#111827';
                            }
                          }}
                          onClick={() => {
                            let newRoles;
                            if (isSelected) {
                              newRoles = formData.role.filter(item => item !== r);
                            } else {
                              newRoles = [...formData.role, r];
                            }
                            setFormData(prev => ({ ...prev, role: newRoles }));
                            if (errors.role) {
                              setErrors(prev => ({ ...prev, role: '' }));
                            }
                          }}
                        >
                          <span style={{ color: isSelected ? '#16A34A' : '#111827' }}>{r}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {errors.role ? (
              <span className="error-text">{errors.role}</span>
            ) : (
              <span className="helper-text">You can select multiple roles</span>
            )}
          </div>

          {/* Employee ID */}
          <div className="form-group">
            <label>Employee ID <span className="req">*</span></label>
            <input
              type="text"
              name="empId"
              placeholder="Enter employee ID"
              value={formData.empId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.empId ? 'input-error' : ''}
              required
            />
            {errors.empId && <span className="error-text">{errors.empId}</span>}
          </div>

          {/* Personal Mail ID */}
          <div className="form-group">
            <label>Personal Mail ID (Office Purpose) <span className="req">*</span></label>
            <input
              type="email"
              name="email"
              placeholder="Enter personal email ID"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.email ? 'input-error' : ''}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Designation */}
          <div className="form-group">
            <label>Designation</label>
            <input
              type="text"
              name="designation"
              placeholder="Enter designation"
              value={formData.designation}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label>Phone Number <span className="req">*</span></label>
            <div className={`phone-input-group ${errors.phoneNumber ? 'input-error' : ''}`}>
              <div className="country-code">
                <select name="phoneCode" value={formData.phoneCode} onChange={handleChange}>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <ChevronDown size={14} className="code-icon" />
              </div>
              <input
                type="text"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>
            {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>

          {/* Projects Working On */}
          <div className="form-group" ref={projectsDropdownRef}>
            <label>Projects Working On <span className="req">*</span></label>
            <div className="custom-multiselect">
              <div
                className={`multiselect-header ${errors.projects ? 'input-error' : ''}`}
                onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}
              >
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {formData.projects.length === 0 ? (
                    <span style={{ color: '#9CA3AF' }}>Select projects...</span>
                  ) : (
                    formData.projects.map(proj => (
                      <span key={proj} style={{ background: '#DEF7EC', color: '#03543F', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {proj}
                        <span
                          style={{ cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const newProjects = formData.projects.filter(p => p !== proj);
                            setFormData(prev => ({ ...prev, projects: newProjects }));
                          }}
                        >×</span>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown size={16} className="select-icon" />
              </div>

              {showProjectsDropdown && (
                <div className="multiselect-dropdown">
                  {projectsList.length === 0 ? (
                    <div className="multiselect-option-empty">
                      No projects available. Please create a project first.
                    </div>
                  ) : (
                    projectsList.map(p => {
                      const isSelected = formData.projects.includes(p.name);
                      return (
                        <div
                          key={p.id || p._id}
                          className={`multiselect-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            let newProjects;
                            if (isSelected) {
                              newProjects = formData.projects.filter(name => name !== p.name);
                            } else {
                              newProjects = [...formData.projects, p.name];
                            }
                            setFormData(prev => ({ ...prev, projects: newProjects }));
                            if (errors.projects) {
                              setErrors(prev => ({ ...prev, projects: '' }));
                            }
                          }}
                        >
                          <span style={{ color: isSelected ? '#16A34A' : '#111827' }}>
                            {p.name ? p.name : JSON.stringify(p)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            {errors.projects ? (
              <span className="error-text">{errors.projects}</span>
            ) : (
              <span className="helper-text">You can select multiple projects</span>
            )}
          </div>

          {/* Zoho Mail */}
          <div className="form-group">
            <label>Zoho Mail</label>
            <input
              type="email"
              name="zohoMail"
              placeholder="Enter zoho mail address"
              value={formData.zohoMail}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.zohoMail ? 'input-error' : ''}
            />
            {errors.zohoMail && <span className="error-text">{errors.zohoMail}</span>}
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label>Photo (Max 10MB)</label>
            <div className="upload-box" onClick={handleBrowseClick}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', marginBottom: '8px', borderRadius: '8px' }} />
                  <p style={{ color: '#10b981', margin: 0, fontSize: '0.85rem' }}>{selectedFileName}</p>
                  <span className="upload-hint">Click to change</span>
                </div>
              ) : selectedFileName ? (
                <>
                  <CheckCircle size={24} className="upload-icon" style={{ color: '#10b981' }} />
                  <p style={{ color: '#10b981' }}>{selectedFileName}</p>
                  <span className="upload-hint">Click to change</span>
                </>
              ) : (
                <>
                  <UploadCloud size={24} className="upload-icon" />
                  <p>Drag & drop an image here</p>
                  <p>or <span className="browse-link">browse</span></p>
                  <span className="upload-hint">Accepted formats: JPG, PNG, JPEG</span>
                </>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password <span className="req">*</span></label>
            <div className={`password-input ${errors.password ? 'input-error' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {showPassword ? (
                  <Eye size={16} className="eye-icon" />
                ) : (
                  <EyeOff size={16} className="eye-icon" />
                )}
              </div>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            style={{ background: '#EF4444', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
