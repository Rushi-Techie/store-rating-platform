import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, User, MapPin, Eye, EyeOff, X } from 'lucide-react';

export default function LoginRegister({ onClose }) {
  const { login, signup } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Field errors for registration validation
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (fieldName, val) => {
    const errors = { ...fieldErrors };
    
    if (fieldName === 'name') {
      if (!val) errors.name = 'Name is required.';
      else if (val.length < 20) errors.name = `Name is too short (${val.length}/20 chars min).`;
      else if (val.length > 60) errors.name = 'Name cannot exceed 60 characters.';
      else delete errors.name;
    }
    
    if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val) errors.email = 'Email is required.';
      else if (!emailRegex.test(val)) errors.email = 'Please enter a valid email address.';
      else delete errors.email;
    }
    
    if (fieldName === 'address') {
      if (!val) errors.address = 'Address is required.';
      else if (val.length > 400) errors.address = 'Address cannot exceed 400 characters.';
      else delete errors.address;
    }
    
    if (fieldName === 'password') {
      if (!val) errors.password = 'Password is required.';
      else if (val.length < 8 || val.length > 16) {
        errors.password = 'Password must be 8-16 characters.';
      } else {
        const hasUpper = /[A-Z]/.test(val);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        if (!hasUpper && !hasSpecial) {
          errors.password = 'Requires 1 uppercase letter and 1 special character.';
        } else if (!hasUpper) {
          errors.password = 'Requires at least 1 uppercase letter.';
        } else if (!hasSpecial) {
          errors.password = 'Requires at least 1 special character.';
        } else {
          delete errors.password;
        }
      }
    }
    
    setFieldErrors(errors);
  };

  const handleInputChange = (e) => {
    const { name: fieldName, value } = e.target;
    if (fieldName === 'name') setName(value);
    if (fieldName === 'email') setEmail(value);
    if (fieldName === 'address') setAddress(value);
    if (fieldName === 'password') setPassword(value);
    
    if (!isLogin) {
      validateField(fieldName, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (isLogin) {
      if (!email || !password) {
        setError('Please fill in all fields.');
        return;
      }
      setSubmitting(true);
      const res = await login(email, password);
      setSubmitting(false);
      if (!res.success) {
        setError(res.error);
      }
    } else {
      // Validate all fields
      validateField('name', name);
      validateField('email', email);
      validateField('address', address);
      validateField('password', password);
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const hasUpper = /[A-Z]/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (
        name.length < 20 || name.length > 60 ||
        !emailRegex.test(email) ||
        address.length > 400 || !address ||
        password.length < 8 || password.length > 16 ||
        !hasUpper || !hasSpecial
      ) {
        setError('Please resolve all validation errors before submitting.');
        return;
      }
      
      setSubmitting(true);
      const res = await signup(name, email, address, password);
      setSubmitting(false);
      
      if (res.success) {
        setSuccess('Signup successful! Redirecting...');
      } else {
        setError(res.error);
      }
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setName('');
    setEmail('');
    setAddress('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ position: 'relative' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '20px',
              top: '20px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>
        )}
        <div className="auth-header">
          <h2 className="auth-title">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to access your ratings and dashboard' : 'Join us to rate registered shops and stores'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Min 20 characters name"
                  value={name}
                  onChange={handleInputChange}
                  className="form-control"
                  style={{ paddingLeft: '46px' }}
                  required
                />
              </div>
              {fieldErrors.name && <div className="form-helper error">{fieldErrors.name}</div>}
              {!fieldErrors.name && name && <div className="form-helper success">Name length: {name.length} characters</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleInputChange}
                className="form-control"
                style={{ paddingLeft: '46px' }}
                required
              />
            </div>
            {fieldErrors.email && <div className="form-helper error">{fieldErrors.email}</div>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="address">Postal Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <textarea
                  id="address"
                  name="address"
                  placeholder="Address (Max 400 characters)"
                  value={address}
                  onChange={handleInputChange}
                  className="form-control form-textarea"
                  style={{ paddingLeft: '46px' }}
                  required
                />
              </div>
              {fieldErrors.address && <div className="form-helper error">{fieldErrors.address}</div>}
              {!fieldErrors.address && address && <div className="form-helper">Address length: {address.length}/400</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={handleInputChange}
                className="form-control"
                style={{ paddingLeft: '46px', paddingRight: '46px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <div className="form-helper error">{fieldErrors.password}</div>}
            {!isLogin && !fieldErrors.password && password && (
              <div className="form-helper success">Password meets specifications</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: '12px' }}
            disabled={submitting || (!isLogin && Object.keys(fieldErrors).length > 0)}
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Register Now'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={switchMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: '600',
                marginLeft: '8px',
                cursor: 'pointer'
              }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
