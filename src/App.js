import React, {useState} from 'react'
import Home from "./Components/Home";

import Login from "./Components/Login";
import MainHeader from './Components/MainHeader';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const loginHandler = (email, password) => {
    setIsLoggedIn(true)
  }

  const logoutHandler = () => {
    setIsLoggedIn(false)
  }

   // For the cart
   const [cartIsShown, setCartIsShown] = useState(true);

   const showCartHandler = () => {
     setCartIsShown(true)
   }
 
   const hideCartHandler = () => {
     setCartIsShown(false)
   }
  return (
    <div classname="app">
     <MainHeader isAuthenticated={isLoggedIn} onLogout={logoutHandler} showCartHandler={showCartHandler} />
     <main>
       {!isLoggedIn && <Login onLogin = {loginHandler}/>}
       {isLoggedIn && <Home onLogout={logoutHandler} cartIsShown={cartIsShown} hideCartHandler={hideCartHandler}/>}
     </main>
    </div>
  );
}

export default App;
