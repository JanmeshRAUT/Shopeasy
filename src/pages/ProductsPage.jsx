import React, { useState, useEffect } from "react";
import { getProductImage } from "../utils/productImages";
import "../styles/ProductsPage.css";

export default function ProductsPage({ loggedIn, onLoginPrompt, initialSearch = "", onAddToCart, onSelectProduct }) {
  const [products, setProducts]   = useState([]);
  const [searchQ, setSearchQ]     = useState(initialSearch);
  const [results, setResults]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [category, setCategory]   = useState("All");
  const [sortBy, setSortBy]       = useState("featured");

  const getCategory = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("keyboard") || n.includes("mouse") || n.includes("hub")) return "Computers";
    if (n.includes("speaker") || n.includes("headphones")) return "Audio";
    if (n.includes("watch") || n.includes("charger")) return "Smart Tech";
    if (n.includes("stand") || n.includes("light")) return "Office";
    return "Accessories";
  };

  const getRating = (id = 0) => Number((3.6 + ((id % 7) * 0.2)).toFixed(1));

  useEffect(() => {
    fetch("/api/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.products); });
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQ)}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setResults(data.results);
    } catch {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const displayList = results !== null ? results : products;
  const departments = ["All", "Computers", "Audio", "Smart Tech", "Office", "Accessories"];

  const visibleList = displayList
    .filter((p) => category === "All" || getCategory(p.name) === category)
    .sort((a, b) => {
      if (sortBy === "priceLow") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "priceHigh") return Number(b.price || 0) - Number(a.price || 0);
      return 0;
    });

  return (
    <div className="page products-page">
      <div className="products-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Department</h3>
            <ul>
              {departments.map(dep => (
                <li 
                  key={dep} 
                  className={category === dep ? "active" : ""} 
                  onClick={() => setCategory(dep)}
                >
                  {dep}
                </li>
              ))}
            </ul>
          </div>
          <div className="sidebar-section">
            <h3>Customer Reviews</h3>
            <ul>
              <li>⭐⭐⭐⭐ & Up</li>
              <li>⭐⭐⭐ & Up</li>
            </ul>
          </div>
        </aside>

        <main className="products-content">
          <div className="products-header">
            <h2>{category === "All" ? "Results" : category}</h2>
            <p>Check out our latest selection of premium electronics and office gear.</p>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search products..."
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>

          <div className="product-meta-strip">
            <span>{visibleList.length} results</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="featured">Sort by: Featured</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
            </select>
          </div>

          <div className="products-grid">
            {visibleList.map((p) => (
              <div className="product-card" key={p.id} onClick={() => onSelectProduct && onSelectProduct(p)}>
                <div className="product-image">
                  <img src={getProductImage(p.name)} alt={p.name} />
                </div>
                <div className="product-info">
                  <p className="product-category">{getCategory(p.name)}</p>
                  <h3>{p.name}</h3>
                  <div className="rating-row">
                    <span className="stars">{"★".repeat(Math.floor(getRating(p.id)))}{"☆".repeat(5-Math.floor(getRating(p.id)))}</span>
                    <span>{getRating(p.id)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-symbol">$</span>
                    <span className="price-main">{Math.floor(p.price)}</span>
                    <span className="price-decimal">{(p.price % 1).toFixed(2).substring(1)}</span>
                  </div>
                  <p className="shipping">FREE delivery Tomorrow</p>
                </div>
                <button 
                  className="add-cart-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(p);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
