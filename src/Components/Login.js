import React, { useState } from "react";
import "./Login.css";
import Button from "./Button";
import ErrorModal from "./ErrorModal";

function Login(props) {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [validEmail, setValidEmail] = useState();
  const [password, setPassword] = useState("");
  const [validPassword, setValidPassword] = useState();
  const [validForm, setValidForm] = useState(false);
  const [error, setError] = useState();

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
    e.preventDefault();
    if (enteredEmail.trim().length === 0 || password.trim().length === 0) {
      setError({
        title: "Invalid input",
        message:
          "Please enter a valid email address and password (non-empty values)",
      });
    } else if (password.trim().length < 8) {
      setError({
        title: "Invalid password",
        message: "Password should be at least 8 characters",
      });
    } else props.onLogin(enteredEmail, password);
  };

  return (
    <div>
      {error && <ErrorModal title={error.title} message={error.message} />}
      <div className="login" style={{ backgroundImage: `url('/logo.webp')` }}>
        <div className="login-container">
          <div className="login-deets">
            <h2>Welcome Back!</h2>
           
            <form onSubmit={submitHandler}>
              <div className="email">
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  onChange={emailChangeHandler}
                  value={enteredEmail}
                  onBlur={validateEmailHandler}
                />
              </div>

              <div className="password">
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  onChange={passwordChangeHandler}
                  value={password}
                  onBlur={validatePasswordHandler}
                />
              </div>

              <div className="login-button">
                <Button
                  type="submit"
                  className="btn-login"
                  disabled={!validForm}
                >
                  Login
                </Button>
              </div>

              <div className="google-button">
                <Button
                  type="submit"
                  className="btn-google"
                  disabled={!validForm}
                >
                  <img src="/assets/google.png"/>
                  <p>Sign in with google</p>
                </Button>
              </div>
              <div className="login-links">
                <a href="#">Forgot Password</a>
                <a href="#">Signup</a>
              </div>
            </form>
          </div>
          <div className="login-right">
            <div className="right-image">
              <img src="/logo.webp"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
