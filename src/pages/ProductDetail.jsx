import React from "react";
import { getProductImage } from "../utils/productImages";
import "../styles/ProductDetail.css";

export default function ProductDetail({ product, onBack, onAddToCart, loggedIn, onLoginPrompt }) {
  const getRating = (id = 0) => Number((3.6 + ((id % 7) * 0.2)).toFixed(1));
  
  return (
    <div className="page product-detail-page">
      <div className="back-link" onClick={onBack}>
        ‹ Back to results
      </div>

      <div className="product-detail-layout">
        <div className="detail-images">
          <div className="main-image">
            <img src={getProductImage(product.name)} alt={product.name} />
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-brand">Brand: ShopEasy Premium</div>
          <h1>{product.name}</h1>
          
          <div className="detail-rating">
            <span className="stars" style={{color: '#ffa41c'}}>{"★".repeat(Math.floor(getRating(product.id)))}{"☆".repeat(5-Math.floor(getRating(product.id)))}</span>
            <span style={{color: 'var(--link)'}}>{getRating(product.id)} ratings</span>
            <span style={{color: 'var(--border)'}}>|</span>
            <span style={{color: 'var(--link)'}}>Search this page</span>
          </div>

          <div className="detail-price-section">
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span className="discount-badge">-20%</span>
              <span className="actual-price">
                <span style={{fontSize: '0.8rem', verticalAlign: 'super'}}>$</span>
                {Math.floor(product.price)}
                <span style={{fontSize: '0.8rem', verticalAlign: 'super'}}>{(product.price % 1).toFixed(2).substring(2)}</span>
              </span>
            </div>
            <div className="list-price">List Price: ${ (product.price * 1.2).toFixed(2) }</div>
          </div>

          <div className="detail-features">
            <h3>About this item</h3>
            <ul>
              <li>High-quality materials ensure durability and long-lasting performance.</li>
              <li>Sleek, modern design that complements any workspace or home environment.</li>
              <li>Easy to use with plug-and-play functionality for most devices.</li>
              <li>Backed by our 1-year warranty and dedicated customer support.</li>
              <li>Includes all necessary accessories for a complete setup experience.</li>
            </ul>
          </div>
        </div>

        <div className="buy-box">
          <div className="price-row">
            <span style={{fontSize: '0.8rem', verticalAlign: 'super'}}>$</span>
            {Math.floor(product.price)}
            <span style={{fontSize: '0.8rem', verticalAlign: 'super'}}>{(product.price % 1).toFixed(2).substring(2)}</span>
          </div>
          
          <div className="delivery-info">
            <p>FREE delivery <strong>Tomorrow</strong>. Order within <strong>5 hrs 12 mins</strong></p>
            <p style={{color: 'var(--link)', marginTop: '5px'}}>Deliver to Student Lab Zone</p>
          </div>

          <div className="stock-status">In Stock</div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <button className="add-to-cart-btn" onClick={() => onAddToCart(product)}>Add to Cart</button>
            <button className="buy-now-btn">Buy Now</button>
          </div>

          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
            <p style={{display: 'flex', justifyContent: 'space-between'}}><span>Ships from</span> <strong>ShopEasy</strong></p>
            <p style={{display: 'flex', justifyContent: 'space-between'}}><span>Sold by</span> <strong>ShopEasy</strong></p>
            <p style={{display: 'flex', justifyContent: 'space-between', marginTop: '10px'}}><span style={{color: 'var(--link)'}}>Return policy: Eligible for Return, Refund or Replacement within 30 days of receipt</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
