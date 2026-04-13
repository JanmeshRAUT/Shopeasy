import React, { useState, useEffect } from "react";
import { getProductImage } from "./productImages";

export default function ProductsPage({ loggedIn, onLoginPrompt, initialSearch = "", onAddToCart, onSelectProduct }) {
  const PRODUCTS_PER_PAGE = 12;
  const [products, setProducts]   = useState([]);
  const [searchQ, setSearchQ]     = useState(initialSearch);
  const [results, setResults]     = useState(null);
  const [rawQuery, setRawQuery]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [notice, setNotice]       = useState("");
  const [category, setCategory]   = useState("All");
  const [sortBy, setSortBy]       = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setSearchQ(initialSearch || "");
    setCurrentPage(1);
  }, [initialSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, sortBy, results]);

  // VULNERABILITY: Input is sent raw to backend - SQL Injection possible
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(searchQ)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setRawQuery(data.query);
      } else {
        setError(data.error || "Query failed");
        setRawQuery(data.query || "");
        setResults([]);
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQ("");
    setResults(null);
    setRawQuery("");
    setError("");
    setNotice("");
    setCurrentPage(1);
  };

  const handleAddToCart = (product) => {
    if (!loggedIn) {
      setNotice("Please sign in to add products to your cart.");
      if (onLoginPrompt) onLoginPrompt();
      return;
    }
    setNotice("Added to cart (demo mode).");
    if (onAddToCart) onAddToCart(product);
    
    // Auto-dismiss notice after 3 seconds
    setTimeout(() => {
      setNotice("");
    }, 3000);
  };

  const displayList = results !== null ? results : products;
  const departments = ["All", ...Array.from(new Set(products.map((p) => getCategory(p.name))))];

  const visibleList = displayList
    .filter((p) => category === "All" || getCategory(p.name) === category)
    .sort((a, b) => {
      if (sortBy === "priceLow") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "priceHigh") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "rating") return getRating(b.id) - getRating(a.id);
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(visibleList.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedList = visibleList.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page products-page">
      <div className="products-header">
        <h2>🛍️ All Products</h2>
        <p>Find the best deals on ShopEasy</p>
      </div>

      <div className="product-meta-strip">
        <strong>{visibleList.length} products available</strong>
        <span>Page {Math.min(currentPage, totalPages || 1)} of {totalPages || 1}</span>
      </div>

      <div className="catalog-top-row">
        <div className="crumbs">Home / Today's Deals / Catalog</div>
        <div className="delivery-pill">Prime-style fast shipping in this lab demo</div>
      </div>

      {!loggedIn && (
        <div className="guest-banner">
          You are exploring as a guest. Search and browse are open, checkout actions require sign in.
        </div>
      )}

      <div className="catalog-controls">
        <div className="departments">
          {departments.map((dep) => (
            <button
              key={dep}
              className={`chip ${category === dep ? "active" : ""}`}
              onClick={() => setCategory(dep)}
            >
              {dep}
            </button>
          ))}
        </div>
        <label className="sort-wrap">
          Sort by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </label>
      </div>

      {/* Search Bar - VULNERABLE TO SQL INJECTION */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search products... (try: ' UNION SELECT id,username,password FROM users--)"
          className="search-input"
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? "..." : "Search"}
        </button>
        {results !== null && (
          <button type="button" onClick={clearSearch} className="clear-btn">
            Clear
          </button>
        )}
      </form>

      {/* Show raw SQL query for educational purposes */}
      {rawQuery && (
        <div className="sql-debug">
          <strong>🔍 Executed SQL:</strong>
          <code>{rawQuery}</code>
        </div>
      )}

      {error && (
        <div className="error-box">⚠️ SQL Error: {error}</div>
      )}

      {notice && <div className="notice-box">{notice}</div>}

      {results !== null && (
        <p className="result-count">
          Found <strong>{visibleList.length}</strong> result(s) for "{searchQ}"
        </p>
      )}

      {/* Product Grid with Pagination */}
      <div className="products-grid">
        {visibleList.length === 0 ? (
          <div className="empty-state">No products found.</div>
        ) : (
          paginatedList.map((p, i) => (
            <div className="product-card" key={`${p.id}-${i}`} onClick={() => onSelectProduct && onSelectProduct(p)}>
              <div className="deal-tag">Limited time deal</div>
              <div className="product-image">
                <img src={getProductImage(p.name)} alt={p.name} />
              </div>
              <div className="product-info">
                <p className="product-category">{getCategory(p.name)}</p>
                <h3>{p.name}</h3>
                <p className="price">${typeof p.price === "number" ? p.price.toFixed(2) : p.price}</p>
                <p className="rating">⭐ {getRating(p.id)} · 120+ bought recently</p>
                <p className="shipping">FREE delivery Tomorrow</p>
              </div>
              <button 
                className="add-cart-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(p);
                }}
              >
                Add to Cart
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {visibleList.length > PRODUCTS_PER_PAGE && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, visibleList.length)} of {visibleList.length} products
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination-page ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="pagination-ellipsis">...</span>
                  <button
                    className="pagination-page"
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
