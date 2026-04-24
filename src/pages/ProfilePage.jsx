import React, { useEffect, useState } from "react";
import "../styles/ProfilePage.css";

export default function ProfilePage({ username, onLogout }) {
  const [flag, setFlag] = useState(null);
  const [flagType, setFlagType] = useState("");
  const [loading, setLoading] = useState(true);

  const safeUsername = username || "customer";
  const displayName = safeUsername.charAt(0).toUpperCase() + safeUsername.slice(1);

  useEffect(() => {
    fetch("/api/user/flag", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFlag(data.ctf_flag);
          setFlagType(data.flag_type);
        }
      })
      .catch(err => console.error("Error fetching flag:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page profile-page">
      <div className="profile-card">
        
        {/* Profile Header with Logout */}
        <div className="profile-header">
          <div className="profile-avatar">
            {safeUsername[0].toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>Hello, {displayName}</h1>
            <p>Manage your orders, account security, and saved preferences.</p>
          </div>
          <button type="button" className="profile-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>

        {/* Account Overview Cards */}
        <section className="account-grid">
          <article className="account-card">
            <h3>Your Orders</h3>
            <p>Track, return, or buy items again.</p>
          </article>
          <article className="account-card">
            <h3>Login & Security</h3>
            <p>Update password and account recovery options.</p>
          </article>
          <article className="account-card">
            <h3>Prime & Membership</h3>
            <p>Review benefits and subscription details.</p>
          </article>
          <article className="account-card">
            <h3>Payment Options</h3>
            <p>Manage cards, UPI, and billing preferences.</p>
          </article>
        </section>

        {/* Account Details */}
        <section className="profile-details">
          <div className="detail-box">
            <label>Username</label>
            <span>{safeUsername}</span>
          </div>
          <div className="detail-box">
            <label>Email Address</label>
            <span>{safeUsername}@shopeasy.lab</span>
          </div>
          <div className="detail-box">
            <label>Account Status</label>
            <span className="status-ok">Verified</span>
          </div>
          <div className="detail-box">
            <label>Member Since</label>
            <span>April 2026</span>
          </div>
        </section>

        {/* CTF Flag Section */}
        {flag && !loading && (
          <section className="flag-section">
            <h3>🚩 CTF Challenge Completed</h3>
            <p>You successfully accessed this account via <strong>{flagType}</strong>.</p>
            <div className="flag-code">{flag}</div>
            <p className="profile-note">
              <strong>Note:</strong> Your private profile may contain sensitive laboratory flags.
              Document your exploitation path before proceeding.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
