import React, { useState } from 'react';
import LoginRegister from './LoginRegister';
import { Store, Users, Shield, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="landing-container">
      {/* Navigation */}
      <header className="landing-nav">
        <a href="/" className="landing-logo">
          <Store size={26} />
          <span>Shop</span>Rater
        </a>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowAuth(true)}>
          Sign In
        </button>
      </header>

      {/* Full-Screen Hero Banner */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> Local Store Reviews
            </span>
          </div>
          <h1 className="hero-title">
            Find the Best Rated Stores in Your Neighborhood
          </h1>
          <p className="hero-description">
            Explore authentic customer ratings, search for shops by name or address, and submit your own reviews from 1 to 5 stars. Join today to support your local businesses.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
              Get Started Now <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn btn-secondary">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-label">How it works</span>
          <h2 className="section-heading">Built for Customers, Owners, and Admin</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={22} />
            </div>
            <h3 className="feature-title">For Customers</h3>
            <p className="feature-desc">
              Sign up in seconds to view registered stores. Search by name or address, sort by key fields, and submit or update your ratings inline.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Store size={22} />
            </div>
            <h3 className="feature-title">For Store Owners</h3>
            <p className="feature-desc">
              Log in to see your store's average ratings and access a dedicated directory of all local customers who left feedback for your business.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Shield size={22} />
            </div>
            <h3 className="feature-title">For Administrators</h3>
            <p className="feature-desc">
              Access the management panel to add new stores, register normal users, view real-time statistics, and apply listings filters.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo" style={{ fontSize: '18px' }}>
          <Store size={20} />
          <span>Shop</span>Rater
        </div>
        <p className="footer-text">
          © {new Date().getFullYear()} ShopRater. All rights reserved.
        </p>
      </footer>

      {/* Auth Modal Overlay */}
      {showAuth && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '460px' }}>
            <LoginRegister onClose={() => setShowAuth(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
