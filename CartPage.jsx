import React from "react";
import { getProductImage } from "./productImages";

export default function CartPage({ cartItems, onRemoveFromCart, onCheckout, loggedIn, onLoginPrompt }) {
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2);

  const handleCheckout = () => {
    if (!loggedIn) {
      onLoginPrompt();
      return;
    }
    onCheckout();
  };

  return (
    <div className="page cart-page">
      <div className="cart-header">
        <h2>🛒 Shopping Cart</h2>
        <p>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add items from our catalog to get started</p>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items-section">
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <div className="cart-item" key={`${item.id}-${index}`}>
                  <div className="item-image">
                    <img src={getProductImage(item.name)} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="item-price">${typeof item.price === "number" ? item.price.toFixed(2) : item.price}</p>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveFromCart(index)}
                    title="Remove from cart"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>${totalPrice}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">FREE</span>
              </div>

              <div className="summary-row">
                <span>Tax (estimated)</span>
                <span>${(parseFloat(totalPrice) * 0.08).toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Total</span>
                <span>${(parseFloat(totalPrice) + parseFloat(totalPrice) * 0.08).toFixed(2)}</span>
              </div>

              <button
                className="checkout-btn"
                onClick={handleCheckout}
              >
                {loggedIn ? "Proceed to Checkout" : "Sign In to Checkout"}
              </button>

              {!loggedIn && (
                <p className="login-hint">You need to sign in to complete your purchase</p>
              )}
            </div>

            <div className="trust-badges">
              <div className="badge">✓ Secure Checkout</div>
              <div className="badge">✓ Free Returns</div>
              <div className="badge">✓ Money-back Guarantee</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
