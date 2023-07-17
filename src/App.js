import React, { useEffect, useState, createContext, useContext } from "react";
import Home from "./Components/Home";
import Loader from "./Loader";
import Login from "./Components/Login";
import MainHeader from "./Components/MainHeader";

const cartContext = createContext({
  items: [],
  setItems: () => {},
});

export const useCartContext = () => useContext(cartContext);

function App() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartIsShown, setCartIsShown] = useState(false);
  const [items, setItems] = useState([]);

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

  const showCartHandler = () => {
    setCartIsShown(true);
  };

  const hideCartHandler = () => {
    setCartIsShown(false);
  };
  return (
    <cartContext.Provider classname="app" value={{ items, setItems }}>
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
    </cartContext.Provider>
  );
}

export default App;
