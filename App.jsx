import React, { useState, useEffect, useRef } from "react";
import LoginPage from "./LoginPage";
import ProductsPage from "./ProductsPage";
import AdminDashboard from "./AdminDashboard";
import CartPage from "./CartPage";
import ProductDetail from "./ProductDetail";
import "./App.css";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const dealsRailRef = useRef(null);
  const featuredRailRef = useRef(null);

  useEffect(() => {
    const role = getCookie("role");
    const user = getCookie("username");

    fetch("/api/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const list = d.products || [];
          setProducts(list);
        }
      })
      .catch(() => {});

    if (role && user) {
      setLoggedIn(true);
      setUsername(user);
      if (role === "admin" || window.location.hash === "#admin-dashboard") {
        setPage("admin");
      } else {
        setPage("home");
      }
    }
  }, []);

  const handleLogin = (user) => {
    setLoggedIn(true);
    setUsername(user);
    setPage("home");
  };

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    setLoggedIn(false);
    setUsername("");
    setPage("home");
  };

  const navigateTo = (p) => setPage(p);

  const handleRequireLogin = () => setPage("login");

  const handleAddToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);
  };

  const handleRemoveFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    alert("Thank you for your purchase! Your order has been placed.");
    setCart([]);
    setPage("home");
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setPage("product-detail");
  };

  const handleBackFromDetail = () => {
    setSelectedProduct(null);
    setPage("products");
  };

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    setPage("products");
  };

  const scrollRail = (railRef, direction) => {
    const node = railRef.current;
    if (!node) return;
    const amount = Math.max(220, Math.floor(node.clientWidth * 0.75));
    node.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  const spotlight = products.slice(0, 3);
  const deals = [...products]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 4);
  const featured = [...products]
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    .slice(4, 8);

  return (
    <div className="app">
      <div className="utility-strip">
        <span>Deliver to Student Lab Zone</span>
        <span>Deals</span>
        <span>Customer Service</span>
        <span>Returns & Orders</span>
      </div>
      <nav className="navbar">
        <div
          className="nav-brand"
          onClick={() => navigateTo("home")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigateTo("home");
          }}
          role="button"
          tabIndex={0}
        >
          🛒 ShopEasy
        </div>
        <form className="header-search" onSubmit={handleHeaderSearch}>
          <select aria-label="Category">
            <option>All</option>
            <option>Computers</option>
            <option>Audio</option>
            <option>Office</option>
          </select>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ShopEasy"
          />
          <button type="submit">Search</button>
        </form>
        <div className="nav-links">
          {loggedIn ? (
            <>
              <span className="nav-user">Hello, {username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <button onClick={() => navigateTo("login")} className={page === "login" ? "active" : ""}>Account</button>
          )}
          <button onClick={() => navigateTo("cart")} className="cart-btn">Cart ({cart.length})</button>
        </div>
      </nav>
      <div className="category-rail">
        <button onClick={() => navigateTo("home")} className={page === "home" ? "active" : ""}>Home</button>
        <button onClick={() => navigateTo("products")} className={page === "products" ? "active" : ""}>Today's Deals</button>
        <button onClick={() => navigateTo("products")} className={page === "products" ? "active" : ""}>Best Sellers</button>
        <button onClick={() => navigateTo("products")} className={page === "products" ? "active" : ""}>Electronics</button>
        <button onClick={() => navigateTo("products")} className={page === "products" ? "active" : ""}>Office</button>
        <button onClick={() => navigateTo("admin")} className={page === "admin" ? "active" : ""} style={{ display: "none" }}>Admin</button>
      </div>

      <main>
        {page === "home" && (
          <section className="page home-page">
            <div className="bleed-band">
              <div className="hero commerce-hero">
                <div className="hero-copy">
                  <p className="hero-eyebrow">Mega Lab Festival</p>
                  <h1>Big savings on everyday tech, office setup, and student essentials.</h1>
                  <p>
                    Explore a full storefront experience first, compare products, then sign in for
                    checkout-style actions and account features.
                  </p>
                  <div className="hero-actions">
                    <button className="primary-cta" onClick={() => navigateTo("products")}>Explore Products</button>
                    {!loggedIn && <button className="secondary-cta" onClick={() => navigateTo("login")}>Sign In</button>}
                  </div>
                </div>
                <div className="hero-stats home-panels">
                  <div><span>{products.length}+</span><small>Products in catalog</small></div>
                  <div><span>Same Day</span><small>Demo delivery promise</small></div>
                  <div><span>4</span><small>Cyber lab challenges</small></div>
                </div>
              </div>
            </div>

            <section className="editorial-split">
              <div className="editorial-main">
                <h3>Shop by Department</h3>
                <div className="pill-row">
                  <span>Computers</span>
                  <span>Audio</span>
                  <span>Office</span>
                  <span>Smart Tech</span>
                </div>
                <p>Built to feel like real commerce discovery: scan quickly, compare quickly, then act.</p>
              </div>
              <aside className="editorial-side">
                <h3>Trending now</h3>
                <div className="inline-items">
                  {spotlight.map((item) => (
                    <span key={item.id}>{item.name}</span>
                  ))}
                </div>
              </aside>
            </section>

            <section className="rail-section deals-section">
              <div className="rail-header">
                <h2>Today&apos;s Deals</h2>
                <div className="rail-actions">
                  <button onClick={() => navigateTo("products")}>Shop now</button>
                  <div className="rail-arrows">
                    <button
                      type="button"
                      aria-label="Scroll deals left"
                      onClick={() => scrollRail(dealsRailRef, "prev")}
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      aria-label="Scroll deals right"
                      onClick={() => scrollRail(dealsRailRef, "next")}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
              <div className="rail-track" ref={dealsRailRef}>
                {deals.map((item) => (
                  <article className="rail-item" key={`deal-${item.id}`}>
                    <p className="featured-icon">🔥</p>
                    <h3>{item.name}</h3>
                    <p className="featured-price">${item.price}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rail-section">
              <div className="rail-header">
                <h2>Featured Picks</h2>
                <div className="rail-actions">
                  <button onClick={() => navigateTo("products")}>View all</button>
                  <div className="rail-arrows">
                    <button
                      type="button"
                      aria-label="Scroll featured left"
                      onClick={() => scrollRail(featuredRailRef, "prev")}
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      aria-label="Scroll featured right"
                      onClick={() => scrollRail(featuredRailRef, "next")}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
              <div className="rail-track" ref={featuredRailRef}>
                {featured.length === 0 ? (
                  <article className="rail-item featured-empty">
                    <h3>Catalog loading...</h3>
                    <p className="featured-price">Refresh or open Products to fetch items.</p>
                  </article>
                ) : (
                  featured.map((item) => (
                    <article className="rail-item" key={item.id}>
                      <p className="featured-icon">📦</p>
                      <h3>{item.name}</h3>
                      <p className="featured-price">${item.price}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <footer className="home-footer">
              <p><strong>ShopEasy</strong> is built for realistic ecommerce exploration in cybersecurity labs.</p>
              <p>Need account features? Sign in from the top-right Account button.</p>
            </footer>
          </section>
        )}
        {page === "login" && <LoginPage onLogin={handleLogin} />}
        {page === "products" && (
          <ProductsPage
            loggedIn={loggedIn}
            onLoginPrompt={handleRequireLogin}
            initialSearch={searchTerm}
            onAddToCart={handleAddToCart}
            onSelectProduct={handleSelectProduct}
          />
        )}
        {page === "product-detail" && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onBack={handleBackFromDetail}
            onAddToCart={handleAddToCart}
            loggedIn={loggedIn}
            onLoginPrompt={handleRequireLogin}
          />
        )}
        {page === "cart" && (
          <CartPage
            cartItems={cart}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={handleCheckout}
            loggedIn={loggedIn}
            onLoginPrompt={handleRequireLogin}
          />
        )}
        {page === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}
