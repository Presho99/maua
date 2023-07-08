import React from "react";
import "./Navigation.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faCoffee } from "@fortawesome/free-solid-svg-icons";


function Navigation(props) {
  const handleCart = () => {
    props.showCartHandler()
  }
  return (
    <nav>
      
        <div>
          {props.isLoggedIn && (
            <div className="searchbar">
              <form className="ui form search-form">
                <input type="text" placeholder="Search" />
              </form>
            </div>
          )}
        </div>
        <ul>
        <div className="nav-buttons">
        {props.isLoggedIn && (
          <li>
            <img src={"/assets/background.jpeg"} className="nav-avatar" />
          </li>
        )}
        {props.isLoggedIn && (
          <li className="cart-icon">
            <div>
              <FontAwesomeIcon icon={faCartShopping} className="nav-icon" onClick={handleCart}/>
              <div className="cart-notification">1</div>
            </div>
          </li>
        )}
        {props.isLoggedIn && (
          <li>
            <button onClick={props.onLogout}>Logout</button>
          </li>
        )}
        </div>

       
      </ul>
    </nav>
  );
}

export default Navigation;
