import React, { useEffect, useState } from "react";
import Home from "./Components/Home";
import Loader from "./Loader";
import Login from "./Components/Login";
import MainHeader from "./Components/MainHeader";
import CartProvider from "./store/CartProvider";

function App() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loginHandler = (email, password) => {
    setIsLoggedIn(true);
  };

  const logoutHandler = () => {
    setIsLoggedIn(false);
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);
  // For the cart
  const [cartIsShown, setCartIsShown] = useState(true);

  const showCartHandler = () => {
    setCartIsShown(true);
  };

  const hideCartHandler = () => {
    setCartIsShown(false);
  };
  return (
    <CartProvider classname="app">
      {loading ? (
        <Loader />
      ) : (
        <div>
          <MainHeader
            isAuthenticated={isLoggedIn}
            onLogout={logoutHandler}
            showCartHandler={showCartHandler}
          />
          <main>
            {!isLoggedIn && <Login onLogin={loginHandler} />}
            {isLoggedIn && (
              <Home
                onLogout={logoutHandler}
                cartIsShown={cartIsShown}
                hideCartHandler={hideCartHandler}
              />
            )}
          </main>
        </div>
      )}
    </CartProvider>
  );
}

export default App;
