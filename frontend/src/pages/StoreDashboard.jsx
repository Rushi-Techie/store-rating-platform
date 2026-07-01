import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Store, Star, LogOut, ArrowUpDown, Key, Users } from 'lucide-react';

export default function StoreDashboard() {
  const { logout, user, changePassword } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'password'
  
  // Dashboard stats and ratings list
  const [storeData, setStoreData] = useState({ averageRating: '0.00', ratings: [] });
  const [sort, setSort] = useState({ sortBy: 'created_at', sortOrder: 'DESC' });
  const [loading, setLoading] = useState(false);

  // Password Change state
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState('');

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const { sortBy, sortOrder } = sort;
      const res = await axios.get('/api/store/my-store', {
        params: { sortBy, sortOrder }
      });
      setStoreData(res.data);
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStoreData();
    }
  }, [sort, activeTab]);

  const handleSort = (column) => {
    const order = sort.sortBy === column && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSort({ sortBy: column, sortOrder: order });
  };

  const validateNewPassword = (pwd) => {
    if (!pwd) return '';
    if (pwd.length < 8 || pwd.length > 16) {
      return 'Password must be 8-16 characters.';
    }
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    if (!hasUpper) return 'Password requires at least one uppercase letter.';
    if (!hasSpecial) return 'Password requires at least one special character.';
    return 'valid';
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'newPassword') {
        const valStatus = validateNewPassword(value);
        setPasswordValidation(valStatus === 'valid' ? 'Password meets specifications' : valStatus);
      }
      return updated;
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPassError('Please fill in all password fields.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    const valStatus = validateNewPassword(passwords.newPassword);
    if (valStatus !== 'valid') {
      setPassError(valStatus);
      return;
    }

    setPassSubmitting(true);
    const res = await changePassword(passwords.oldPassword, passwords.newPassword);
    setPassSubmitting(false);

    if (res.success) {
      setPassSuccess('Your password has been updated successfully.');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordValidation('');
    } else {
      setPassError(res.error);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Store size={22} />
          <span>Store</span>Owner
        </div>
        
        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Store size={18} />
            My Dashboard
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Key size={18} />
            Update Password
          </button>
        </nav>
        
        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">Store Owner</span>
          </div>
          <button className="sidebar-item btn-secondary" onClick={logout}>
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <h1 className="content-title">
            {activeTab === 'dashboard' ? 'Store Dashboard' : 'Account Settings'}
          </h1>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Welcome back</span>
        </header>

        {/* Tab 1: Owner Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            {/* Store Analytics Banner */}
            <section className="metrics-grid">
              <div className="metric-card">
                <div className="metric-details">
                  <span className="metric-label">Average Store Rating</span>
                  <span className="metric-value">{storeData.averageRating}</span>
                </div>
                <div className="metric-icon">
                  <Star size={24} />
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-details">
                  <span className="metric-label">Total Reviews</span>
                  <span className="metric-value">{storeData.ratings.length}</span>
                </div>
                <div className="metric-icon">
                  <Users size={24} />
                </div>
              </div>
            </section>

            {/* List of customer ratings */}
            <section className="section-card">
              <h2 className="section-title">Customer Reviews & Ratings</h2>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')}>
                        Customer Name <ArrowUpDown size={12} className="sort-icon" />
                      </th>
                      <th onClick={() => handleSort('email')}>
                        Email Address <ArrowUpDown size={12} className="sort-icon" />
                      </th>
                      <th style={{ cursor: 'default' }}>Address</th>
                      <th onClick={() => handleSort('rating')}>
                        Rating Given <ArrowUpDown size={12} className="sort-icon" />
                      </th>
                      <th onClick={() => handleSort('created_at')}>
                        Review Date <ArrowUpDown size={12} className="sort-icon" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center" style={{ padding: '32px' }}>
                          Loading reviews...
                        </td>
                      </tr>
                    ) : storeData.ratings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center" style={{ color: 'var(--text-secondary)', padding: '32px' }}>
                          No reviews have been submitted for your store yet.
                        </td>
                      </tr>
                    ) : (
                      storeData.ratings.map(r => (
                        <tr key={r.user_id}>
                          <td style={{ fontWeight: '600' }}>{r.name}</td>
                          <td>{r.email}</td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.address}
                          </td>
                          <td>
                            <div className="flex-gap-2">
                              <span className="rating-value-badge">{r.rating}</span>
                              <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    size={12} 
                                    className={`star ${star <= r.rating ? 'filled' : ''}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            {new Date(r.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'password' && (
          <section className="section-card" style={{ maxWidth: '540px', margin: '0 auto' }}>
            <h2 className="section-title">Change Password</h2>

            {passError && <div className="alert alert-error">{passError}</div>}
            {passSuccess && <div className="alert alert-success">{passSuccess}</div>}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="oldPassword">Current Password</label>
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={passwords.oldPassword}
                  onChange={handlePasswordChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="8-16 chars, 1 uppercase, 1 special character"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="form-control"
                  required
                />
                {passwordValidation && (
                  <div className={`form-helper ${passwordValidation.includes('meets') ? 'success' : 'error'}`}>
                    {passwordValidation}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="form-control"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={passSubmitting || (passwordValidation && !passwordValidation.includes('meets'))}
              >
                {passSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
