import React, { useState, useEffect } from "react";
import "../styles/AdminDashboard.css";

// VULNERABILITY #4: Hidden admin panel - discovered via page source
// VULNERABILITY #3: Access granted based on cookie value alone

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [actionMessage, setActionMessage] = useState("");
  const [securityFlag, setSecurityFlag] = useState("");
  const [lastDeletedUser, setLastDeletedUser] = useState("");
  const [deletedUsersStack, setDeletedUsersStack] = useState([]);

  useEffect(() => {
    fetch("/api/admin", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
        else setError(d.message);
      })
      .catch(() => setError("Connection error"))
      .finally(() => setLoading(false));
  }, []);

  const getCookieValue = (name) => {
    const cookie = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split("=")[1] || "") : "";
  };

  const roleValue = getCookieValue("role");
  const role = roleValue ? `role=${roleValue}` : "role=not set";
  const currentUsername = getCookieValue("username");

  const filteredUsers = (data?.users || []).filter((u) =>
    `${u.username}`.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredProducts = (data?.products || []).filter((p) =>
    `${p.name}`.toLowerCase().includes(productQuery.toLowerCase())
  );

  const totalRevenue = (data?.products || []).reduce((sum, p) => sum + Number(p.price || 0), 0);

  const topProducts = [...(data?.products || [])]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 5);

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user '${username}'?`)) return;
    setActionMessage("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();

      if (!result.success) {
        setActionMessage(result.message || "Delete action failed.");
        return;
      }

      const removedUser = (data?.users || []).find((u) => u.id === userId) || null;
      setData((prev) => ({
        ...prev,
        users: (prev?.users || []).filter((u) => u.id !== userId),
      }));
      if (removedUser) {
        setDeletedUsersStack((prev) => [...prev, removedUser]);
      }
      setActionMessage(result.message || result.next_hint || "User deleted.");
      setLastDeletedUser(result.deleted_user || username);

      if (result.ctf_flag) {
        setSecurityFlag(result.ctf_flag);
        setActiveTab("security");
      }
    } catch {
      setActionMessage("Delete request failed due to network/server issue.");
    }
  };

  const handleUndoDelete = () => {
    setActionMessage("");
    setDeletedUsersStack((prev) => {
      if (!prev.length) {
        setActionMessage("Nothing to undo.");
        return prev;
      }

      const stackCopy = [...prev];
      const restoredUser = stackCopy.pop();
      setData((current) => ({
        ...current,
        users: [...(current?.users || []), restoredUser].sort((a, b) => a.id - b.id),
      }));

      setLastDeletedUser(stackCopy.length ? stackCopy[stackCopy.length - 1].username : "");
      setActionMessage(`Undo successful. Restored '${restoredUser.username}' in current view.`);
      return stackCopy;
    });
  };

  const renderMainPanel = () => {
    if (!data) return null;

    if (activeTab === "users") {
      return (
        <section className="admin-panel-card">
          <div className="admin-section-head">
            <h3>User Directory</h3>
            <div className="admin-head-actions">
              <input
                className="admin-filter"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search username"
              />
              <button
                className="admin-undo-btn"
                onClick={handleUndoDelete}
                disabled={!deletedUsersStack.length}
              >
                Undo Delete
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Username</th><th>Password</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td className="plain-password">{u.password}</td>
                    <td>
                      {u.username === "admin" || u.username === currentUsername ? (
                        <span className="admin-protected-pill">Protected</span>
                      ) : (
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={u.username === "admin" || u.username === currentUsername}
                      >
                        Delete
                      </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lastDeletedUser && (
            <p className="security-note">Last deleted user: <strong>{lastDeletedUser}</strong>. You can undo this action.</p>
          )}
        </section>
      );
    }

    if (activeTab === "products") {
      return (
        <section className="admin-panel-card">
          <div className="admin-section-head">
            <h3>Product Catalog</h3>
            <input
              className="admin-filter"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search product"
            />
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Price</th></tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>${Number(p.price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (activeTab === "security") {
      return (
        <section className="admin-panel-card admin-security-card">
          <h3>Security Events</h3>
          <div className="security-row">
            <span>Auth source</span>
            <strong>Cookie role value</strong>
          </div>
          <div className="security-row">
            <span>Current role cookie</span>
            <code>{role || "role=not set"}</code>
          </div>
          <div className="security-row">
            <span>Challenge flag</span>
            <code>{securityFlag || "LOCKED"}</code>
          </div>
          <div className="security-row">
            <span>Flag hint</span>
            <strong>{securityFlag ? "Insecure Admin Delete Action" : data.flag_hint}</strong>
          </div>
          {!securityFlag && data.challenge_target && (
            <p className="security-note">
              Flag unlock condition: delete user <strong>{data.challenge_target}</strong> from the Users tab.
            </p>
          )}
          <p className="cookie-tip">
            Tip: Open DevTools to Application to Cookies, then change role to admin.
          </p>
        </section>
      );
    }

    return (
      <section className="admin-panel-card">
        <h3>Overview</h3>
        <div className="admin-kpis">
          <article className="admin-kpi-card">
            <p>Total Users</p>
            <h3>{data.users?.length || 0}</h3>
            <small>Registered accounts</small>
          </article>
          <article className="admin-kpi-card">
            <p>Catalog Items</p>
            <h3>{data.products?.length || 0}</h3>
            <small>Active sellable products</small>
          </article>
          <article className="admin-kpi-card">
            <p>Inventory Value</p>
            <h3>${totalRevenue.toFixed(2)}</h3>
            <small>Total listing value</small>
          </article>
          <article className="admin-kpi-card">
            <p>Session Role</p>
            <h3>{(role || "role=not set").replace("role=", "")}</h3>
            <small>Client authorization state</small>
          </article>
        </div>

        <div className="admin-overview-grid">
          <article className="overview-card">
            <h4>Highest Priced Items</h4>
            <ul>
              {topProducts.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <strong>${Number(p.price || 0).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </article>
          <article className="overview-card">
            <h4>Session Diagnostics</h4>
            <p><strong>Cookie:</strong> {role || "role=not set"}</p>
            <p><strong>Status:</strong> {data.message}</p>
            <p><strong>Flag visibility:</strong> Security tab only</p>
          </article>
        </div>
      </section>
    );
  };

  return (
    <div className="page admin-page">
      <div className="admin-header">
        <h2>Operations Control Center</h2>
        <p>Manage users, catalog intelligence, and security observability from a unified admin console.</p>
      </div>

      {actionMessage && <div className="admin-action-msg">{actionMessage}</div>}

      {loading && <div className="loading">Loading admin data...</div>}

      {error && (
        <div className="error-box access-denied">
          Access denied: {error}
          <div className="hint-box">
            <strong>Challenge:</strong> Change your <code>role</code> cookie value to <code>admin</code> using browser DevTools.
          </div>
        </div>
      )}

      {data && (
        <div className="admin-shell">
          <aside className="admin-sidebar">
            <button
              className={`admin-nav-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`admin-nav-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              className={`admin-nav-btn ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              Products
            </button>
            <button
              className={`admin-nav-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              Security
            </button>
          </aside>

          <div className="admin-main">
            {renderMainPanel()}
          </div>
        </div>
      )}
    </div>
  );
}
