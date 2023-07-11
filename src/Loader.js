import React, {useEffect, useState} from 'react'
import './Loader.css'

function Loader() {
    const [isRotated, setIsRotated] = useState(false)

    useEffect(() => {
        const rotateTimeout = setTimeout(() => {
            setIsRotated(true)
            setTimeout(() => setIsRotated(false), 1000)
        }, 0)
        return () => clearTimeout(rotateTimeout)
    }, []) 
  return (
    <div className='loader'>
        <div className={`image-container ${isRotated ? 'rotate' : ''}`}>
        <img src='/assets/rosebud.jpg' alt="First Image" className={`loader-image ${isRotated ? 'fade-out' : ''}`} />
      <img src='/assets/rosebloom.webp' alt="Second Image" className={`loader-image ${isRotated ? 'fade-in' : ''}`} /> 
        </div>
    </div>
  )
}

export default Loader