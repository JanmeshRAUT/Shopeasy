import React from "react";
import { getProductImage } from "./productImages";

export default function ProductDetail({ product, onBack, onAddToCart, loggedIn, onLoginPrompt }) {
  const handleAddToCart = () => {
    if (!loggedIn) {
      onLoginPrompt();
      return;
    }
    onAddToCart(product);
  };

  const getRating = (id = 0) => Number((3.6 + ((id % 7) * 0.2)).toFixed(1));

  const getCategory = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("keyboard") || n.includes("mouse") || n.includes("hub")) return "Computers";
    if (n.includes("speaker") || n.includes("headphones")) return "Audio";
    if (n.includes("watch") || n.includes("charger")) return "Smart Tech";
    if (n.includes("stand") || n.includes("light")) return "Office";
    return "Accessories";
  };

  return (
    <div className="page product-detail-page">
      <button className="back-btn" onClick={onBack}>
        ← Back to Products
      </button>

      <div className="product-detail-container">
        <div className="product-detail-image">
          <div className="product-image-placeholder">
            <img src={getProductImage(product.name)} alt={product.name} />
          </div>
          <div className="deal-badge">Limited Time Deal</div>
        </div>

        <div className="product-detail-info">
          <p className="breadcrumb">
            Home / Products / {getCategory(product.name)}
          </p>

          <h1>{product.name}</h1>

          <div className="product-meta">
            <span className="rating">⭐ {getRating(product.id)} out of 5</span>
            <span className="separator">•</span>
            <span className="reviews">4,827 reviews</span>
          </div>

          <div className="price-section">
            <p className="original-price">Store Price: <del>${(parseFloat(product.price) * 1.2).toFixed(2)}</del></p>
            <p className="current-price">${typeof product.price === "number" ? product.price.toFixed(2) : product.price}</p>
            <p className="discount-text">Save ${(parseFloat(product.price) * 0.2).toFixed(2)} (17%)</p>
          </div>

          <div className="product-details-section">
            <h3>Key Features</h3>
            <ul className="features-list">
              <li>✓ Premium quality materials</li>
              <li>✓ Built to last with durability</li>
              <li>✓ Easy to use and setup</li>
              <li>✓ Backed by customer support</li>
              <li>✓ Compatible with most devices</li>
            </ul>
          </div>

          <div className="product-details-section">
            <h3>Shipping & Returns</h3>
            <ul className="shipping-list">
              <li>🚚 <strong>FREE</strong> delivery tomorrow for Prime members</li>
              <li>📦 Ships from and sold by ShopEasy</li>
              <li>↩️ <strong>Free 30-day returns</strong> - No questions asked</li>
              <li>🔒 <strong>Secure transaction</strong> with buyer protection</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button className="add-to-cart-primary" onClick={handleAddToCart}>
              + Add to Cart
            </button>
            <button className="buy-now-btn">
              Buy Now
            </button>
          </div>

          {!loggedIn && (
            <div className="login-banner">
              Please <button className="link-btn" onClick={onLoginPrompt}>sign in</button> to add items to your cart
            </div>
          )}

          <div className="seller-info">
            <h3>About This Seller</h3>
            <p>⭐ <strong>ShopEasy</strong> - Trusted Since 2024</p>
            <p>95% positive feedback • Fast shipping • Reliable support</p>
          </div>
        </div>
      </div>

      <div className="product-feedback">
        <h2>Customer Reviews</h2>
        <div className="review-sample">
          <div className="review-item">
            <p className="review-stars">⭐⭐⭐⭐⭐</p>
            <p className="review-title">Perfect Quality!</p>
            <p className="review-text">Exactly as described. Fast shipping and great customer service.</p>
            <p className="review-author">— Sarah M.</p>
          </div>
          <div className="review-item">
            <p className="review-stars">⭐⭐⭐⭐</p>
            <p className="review-title">Great Value for Money</p>
            <p className="review-text">Good quality, arrived quickly. Would buy again!</p>
            <p className="review-author">— James T.</p>
          </div>
          <div className="review-item">
            <p className="review-stars">⭐⭐⭐⭐⭐</p>
            <p className="review-title">Highly Recommend</p>
            <p className="review-text">Exceeded my expectations. Excellent product!</p>
            <p className="review-author">— Emma L.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
