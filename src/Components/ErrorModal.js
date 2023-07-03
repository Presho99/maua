import React from 'react'
import './ErrorModal.css'

function ErrorModal(props) {
  return (
      <div>
          <div className='backdrop'></div>

    <div className='modal'>
        <header className='header'>
            <h2>{props.title}</h2>
        </header>
        <div>
            <p>{props.message}</p>
        </div>
        <footer>
            <button>OK</button>
        </footer>
    </div>
    </div>
  )
}

export default ErrorModal