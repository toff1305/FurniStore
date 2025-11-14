import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; 
// --- MODIFIED: Removed the import for user-header ---
 import UserNavbar from "./user-header"; 

// // --- NEW: Embedded UserNavbar placeholder ---
// const UserNavbar = ({ navigate }) => {
//   const [userName, setUserName] = useState("User");
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedName = localStorage.getItem("userName");
//       if (storedName) {
//         setUserName(storedName);
//       }
//     }
//   }, []);

//   return (
//     <nav style={{ 
//       display: 'flex', 
//       justifyContent: 'space-between', 
//       alignItems: 'center', 
//       padding: '15px 40px', 
//       backgroundColor: '#fff', 
//       borderBottom: '2px solid #f0f0f0',
//       fontFamily: 'Poppins, sans-serif',
//       // --- Styles for sticky header ---
//       height: '82px', // Fixed height
//       position: 'sticky',
//       top: 0,
//       zIndex: 900
//     }}>
//       <Link to="/shop" style={{textDecoration: 'none', color: '#08112b'}}>
//         <span style={{fontWeight: 'bold', fontSize: '1.5rem'}}>Nest & Nook</span>
//       </Link>
//       <span>Welcome back, {userName}!</span>
//       <div style={{display: 'flex', gap: '20px', fontSize: '1.5rem', cursor: 'pointer'}}>
//         <span onClick={() => navigate("/cart")} title="Cart" style={{textDecoration: 'none', cursor: 'pointer'}}>🛒</span>
//         <span onClick={() => navigate("/profile_user")} title="My Orders" style={{textDecoration: 'none', cursor: 'pointer'}}>📦</span>
//         <span onClick={() => navigate("/profile")} title="My Profile" style={{textDecoration: 'none', cursor: 'pointer'}}>👤</span>
//       </div>
//     </nav>
//   );
// };
// // --- End Placeholder ---

// // --- NEW: Placeholder for Footer ---
// const Footer = () => (
//   <footer style={{ padding: '40px', backgroundColor: '#333', color: 'white', textAlign: 'center', fontFamily: 'Poppins, sans-serif', marginTop: '40px' }}>
//     <strong>© 2023 Nest Nook. All rights reserved.</strong>
//   </footer>
// );
// --- End Placeholder ---


function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for Data ---
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    spent: 0
  });

  // --- State for Profile Edit Modal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    email: "",
    phone_number: "",
    shipping_address: ""
  });
  const [modalError, setModalError] = useState("");

  // --- Get token and user data ---
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  // --- Helper Functions ---
  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `₱${numericPrice.toLocaleString()}`;
  };

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!userId || !token) { 
      navigate("/login"); 
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        fetch(`http://localhost:5000/api/profile/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/profile/me/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!profileRes.ok) throw new Error("Failed to fetch your profile. Please log in again.");
      if (!ordersRes.ok) throw new Error("Failed to fetch your orders.");
      
      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();

      setUser(profileData);
      setOrders(ordersData); 
      
      // Calculate Stats
      const pendingOrders = ordersData.filter(o => o.status === 'Pending' || o.status === 'To Ship' || o.status === 'To Receive').length;
      const completedOrders = ordersData.filter(o => o.status === 'Completed').length;
      const totalSpent = ordersData
        .filter(o => o.status === 'Completed')
        .reduce((acc, order) => acc + order.total, 0);

      setStats({
        total: ordersData.length,
        pending: pendingOrders,
        completed: completedOrders,
        spent: totalSpent
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, navigate, token]);

  // --- Profile Modal & Form Handlers ---
  const openEditModal = () => {
    if (!user) return; 
    setEditForm({
      customer_name: user.customer_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      shipping_address: user.shipping_address || ""
    });
    setModalError("");
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => setIsEditModalOpen(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setModalError("");
    try {
      const response = await fetch(`http://localhost:5000/api/profile/me`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update profile.");
      setUser(data); 
      localStorage.setItem("userName", data.customer_name);
      alert("Profile updated successfully!");
      closeEditModal();
    } catch (err) {
      setModalError(err.message);
    }
  };
  
  const goBack = () => navigate("/shop");


  return (
    <div className="ud-container">
      <style>{`
        /* --- Global --- */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        .ud-container {
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        /* --- NEW: Spacer for sticky header --- */
        .header-spacer {
          height: 82px; /* Must match the header's height */
        }

        /* --- Go Back Button --- */
        .uc-back-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 40px 0;
          cursor: pointer;
        }
        .uc-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #fff;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .uc-back-btn:hover {
          background-color: #f0f0f0;
        }
        .uc-back-text {
          font-weight: 500;
          font-size: 1rem;
          color: #333;
        }

        /* --- Main Content --- */
        .ud-main-content {
          padding: 20px 40px;
        }
        
        /* --- Main Grid Layout --- */
        .ud-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start; /* Changed from stretch */
        }
        @media (max-width: 1200px) {
          .ud-main-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .ud-section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          background-color: #8c7a6b; 
          margin: 0;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
        }
        
        .ud-grid-item {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden; 
        }
        
        .ud-grid-item-content {
          padding: 20px;
          overflow-y: auto; 
          flex-grow: 1;
        }
        
        .ud-placeholder-text {
          color: #777;
          font-style: italic;
          text-align: center;
          padding-top: 50px;
        }

        /* --- NEW: Overview Stats Section --- */
        .ud-overview-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .stat-card {
          background-color: #f7f3e8;
          border: 1px solid #e6dcaa;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-card h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #4a552b;
          margin: 0 0 5px 0;
        }
        .stat-card p {
          font-size: 1rem;
          font-weight: 500;
          color: #6a4b22;
          margin: 0;
        }

        /* --- Profile Section --- */
        .ud-profile-section {
          background-color: #fff;
          padding: 0; 
          overflow: hidden; 
        }
        .ud-profile-item {
          display: flex;
          align-items: center;
          padding: 15px 20px; 
          border-bottom: 1px solid #f0f0f0;
        }
        .ud-profile-item:last-child {
          border-bottom: none;
        }
        .ud-profile-item label {
          font-weight: 600;
          color: #333;
          width: 150px;
          flex-shrink: 0;
        }
        .ud-info-text {
          color: #555;
          flex-grow: 1;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ud-edit-btn {
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          color: #333;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          margin-left: 10px;
        }
        .ud-edit-btn:hover {
          background-color: #e0e0e0;
        }
        
        /* --- MODIFIED: Modal Styles (Renamed) --- */
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: flex-start; /* Was center */
          overflow-y: auto; /* Allow the overlay to scroll */
          padding: 20px 0; /* Add some padding so modal doesn't touch top */
          z-index: 1000;
        }
        .profile-modal-content {
          background-color: #fff;
          padding: 30px 40px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          margin: 0 auto 5vh; 
        }
        .profile-modal-content h2 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 25px;
          text-align: center;
        }
        .profile-modal-form .form-group {
          margin-bottom: 15px;
        }
        .profile-modal-form label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 5px;
          color: #555;
        }
        .profile-modal-form input,
        .profile-modal-form textarea,
        .profile-modal-form select {
          width: 100%;
          padding: 10px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
        }
        .profile-modal-form textarea {
          resize: vertical;
          min-height: 80px;
        }
        .profile-modal-error {
          color: #d9534f;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 10px;
          height: 1.2em;
        }
        .profile-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .profile-modal-cancel-btn, .profile-modal-save-btn {
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
        .profile-modal-cancel-btn {
          background-color: #eee;
          color: #555;
          border: 1px solid #ccc;
        }
        .profile-modal-cancel-btn:hover {
          background-color: #ddd;
        }
        .profile-modal-save-btn {
          background-color: #485168;
          color: white;
        }
        .profile-modal-save-btn:hover {
            background-color: #3a4255;
        }
      `}</style>
      <UserNavbar navigate={navigate} />
      
      {/* --- NEW: Add the spacer div here --- */}
      <div className="header-spacer"></div>

      <div className="uc-back-wrapper">
        <div className="uc-back-btn" onClick={goBack}>
          &larr;
        </div>
        <span className="uc-back-text">Go Back To Shop</span>
      </div>

      {loading ? (
        <p className="ud-placeholder-text">Loading your profile...</p>
      ) : error ? (
        <p className="ud-placeholder-text" style={{color: 'red'}}>{error}</p>
      ) : (
        <>
          {/* MAIN CONTENT */}
          <main className="ud-main-content">
            <div className="ud-main-grid">
              
              {/* --- NEW: OVERVIEW SECTION --- */}
              <section className="ud-grid-item ud-overview">
                <h2 className="ud-section-title">MY OVERVIEW</h2>
                <div className="ud-grid-item-content">
                  <div className="ud-overview-stats">
                    <div className="stat-card">
                      <h3>{stats.total}</h3>
                      <p>Total Orders</p>
                    </div>
                    <div className="stat-card">
                      <h3>{stats.pending}</h3>
                      <p>Pending Orders</p>
                    </div>
                    <div className="stat-card">
                      <h3>{stats.completed}</h3>
                      <p>Completed Orders</p>
                    </div>
                    <div className="stat-card">
                      <h3>{formatPrice(stats.spent)}</h3>
                      <p>Total Spent</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* PROFILE SECTION */}
              {user && (
                <section id="ud-profile-section" className="ud-grid-item ud-profile-section">
                  <h2 className="ud-section-title">PROFILE INFORMATION</h2>
                  <div className="ud-grid-item-content">
                    <div className="ud-profile-item">
                      <label>Name:</label>
                      <span className="ud-info-text">{user.customer_name}</span>
                      <button className="ud-edit-btn" onClick={openEditModal}>Edit</button>
                    </div>
                    <div className="ud-profile-item">
                      <label>Email:</label>
                      <span className="ud-info-text">{user.email}</span>
                      <button className="ud-edit-btn" onClick={openEditModal}>Edit</button>
                    </div>
                    <div className="ud-profile-item">
                      <label>Phone Number:</label>
                      <span className="ud-info-text">{user.phone_number || "Not set"}</span>
                      <button className="ud-edit-btn" onClick={openEditModal}>Edit</button>
                    </div>
                    <div className="ud-profile-item">
                      <label>Address:</label>
                      <span className="ud-info-text" style={{whiteSpace: 'pre-wrap'}}>{user.shipping_address || "Not set"}</span>
                      <button className="ud-edit-btn" onClick={openEditModal}>Edit</button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </main>
        </>
      )}
      
      {/* --- Edit Profile Modal (MODIFIED with new class names) --- */}
      {isEditModalOpen && (
        <div className="profile-modal-overlay" onClick={closeEditModal}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleProfileUpdate} className="profile-modal-form">
              <div className="form-group">
                <label htmlFor="customer_name">Full Name</label>
                <input id="customer_name" name="customer_name" type="text" value={editForm.customer_name} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={editForm.email} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input id="phone_number" name="phone_number" type="tel" value={editForm.phone_number} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label htmlFor="shipping_address">Shipping Address</label>
                <textarea id="shipping_address" name="shipping_address" value={editForm.shipping_address} onChange={handleFormChange} />
              </div>
              <div className="profile-modal-error">{modalError}</div>
              <div className="profile-modal-actions">
                <button type="button" className="profile-modal-cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="profile-modal-save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- All other modals from profile_user.js are intentionally removed --- */}
      
      {/* --- NEW: Added Footer component --- */}
      {/* <Footer /> */}
    </div>
  );
};

export default UserProfile;