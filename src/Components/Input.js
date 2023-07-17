import React from 'react'
import './Input.css'

const Input = React.forwardRef((props, ref) => {
  return (
    <div className='input-form'>
        <p ref={ref}>{props.children}</p>
    </div>
  )
})

export default Input