import React from 'react'
import Navigation from './Navigation'
import './MainHeader.css'


function MainHeader(props) {
  return (
    <div className='main-header'>
        <h1>Maua</h1>
        <Navigation isLoggedIn={props.isAuthenticated} onLogout={props.onLogout} showCartHandler={props.showCartHandler}/>
        
    </div>
  )
}

export default MainHeader