import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./signup.css";
import loginBg from "./assets/login_bg.webp";
import Footer from "./footer";
import Navbar from "./header"

export default function Signup() {
  // state for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="page">
<Navbar/>
      {/* Main Container */}
      <div className="signup-container">
        <div className="signup-left">
          <h1>Hello, there!</h1>
          <p className="subtitle">You need an account to continue.</p>

          <form>
            <input type="text" placeholder="Full Name" required />
            <input type="email" placeholder="Email" required />

            {/* Password field with toggle */}
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁
              </span>
            </div>

            {/* Confirm Password field with toggle */}
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm Password"
                required
              />
              <span
                className="toggle-password"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                👁
              </span>
            </div>

            <label className="terms">
              <input type="checkbox" required /> I agree to the Terms &
              Conditions
            </label>

            <button type="submit" className="signup-btn">
              SIGN UP
            </button>
          </form>

          <p className="signup-text">
            Already have an account?<Link to="/login"> Log In</Link>
          </p>
        </div>

        <div className="signup-right">
          <img src={loginBg} alt="Room Decor" />
        </div>
      </div>
<Footer/>
    </div>
  );
}
