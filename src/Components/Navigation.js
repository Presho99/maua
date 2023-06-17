import React from 'react'
import './Navigation.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
  import { faCartShopping, faCoffee } from '@fortawesome/free-solid-svg-icons'
  import avatar from '../assets/background.jpeg'

function Navigation(props) {
  return (
    <nav>
        <ul>
            {props.isLoggedIn && (
                <li>
                   <img src={avatar} className="nav-avatar"/>
                </li>
            )}
            {props.isLoggedIn && (
                <li>
                    <a href="/">
                        <FontAwesomeIcon icon={faCartShopping} className="nav-icon"/>
                    </a>
                </li>
            )}
            {props.isLoggedIn && (
                <li>
                    <button onClick={props.onLogout}>Logout</button>
                </li>
            )}
        </ul>
    </nav>
  )
}

export default Navigation