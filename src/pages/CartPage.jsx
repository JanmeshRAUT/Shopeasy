import React from "react";
import { getProductImage } from "../utils/productImages";
import "../styles/CartPage.css";

export default function CartPage({ cartItems, onRemoveFromCart, onCheckout, loggedIn, onLoginPrompt }) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2);

  return (
    <div className="page cart-page">
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <h2>Your ShopEasy Cart is empty</h2>
          <p>Check your Saved Items or continue shopping.</p>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items-section">
            <h2>Shopping Cart</h2>
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <div className="cart-item" key={`${item.id}-${index}`}>
                  <div className="item-image">
                    <img src={getProductImage(item.name)} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="stock-status">In Stock</p>
                    <div className="remove-link" onClick={() => onRemoveFromCart(index)}>Delete</div>
                  </div>
                  <div className="item-price-col">
                    ${typeof item.price === "number" ? item.price.toFixed(2) : item.price}
                  </div>
                </div>
              ))}
            </div>
            <div style={{textAlign: 'right', marginTop: '20px', fontSize: '1.2rem'}}>
              Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}): <strong>${subtotal}</strong>
            </div>
          </div>

          <aside className="cart-summary">
            <div className="subtotal-row">
              Subtotal ({cartItems.length} items): <strong>${subtotal}</strong>
            </div>
            <div style={{fontSize: '0.85rem', display: 'flex', gap: '5px'}}>
              <input type="checkbox" /> This order contains a gift
            </div>
            <button className="checkout-btn" onClick={onCheckout}>
              Proceed to checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
