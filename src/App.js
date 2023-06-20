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
  return (
    <div classname="app">
     <MainHeader isAuthenticated={isLoggedIn} onLogout={logoutHandler}/>
     <main>
       {!isLoggedIn && <Login onLogin = {loginHandler}/>}
       {isLoggedIn && <Home onLogout={logoutHandler}/>}
     </main>
    </div>
  );
}

export default App;
