import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Users, Store, Star, UserPlus, LogOut, Search, ArrowUpDown, Shield, Info, X } from 'lucide-react';

export default function AdminDashboard() {
  const { logout, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'stores' or 'add-user'
  
  // Dashboard stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  
  // Listings data
  const [usersList, setUsersList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  
  // User/Store filter states
  const [userFilters, setUserFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });
  
  // Sorting states
  const [userSort, setUserSort] = useState({ sortBy: 'name', sortOrder: 'ASC' });
  const [storeSort, setStoreSort] = useState({ sortBy: 'name', sortOrder: 'ASC' });

  // Add User Form state
  const [formFields, setFormFields] = useState({ name: '', email: '', address: '', password: '', role: 'user' });
  const [formErrors, setFormErrors] = useState({});
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // User detail popup state
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Load Users List
  const fetchUsers = async () => {
    try {
      const { name, email, address, role } = userFilters;
      const { sortBy, sortOrder } = userSort;
      const res = await axios.get('/api/admin/users', {
        params: { name, email, address, role, sortBy, sortOrder }
      });
      setUsersList(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Load Stores List
  const fetchStores = async () => {
    try {
      const { name, email, address } = storeFilters;
      const { sortBy, sortOrder } = storeSort;
      const res = await axios.get('/api/admin/stores', {
        params: { name, email, address, sortBy, sortOrder }
      });
      setStoresList(res.data);
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userFilters, userSort, activeTab]);

  useEffect(() => {
    if (activeTab === 'stores') fetchStores();
  }, [storeFilters, storeSort, activeTab]);

  // Handle User Sort change
  const handleUserSort = (column) => {
    const order = userSort.sortBy === column && userSort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setUserSort({ sortBy: column, sortOrder: order });
  };

  // Handle Store Sort change
  const handleStoreSort = (column) => {
    const order = storeSort.sortBy === column && storeSort.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setStoreSort({ sortBy: column, sortOrder: order });
  };

  // User Detail View
  const handleViewDetails = async (userId) => {
    setSelectedUser(null);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/admin/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Form Validation
  const validateForm = (name, val) => {
    const errors = { ...formErrors };
    
    if (name === 'name') {
      if (!val) errors.name = 'Name is required.';
      else if (val.length < 20) errors.name = `Name is too short (${val.length}/20 chars min).`;
      else if (val.length > 60) errors.name = 'Name cannot exceed 60 characters.';
      else delete errors.name;
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val) errors.email = 'Email is required.';
      else if (!emailRegex.test(val)) errors.email = 'Please enter a valid email format.';
      else delete errors.email;
    }
    if (name === 'address') {
      if (!val) errors.address = 'Address is required.';
      else if (val.length > 400) errors.address = 'Address cannot exceed 400 characters.';
      else delete errors.address;
    }
    if (name === 'password') {
      if (!val) errors.password = 'Password is required.';
      else if (val.length < 8 || val.length > 16) {
        errors.password = 'Password must be 8-16 characters.';
      } else {
        const hasUpper = /[A-Z]/.test(val);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        if (!hasUpper || !hasSpecial) {
          errors.password = 'Requires 1 uppercase letter and 1 special character.';
        } else {
          delete errors.password;
        }
      }
    }

    setFormErrors(errors);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({ ...prev, [name]: value }));
    validateForm(name, value);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Run final validation check
    validateForm('name', formFields.name);
    validateForm('email', formFields.email);
    validateForm('address', formFields.address);
    validateForm('password', formFields.password);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasUpper = /[A-Z]/.test(formFields.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formFields.password);

    if (
      formFields.name.length < 20 || formFields.name.length > 60 ||
      !emailRegex.test(formFields.email) ||
      formFields.address.length > 400 || !formFields.address ||
      formFields.password.length < 8 || formFields.password.length > 16 ||
      !hasUpper || !hasSpecial
    ) {
      setFormError('Please resolve all validation errors.');
      return;
    }

    setFormSubmitting(true);
    try {
      await axios.post('/api/admin/users', formFields);
      setFormSuccess(`Registered new ${formFields.role} account successfully!`);
      // Reset form
      setFormFields({ name: '', email: '', address: '', password: '', role: 'user' });
      setFormErrors({});
      fetchStats(); // Update stats
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error occurred while registering user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Shield size={22} />
          <span>Admin</span>Portal
        </div>
        
        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            Users Directory
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <Store size={18} />
            Stores Directory
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'add-user' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-user')}
          >
            <UserPlus size={18} />
            Add New User
          </button>
        </nav>
        
        <div className="sidebar-user">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
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
          <h1 className="content-title">System Dashboard</h1>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Welcome, Administrator</span>
        </header>

        {/* Analytics Cards */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-details">
              <span className="metric-label">Total Users</span>
              <span className="metric-value">{stats.totalUsers}</span>
            </div>
            <div className="metric-icon">
              <Users size={24} />
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-details">
              <span className="metric-label">Total Stores</span>
              <span className="metric-value">{stats.totalStores}</span>
            </div>
            <div className="metric-icon">
              <Store size={24} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-details">
              <span className="metric-label">Total Ratings</span>
              <span className="metric-value">{stats.totalRatings}</span>
            </div>
            <div className="metric-icon">
              <Star size={24} />
            </div>
          </div>
        </section>

        {/* Tab 1: Users Directory */}
        {activeTab === 'users' && (
          <section className="section-card">
            <h2 className="section-title">Users Directory</h2>
            
            <div className="table-container">
              {/* Interactive filters */}
              <div className="table-controls">
                <div className="table-filters" style={{ width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    className="form-control search-input"
                    value={userFilters.name}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Filter by email..."
                    className="form-control search-input"
                    value={userFilters.email}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Filter by address..."
                    className="form-control search-input"
                    value={userFilters.address}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, address: e.target.value }))}
                  />
                  <select
                    className="form-control search-input"
                    value={userFilters.role}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleUserSort('name')}>
                      Name <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleUserSort('email')}>
                      Email <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleUserSort('address')}>
                      Address <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleUserSort('role')}>
                      Role <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th style={{ cursor: 'default' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No records match the active filters.
                      </td>
                    </tr>
                  ) : (
                    usersList.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.address}
                        </td>
                        <td>
                          <span className={`badge badge-${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(u.id)}>
                            <Info size={14} /> Details
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

        {/* Tab 2: Stores Directory */}
        {activeTab === 'stores' && (
          <section className="section-card">
            <h2 className="section-title">Stores Directory</h2>
            
            <div className="table-container">
              <div className="table-controls">
                <div className="table-filters" style={{ width: '100%' }}>
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    className="form-control search-input"
                    value={storeFilters.name}
                    onChange={(e) => setStoreFilters(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Filter by email..."
                    className="form-control search-input"
                    value={storeFilters.email}
                    onChange={(e) => setStoreFilters(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Filter by address..."
                    className="form-control search-input"
                    value={storeFilters.address}
                    onChange={(e) => setStoreFilters(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleStoreSort('name')}>
                      Name <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleStoreSort('email')}>
                      Email <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleStoreSort('address')}>
                      Address <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th onClick={() => handleStoreSort('rating')}>
                      Rating <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th style={{ cursor: 'default' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storesList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ color: 'var(--text-secondary)' }}>
                        No stores found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    storesList.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.address}
                        </td>
                        <td>
                          <div className="flex-gap-2">
                            <span className="rating-value-badge">{s.rating}</span>
                            <Star size={14} className="star filled" />
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(s.id)}>
                            <Info size={14} /> Details
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

        {/* Tab 3: Add User Form */}
        {activeTab === 'add-user' && (
          <section className="section-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 className="section-title">Register New Account</h2>

            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="role">User Role</label>
                <select
                  id="role"
                  name="role"
                  value={formFields.role}
                  onChange={handleFormChange}
                  className="form-control"
                  required
                >
                  <option value="user">Normal User (Customer)</option>
                  <option value="store_owner">Store Owner</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Min 20 characters, Max 60 characters"
                  value={formFields.name}
                  onChange={handleFormChange}
                  className="form-control"
                  required
                />
                {formErrors.name && <div className="form-helper error">{formErrors.name}</div>}
                {!formErrors.name && formFields.name && <div className="form-helper success">Length: {formFields.name.length} chars</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@platform.com"
                  value={formFields.email}
                  onChange={handleFormChange}
                  className="form-control"
                  required
                />
                {formErrors.email && <div className="form-helper error">{formErrors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Max 400 characters address"
                  value={formFields.address}
                  onChange={handleFormChange}
                  className="form-control form-textarea"
                  required
                />
                {formErrors.address && <div className="form-helper error">{formErrors.address}</div>}
                {!formErrors.address && formFields.address && <div className="form-helper">Length: {formFields.address.length}/400</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Temporary Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="8-16 chars, 1 uppercase, 1 special char"
                  value={formFields.password}
                  onChange={handleFormChange}
                  className="form-control"
                  required
                />
                {formErrors.password && <div className="form-helper error">{formErrors.password}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={formSubmitting || Object.keys(formErrors).length > 0}
              >
                {formSubmitting ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          </section>
        )}

        {/* Modal: View Details popup */}
        {selectedUser && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Account Info</h3>
                <button className="modal-close" onClick={() => setSelectedUser(null)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span className="form-label">Name</span>
                  <span style={{ fontSize: '15px', display: 'block', fontWeight: '500' }}>{selectedUser.name}</span>
                </div>

                <div>
                  <span className="form-label">Email</span>
                  <span style={{ fontSize: '15px', display: 'block' }}>{selectedUser.email}</span>
                </div>

                <div>
                  <span className="form-label">Address</span>
                  <span style={{ fontSize: '15px', display: 'block', color: 'var(--text-secondary)' }}>{selectedUser.address}</span>
                </div>

                <div>
                  <span className="form-label">Role</span>
                  <span className={`badge badge-${selectedUser.role}`}>{selectedUser.role}</span>
                </div>

                {selectedUser.role === 'store_owner' && (
                  <div>
                    <span className="form-label">Overall Average Rating</span>
                    <div className="flex-gap-2">
                      <span className="rating-value-badge" style={{ fontSize: '18px' }}>{selectedUser.rating || '0.00'}</span>
                      <Star size={18} className="star filled" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loadingDetail && (
          <div className="modal-overlay">
            <div className="modal-content text-center">
              <p>Fetching account data...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
