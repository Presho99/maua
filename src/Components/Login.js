import React, { useState } from "react";
import "./Login.css";
import Button from "./Button";


function Login(props) {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [validEmail, setValidEmail] = useState();
  const [password, setPassword] = useState("");
  const [validPassword, setValidPassword] = useState();
  const [validForm, setValidForm] = useState(false);

  const emailChangeHandler = (e) => {
    setEnteredEmail(e.target.value);
    setValidForm(e.target.value.includes("@") && password.trim().length > 6);
  };

  const validateEmailHandler = () => {
    setValidEmail(enteredEmail.includes("@"));
  };

  const passwordChangeHandler = (e) => {
    setPassword(e.target.value);
    setValidForm(
      e.target.value.trim().length > 6 && enteredEmail.includes("@")
    );
  };

  const validatePasswordHandler = () => {
    setValidPassword(password.trim().length > 6);
  };

  const submitHandler = (e) => {
    e.preventDefault()
    props.onLogin(enteredEmail, password)
  }

  return (
    <div className="login" style={{ backgroundImage: `url(/assets/background.jpeg)` }}>
      <div className="login-container">
        <div className="login-image">
          <img src={"/assets/background.jpeg"} />
        </div>
        <div className="login-name">
          <h3>Maua</h3>
        </div>
        <form onSubmit={submitHandler}>
          <div className="email">
            <input
              type="email"
              id="email"
              onChange={emailChangeHandler}
              value={enteredEmail}
              onBlur={validateEmailHandler}
            />
          </div>

          <div className="password">
            <input
              type="password"
              id="password"
              onChange={passwordChangeHandler}
              value={password}
              onBlur={validatePasswordHandler}
            />
          </div>
          <div className="login-links">
            <a href="#">Forgot Password</a>
            <a href="#">Signup</a>
          </div>

          <div className="login-button">
            <Button type="submit" className="btn-login" disabled={!validForm}>
              Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
