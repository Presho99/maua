import React from "react";
import "./Login.css";
import Button from "./Button";

function Login() {
  return (
    <div className="login">
      <form>
        <div className="email">
          <input type="email" id="email" />
        </div>

        <div className="password">
          <input type="password" id="password" />
        </div>
        <div className="login-links">
          <a href="#">Forgot Password</a>
          <a href="#">Signup</a>
        </div>

        <div className="login-button">
          <Button type="submit" className="btn-login">
            Login
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Login;
