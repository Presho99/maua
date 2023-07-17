import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useContext } from "react";
import { useCartContext } from "../App";
import CartContext from "../store/cart-context";
import "./Cart.css";

function Cart(props) {
  const {items, setItems} = useCartContext()
  const cartCtx = useContext(CartContext)
  const [selectedValue, setSelectedValue] = useState("");

  const handleChange = (e) => {
    setSelectedValue(e.target.value);
  };

  const handleClick = () => {
    props.hideCartHandler();
  };

  const totalAmount =`$${items.reduce((acc, current) => acc + (current.flower.price * current.quantity), 0)}`
  const hasItems = cartCtx.items.length > 0

  const cartItems = (
    <ul>
      {items.map((item) => {
       return <li>{item.flower.name}</li>
      })}
    </ul>
  )
  return (
    <div className="cart-backdrop">
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
          <div className="outputted-items">
          
              {cartItems}
            
          </div>
          <div className="continue">
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="continue-icon"
              onClick={handleClick}
            />
            <p>Continue Shopping</p>
          </div>
        </div>
        <div className="checkout-side">
          <div className="checkout-heading">
            <h3>Order Summary</h3>
          </div>
          <form>
            <div className="checkout-first">
              <h5 className="first-summary">ITEMS 3</h5>
              <div className="first-price">{totalAmount}</div>
            </div>
            <div className="checkout-shipping">
              <label>
                <h5>SHIPPING</h5>
              </label>
              <select value={selectedValue} onChange={handleChange}>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
              </select>
            </div>
            <div className="checkout-promo">
              <label>
                <h5>PROMO CODE</h5>
              </label>
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

function CartItem(){
  <div className="cart-row">
    <div className="first-col">
      
    </div>
    <div className="second-col"></div>
    <div className="third-col"></div>
    <div className="fourth-col"></div>

  </div>}