import React, { useState } from "react";
import "./Cart.css";

function Cart(props) {
  const [selectedValue, setSelectedValue] = useState("");

  const handleChange = (e) => {
    setSelectedValue(e.target.value);
  };

  const handleClick = () => {
    props.hideCartHandler();
  };
  return (
    <div className="cart-backdrop" onClick={handleClick}>
      <div className="cart-modal">
        <div className="items-side">
          <div className="items-header">
            <div>Shopping Cart</div>
            <div>3 Items</div>
          </div>
          <div className="column-heading">
            <div className="first-heading">
              <h3>Product Details</h3>
            </div>
            <div className="second-heading">
              <h3>Quantity</h3>
            </div>
            <div className="third-heading">
              <h3>Price</h3>
            </div>
            <div className="fourth-heading">
              <h3>Total</h3>
            </div>
          </div>
          <div className="continue">

          </div>
        </div>
        <div className="checkout-side">
          <div className="checkout-heading">
            <h3>Order Summary</h3>
          </div>
          <form>
            <div className="checkout-first">
              <h5 className="first-summary">ITEMS 3</h5>
              <div className="first-price">$457.98</div>
            </div>
            <div className="checkout-shipping">
              <label><h5>SHIPPING</h5></label>
              <select value={selectedValue} onChange={handleChange}>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
              </select>
            </div>
            <div className="checkout-promo">
              <label><h5>PROMO CODE</h5></label>
              <input type="text" />
            </div>
            <div className="promo-btn">
              <button>Apply</button>
            </div>
            <div className="checkout-total">
              <h5>Total Cost</h5>
              <p>$462.98</p>
            </div>
            <button className="checkout-btn">Checkout</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Cart;
