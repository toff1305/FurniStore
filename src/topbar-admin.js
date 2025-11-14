import React from "react";
import "./topbar-admin.css"; // make sure this links to your CSS file
import { Link } from 'react-router-dom';
function Topbar() {
  return (
    <header className="topbar">
      <h2>Hello, Admin!</h2>


      <div className="user-profile">
        <div className="profile-pic"></div>
        <span>Admin</span>
       
<Link to="/">
  <button className="logout-btn">LOG OUT</button>
</Link>
      </div>
    </header>
  );
}

export default Topbar;
