import React, { useState } from "react";
// import { Link } from "react-router-dom"; // Link is no longer used here
import { useNavigate } from "react-router-dom";
 import "./login.css"; // Styles are embedded
 import loginBg from "./assets/login_bg.webp"; // Image is a placeholder
 import Footer from "./footer"; // Placeholder
 import Navbar from "./header"; // Placeholder
// // --- NEW: Placeholder Components to fix import errors ---
// const Navbar = () => (
//   <nav style={{ padding: '20px', backgroundColor: '#fff', textAlign: 'center', borderBottom: '1px solid #eee', fontFamily: 'Poppins, sans-serif' }}>
//     <strong>Nest Nook</strong>
//   </nav>
// );
// const Footer = () => (
//   <footer style={{ padding: '40px', backgroundColor: '#333', color: 'white', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
//     <strong>© 2023 Nest Nook. All rights reserved.</strong>
//   </footer>
// );
// --- End new placeholders ---


export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(""); 

  // --- State for Signup Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirmPass, setShowSignupConfirmPass] = useState(false);
  const [signupError, setSignupError] = useState(""); 


  const togglePassword = () => {
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";
    }
  };

  // --- UPDATED: handleSubmit now uses fetch ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(""); 

    try {
      // --- Use the /api/login route ---
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // --- NEW: Save user data to localStorage ---
      if (data.user) {
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userId", data.user.id);
      }
      
      // --- THIS IS THE CRITICAL FIX ---
      if (data.token) {
        localStorage.setItem("token", data.token); // Save the token!
      }
      // --- End new code ---

      alert("Login successful!");
      navigate(data.redirect); 

    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes("Unexpected token '<'")) {
        setLoginError("Login failed: Could not connect to server. Is it running?");
      } else {
        setLoginError(err.message); 
      }
    }
  };

  // --- Modal Functions ---
  const openModal = () => {
    setIsModalOpen(true);
    setSignupError(""); 
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setShowSignupPass(false);
    setShowSignupConfirmPass(false);
    setSignupError("");
  };

  // --- UPDATED: handleSignupSubmit now uses fetch ---
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError(""); 

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match!");
      return;
    }

    try {
      // --- Use the /api/register route ---
      const response = await fetch("http://localhost:5000/api/register", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      alert("Sign up successful! You can now log in.");
      closeModal();

    } catch (err) {
      console.error("Signup error:", err);
        if (err.message.includes("Unexpected token '<'")) {
         setSignupError("Signup failed: Could not connect to server.");
       } else {
         setSignupError(err.message); // Show error in modal
       }
    }
  };

  return (
    <div className="page">
      <style>{`
        /* === GLOBAL RESET === */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }

        html, body, .page {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
        }

        .page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* === PAGE BACKGROUND === */
        .page-bg {
          background-color: #1a2018;
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* === LOGIN CONTAINER === */
        .login-container {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          background-color: #44433d;
          width: 90%;
          max-width: 1100px; /* Added max-width */
          height: 700px;
          border: 4px solid rgba(201, 191, 191, 0.856);
          overflow: hidden;
          margin-top: 20px;
          margin-bottom: 20px;
          border-radius: 12px; /* Added border-radius */
        }

        /* === LEFT SIDE (IMAGE) === */
        .login-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f2ecd5;
        }

        .login-left img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* === RIGHT SIDE (FORM) === */
        .login-right {
          flex: 1;
          background-color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 70px 90px;
        }

        .login-right h1 {
          color: #4a2f0c;
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #6a4b22;
          margin-bottom: 25px;
          font-weight: 600;
          font-size: 18px;
        }

        form input[type="email"],
        form input[type="password"] {
          width: 100%;
          padding: 12px;
          border: none;
          height: 45px;
          border-radius: 20px;
          background-color: #e6dcaa;
          margin-bottom: 15px;
          font-size: 15px;
        }

        .password-wrapper {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 15px;
          top: 12px;
          cursor: pointer;
          font-size: 18px;
          user-select: none; /* Prevents text selection */
        }

        .login-btn {
          background-color: #4a552b;
          height: 50px;
          color: white;
          padding: 12px 0;
          border: none;
          border-radius: 25px;
          width: 100%;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }

        .login-btn:hover {
          background-color: #3d4823;
        }
        
        .login-error {
          color: #d9534f;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 10px;
          height: 1.2em; /* Reserve space */
        }

        .signup-text {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #4a2f0c;
        }
        
        .signup-link {
          color: #4a552b;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }
        .signup-link:hover {
          text-decoration: underline;
        }

        /* === RESPONSIVE DESIGN === */
        @media (max-width: 900px) {
          .login-container {
            flex-direction: column;
            height: auto;
          }

          .login-left {
            display: none;
          }

          .login-right {
            max-width: 100%;
            padding: 40px 30px;
          }
        }
        
        /* --- UPDATED: Modal Styles --- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background-color: #fff;
          padding: 30px 40px;
          border-radius: 12px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .modal-content h1 {
          color: #4a2f0c;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 25px;
          text-align: center;
        }
        
        .modal-form .form-group {
          position: relative;
          margin-bottom: 20px;
        }
        
        .modal-form label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #6a4b22;
          margin-bottom: 5px;
          display: block;
        }

        .modal-form input[type="text"],
        .modal-form input[type="email"],
        .modal-form input[type="password"] {
          width: 100%;
          padding: 10px 0;
          border: none;
          border-bottom: 2px solid #e6dcaa; /* Underline style */
          height: 40px;
          background-color: transparent; /* Remove background */
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        .modal-form input:focus {
          outline: none;
          border-bottom-color: #4a552b; /* Highlight on focus */
        }
        
        .modal-password-wrapper {
          position: relative;
        }
        
        .modal-toggle-password {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 18px;
          user-select: none;
          color: #888;
        }

        .modal-error {
          color: #d9534f;
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 10px;
          height: 1.2em; /* Reserve space */
        }
        
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .cancel-btn, .signup-btn-modal {
          flex: 1;
          height: 45px;
          padding: 12px 0;
          border: none;
          border-radius: 25px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          font-size: 15px;
        }
        .cancel-btn {
          background-color: #eee;
          color: #555;
          border: 1px solid #ccc;
        }
        .cancel-btn:hover {
          background-color: #ddd;
        }
        .signup-btn-modal {
          background-color: #4a552b;
          color: white;
        }
        .signup-btn-modal:hover {
          background-color: #3d4823;
        }
      `}</style>
      <Navbar />
      <section className="page-bg">
        <div className="login-container">
          <div className="login-left">
            <img 
              src={"https://placehold.co/800x700/f2ecd5/44433d?text=Nest+Nook"} 
              alt="Room Decor" 
              onError={(e) => e.target.src = 'https://placehold.co/800x700'}
            />
          </div>

          <div className="login-right">
            <h1>Welcome!</h1>
            <p className="subtitle">Log in to your account to continue.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="password-wrapper">
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="toggle-password" onClick={togglePassword}>
                  👁
                </span>
              </div>
              <div className="login-error">{loginError}</div> 
              <button type="submit" className="login-btn">
                LOG IN
              </button>
            </form>
            <p className="signup-text">
              Don’t have an account?{' '}
              <span className="signup-link" onClick={openModal}>
                Sign Up
              </span>
            </p>
          </div>
        </div>
      </section>
      <Footer />

      {/* --- Signup Modal --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h1>Create Account</h1>
            <form onSubmit={handleSignupSubmit} className="modal-form">
              
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-pass">Password</label>
                <div className="modal-password-wrapper">
                  <input
                    id="signup-pass"
                    type={showSignupPass ? "text" : "password"}
                    placeholder="Enter password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <span className="modal-toggle-password" onClick={() => setShowSignupPass(!showSignupPass)}>
                    {showSignupPass ? "Hide" : "Show"}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-confirm-pass">Confirm Password</label>
                <div className="modal-password-wrapper">
                  <input
                    id="signup-confirm-pass"
                    type={showSignupConfirmPass ? "text" : "password"}
                    placeholder="Confirm password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  />
                  <span className="modal-toggle-password" onClick={() => setShowSignupConfirmPass(!showSignupConfirmPass)}>
                    {showSignupConfirmPass ? "Hide" : "Show"}
                  </span>
                </div>
              </div>

              <div className="modal-error">{signupError}</div> 

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="signup-btn-modal">
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}