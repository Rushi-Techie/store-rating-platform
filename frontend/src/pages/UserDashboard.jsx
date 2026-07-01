import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Store, Star, LogOut, Search, ArrowUpDown, Key, X, CheckCircle } from 'lucide-react';

export default function UserDashboard() {
  const { logout, user, changePassword } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' or 'password'
  
  // Stores directory state
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ sortBy: 'name', sortOrder: 'ASC' });
  const [loading, setLoading] = useState(false);

  // Rating Modal state
  const [ratingModal, setRatingModal] = useState({ show: false, storeId: null, storeName: '', currentRating: 0 });
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitError, setRatingSubmitError] = useState('');

  // Password Change state
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState('');

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { sortBy, sortOrder } = sort;
      const res = await axios.get('/api/user/stores', {
        params: { search, sortBy, sortOrder }
      });
      setStores(res.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchStores();
    }
  }, [search, sort, activeTab]);

  const handleSort = (column) => {
    const order = sort.sortBy === column && sort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSort({ sortBy: column, sortOrder: order });
  };

  const openRatingModal = (store) => {
    setRatingSubmitError('');
    setRatingModal({
      show: true,
      storeId: store.id,
      storeName: store.name,
      currentRating: store.user_rating || 0 // 0 if not rated yet
    });
  };

  const closeRatingModal = () => {
    setRatingModal({ show: false, storeId: null, storeName: '', currentRating: 0 });
    setHoverRating(0);
  };

  const handleRatingSubmit = async (ratingVal) => {
    try {
      if (ratingModal.currentRating > 0) {
        // Update rating
        await axios.put(`/api/user/ratings/${ratingModal.storeId}`, { rating: ratingVal });
      } else {
        // Submit new rating
        await axios.post('/api/user/ratings', { storeId: ratingModal.storeId, rating: ratingVal });
      }
      closeRatingModal();
      fetchStores();
    } catch (err) {
      setRatingSubmitError(err.response?.data?.message || 'Error saving rating.');
    }
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
          <span>Shop</span>Rater
        </div>
        
        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <Store size={18} />
            Browse Stores
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
            <span className="user-role">Customer</span>
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
            {activeTab === 'stores' ? 'Store Reviews' : 'Account Settings'}
          </h1>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Welcome, Member</span>
        </header>

        {/* Tab 1: Browse & Rate Stores */}
        {activeTab === 'stores' && (
          <section className="section-card">
            <h2 className="section-title">Registered Stores</h2>

            <div className="table-container">
              <div className="table-controls">
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by name or address..."
                    className="form-control"
                    style={{ paddingLeft: '46px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      Store Name <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleSort('address')}>
                      Address <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleSort('overall_rating')}>
                      Overall Rating <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th style={{ cursor: 'default' }}>Your Rating</th>
                    <th style={{ cursor: 'default' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ padding: '32px' }}>
                        Loading store data...
                      </td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ color: 'var(--text-secondary)', padding: '32px' }}>
                        No stores found.
                      </td>
                    </tr>
                  ) : (
                    stores.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '600' }}>{s.name}</td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.address}
                        </td>
                        <td>
                          <div className="flex-gap-2">
                            <span className="rating-value-badge">{s.overall_rating}</span>
                            <Star size={14} className="star filled" />
                          </div>
                        </td>
                        <td>
                          {s.user_rating ? (
                            <div className="flex-gap-2">
                              <span className="rating-value-badge" style={{ color: 'var(--color-primary)' }}>{s.user_rating}</span>
                              <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    size={12} 
                                    className={`star ${star <= s.user_rating ? 'filled' : ''}`}
                                    style={star <= s.user_rating ? { color: 'var(--color-primary)' } : {}}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Not rated yet</span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => openRatingModal(s)}>
                            {s.user_rating ? 'Modify Rating' : 'Submit Rating'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
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

        {/* Rating Submission Modal */}
        {ratingModal.show && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                  {ratingModal.currentRating > 0 ? 'Modify Rating' : 'Rate Store'}
                </h3>
                <button className="modal-close" onClick={closeRatingModal}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  How would you rate <strong>{ratingModal.storeName}</strong>?
                </p>

                {ratingSubmitError && (
                  <div className="alert alert-error" style={{ marginBottom: '16px' }}>{ratingSubmitError}</div>
                )}

                <div 
                  className="rating-stars" 
                  style={{ gap: '12px', justifyContent: 'center', marginBottom: '24px' }}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating ? star <= hoverRating : star <= ratingModal.currentRating;
                    return (
                      <Star
                        key={star}
                        size={36}
                        className={`star star-interactive ${isFilled ? 'filled' : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRatingSubmit(star)}
                      />
                    );
                  })}
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Click a star to submit your review rating immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
