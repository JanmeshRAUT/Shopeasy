import React, { useState, useEffect, useRef } from "react";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import AdminDashboard from "./pages/AdminDashboard";
import CartPage from "./pages/CartPage";
import ProductDetail from "./pages/ProductDetail";
import ProfilePage from "./pages/ProfilePage";
import { getProductImage } from "./utils/productImages";
import { Toaster } from 'react-hot-toast';
import heroTechImg from "./assets/hero-tech.png";
import heroOfficeImg from "./assets/hero-office.png";
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

  useEffect(() => {
    const role = getCookie("role");
    const user = getCookie("username");

    fetch("/api/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProducts(d.products || []);
        }
      })
      .catch(() => {});

    if (role && user) {
      setLoggedIn(true);
      setUsername(user);
      if (role === "admin" || window.location.hash === "#admin-dashboard") {
        setPage("admin");
      }
    }
  }, []);

  const handleLogin = (user) => {
    setLoggedIn(true);
    setUsername(user);
    setPage("home");
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setLoggedIn(false);
    setUsername("");
    setPage("home");
  };

  const navigateTo = (p) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  const handleRequireLogin = () => setPage("login");
  const handleAddToCart = (product) => setCart((prev) => [...prev, product]);
  const handleRemoveFromCart = (index) => setCart((prev) => prev.filter((_, i) => i !== index));
  const handleCheckout = () => {
    alert("Thank you for your purchase!");
    setCart([]);
    setPage("home");
  };
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setPage("product-detail");
  };

  const deals = products.slice(0, 10);
  const electronics = products.filter(p => p.name.toLowerCase().includes("wireless") || p.name.toLowerCase().includes("keyboard")).slice(0, 4);

  return (
    <div className="app">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="utility-strip">
        <span>Help</span>
        <span>Orders</span>
        <span>Prime</span>
        {loggedIn && <span onClick={handleLogout}>Sign Out</span>}
      </div>

      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigateTo("home")}>
          🛒 Shop<span>Easy</span>
        </div>

        <form className="header-search" onSubmit={(e) => { e.preventDefault(); setPage("products"); }}>
          <select>
            <option>All Departments</option>
            <option>Electronics</option>
            <option>Home Office</option>
          </select>
          <input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search ShopEasy" 
          />
          <button type="submit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </form>

        <div className="nav-links">
          <div className="nav-user" onClick={() => loggedIn ? navigateTo("profile") : navigateTo("login")} style={{cursor: 'pointer'}}>
            <span>Hello, {loggedIn ? username : 'sign in'}</span>
            <strong>Account & Lists</strong>
          </div>
          <button onClick={() => navigateTo("cart")} className="cart-btn">
            <strong>Cart</strong>
            <span>{cart.length}</span>
          </button>
        </div>
      </nav>

      <div className="category-rail">
        <button onClick={() => navigateTo("products")}>All</button>
        <button onClick={() => navigateTo("products")}>Today's Deals</button>
        <button onClick={() => navigateTo("products")}>Customer Service</button>
        <button onClick={() => navigateTo("products")}>Registry</button>
        <button onClick={() => navigateTo("products")}>Gift Cards</button>
        <button onClick={() => navigateTo("products")}>Sell</button>
      </div>

      <main>
        {page === "home" && (
          <section className="home-page">
            <div className="hero-carousel">
              <div className="hero-slide" style={{ backgroundImage: `url('${heroTechImg}')` }}>
                <div className="hero-content">
                  <h1>Up to 40% off on Premium Tech</h1>
                  <p>Upgrade your workstation with the latest mechanical keyboards and wireless audio.</p>
                  <div className="hero-btns">
                    <button className="primary-cta" onClick={() => navigateTo("products")}>Shop Now</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-container">
              <div className="home-grid">
              <div className="grid-card">
                <h3>Upgrade your office</h3>
                <div className="grid-image">
                  <img src={getProductImage("Laptop Stand")} alt="Office" />
                </div>
                <a href="#" className="grid-link" onClick={() => navigateTo("products")}>See more</a>
              </div>
              <div className="grid-card">
                <h3>Gaming Essentials</h3>
                <div className="grid-image">
                  <img src={getProductImage("Gaming Mouse")} alt="Gaming" />
                </div>
                <a href="#" className="grid-link" onClick={() => navigateTo("products")}>Shop Gaming</a>
              </div>
              <div className="grid-card">
                <h3>Smart Home Tech</h3>
                <div className="grid-image">
                  <img src={getProductImage("Smart Watch")} alt="Smart Home" />
                </div>
                <a href="#" className="grid-link" onClick={() => navigateTo("products")}>Explore</a>
              </div>
              <div className="grid-card">
                <h3>{loggedIn ? `Welcome back, ${username}` : 'Sign in for best experience'}</h3>
                {!loggedIn && (
                  <button className="primary-cta" style={{width: '100%', padding: '10px'}} onClick={() => navigateTo("login")}>Sign in securely</button>
                )}
                <div className="grid-image" style={{marginTop: '10px', height: '140px'}}>
                  <img src={getProductImage("Wireless Headphones")} alt="Deals" />
                </div>
              </div>
            </div>

            <div className="rail-section">
              <div className="rail-header">
                <h2>Today's Deals</h2>
                <a href="#" className="grid-link" onClick={() => navigateTo("products")}>See all deals</a>
              </div>
              <div className="rail-track" ref={dealsRailRef}>
                {deals.map(p => (
                  <div key={p.id} className="rail-item" onClick={() => handleSelectProduct(p)}>
                    <img src={getProductImage(p.name)} alt={p.name} />
                    <span className="rail-price">${p.price}</span>
                    <h4>{p.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <footer className="home-footer">
            <div className="footer-content">
              <div className="footer-col">
                <h4>Get to Know Us</h4>
                <ul><li>Careers</li><li>Blog</li><li>About ShopEasy</li></ul>
              </div>
              <div className="footer-col">
                <h4>Make Money with Us</h4>
                <ul><li>Sell on ShopEasy</li><li>Become an Affiliate</li></ul>
              </div>
              <div className="footer-col">
                <h4>Payment Products</h4>
                <ul><li>Shop with Points</li><li>Reload Your Balance</li></ul>
              </div>
              <div className="footer-col">
                <h4>Let Us Help You</h4>
                <ul>
                  <li onClick={() => navigateTo("profile")}>Your Account</li>
                  <li onClick={() => navigateTo("products")}>Your Orders</li>
                  <li onClick={() => navigateTo("products")}>Shipping Rates</li>
                </ul>
              </div>
            </div>
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
            onBack={() => navigateTo("products")}
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
        {page === "profile" && <ProfilePage username={username} onLogout={handleLogout} />}
        {page === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}
