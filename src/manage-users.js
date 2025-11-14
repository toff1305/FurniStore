import React, { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom"; // Replaced with <a>
// import "./manage-users.css"; // Styles are now embedded
 import Topbar from "./topbar-admin"; // Using placeholder

// // --- Topbar Placeholder ---
// const Topbar = () => {
//   return <div className="topbar"></div>;
// };
// --- End Placeholder ---

function ManageUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NEW: Get token from localStorage ---
  const token = localStorage.getItem("token");

  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for column sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'Ascending' });
  const [sortDropdownOpen, setSortDropdownOpen] = useState(null);

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // State for modal form
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [editPhone, setEditPhone] = useState(""); // <-- NEW
  const [editAddress, setEditAddress] = useState(""); // <-- NEW
  
  const tableHeaders = ["User ID", "Name", "Email", "Phone", "Address", "Orders Made"]; // <-- UPDATED

  // --- 1. FETCH ALL USERS ON MOUNT ---
  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users. Is the backend server running?");
      }
      const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Add token as dependency

  // --- 2. FILTER/SORT LOGIC ---
  useEffect(() => {
    let tempUsers = [...allUsers];
    
    // A. Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      tempUsers = tempUsers.filter(user =>
        (user.name?.toLowerCase() || '').includes(lowerQuery) ||
        (user.email?.toLowerCase() || '').includes(lowerQuery) ||
        (user.id?.toLowerCase() || '').includes(lowerQuery) ||
        (user.phone?.toLowerCase() || '').includes(lowerQuery) || // <-- NEW
        (user.address?.toLowerCase() || '').includes(lowerQuery) // <-- NEW
      );
    }

    // B. Sort by Column Header
    if (sortConfig.key) {
      tempUsers.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'orders') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = valA?.toString().toLowerCase() || '';
          valB = valB?.toString().toLowerCase() || '';
        }

        if (valA < valB) return sortConfig.direction === 'Ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'Ascending' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredUsers(tempUsers);
  }, [searchQuery, sortConfig, allUsers]);

  // --- 3. EVENT HANDLERS ---
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const toggleSortDropdown = (key) => {
    setSortDropdownOpen(sortDropdownOpen === key ? null : key);
  };
  
  const handleTableSort = (key, direction) => {
    const keyMap = {
      "User ID": "id",
      "Name": "name",
      "Email": "email",
      "Phone": "phone", // <-- NEW
      "Address": "address", // <-- NEW
      "Orders Made": "orders",
    };
    const dataKey = keyMap[key] || key;
    setSortConfig({ key: dataKey, direction });
    setSortDropdownOpen(null);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handlePrintHistory = () => {
    const printContents = document.getElementById('history-print-area').innerHTML;
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    printWindow.document.write('<html><head><title>User Transaction History</title>');
    printWindow.document.write(`
      <style>
        body { font-family: "Poppins", sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; }
        h2, h3 { text-align: center; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h2>User Transaction History</h2><h3>${currentUser.name}</h3>`);
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `₱${numericPrice.toLocaleString()}`;
  };

  // --- 4. MODAL & CRUD HANDLERS ---
  
  const openEditModal = async (user) => {
    setCurrentUser(user);
    setEditName(user.name);
    setEditPassword(user.password || ""); 
    setEditPhone(user.phone || ""); // <-- NEW
    setEditAddress(user.address || ""); // <-- NEW
    setShowPassword(false); 
    setIsModalOpen(true);
    setLoadingHistory(true);
    
    try {
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/orders`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch order history.");
      const historyData = await response.json();
      setUserHistory(historyData);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setUserHistory([]);
    setEditName("");
    setEditPassword("");
    setEditPhone("");
    setEditAddress("");
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    if (!editName) return alert("Name cannot be empty.");
    
    const payload = {
      name: editName,
      password: editPassword, 
      phone_number: editPhone, // <-- NEW
      shipping_address: editAddress // <-- NEW
    };

    try {
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch(`http://localhost:5000/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.message || "Failed to update user");
      }
      
      alert("User updated successfully!");
      fetchAllUsers(); 
      closeModal();
      
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
  
  const handleUserDelete = async () => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete user ${currentUser.name}? This cannot be undone.`)) {
      try {
        // --- MODIFIED: Added Authorization Header ---
        const response = await fetch(`http://localhost:5000/api/users/${currentUser.id}`, {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
             const errData = await response.json();
             throw new Error(errData.message || "Failed to delete user");
        }
        
        alert("User deleted successfully.");
        setAllUsers(allUsers.filter(u => u.id !== currentUser.id));
        closeModal();

      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };
  

  // --- 5. RENDER ---

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rowsToDisplay =
    filteredUsers.length < 5 ? [...filteredUsers, ...Array(5 - filteredUsers.length).fill(null)] : filteredUsers;

  return (
    <div className="manage-orders-user">
      <style>{`
        /* --- Basic Layout --- */
        .manage-orders-user, .admin-container { 
          display: flex;
          min-height: 100vh;
          background-color: #f5f7fa;
          font-family: 'Poppins', sans-serif;
        }
        .sidebar {
          width: 270px;
          background-color: #08112b;
          color: white;
          padding: 25px 20px;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
        }
        .main-content {
          flex: 1;
          margin-left: 270px;
          padding: 25px 40px;
          background-color: #f5f7fa;
        }
        .header-mf {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header-mf h1 {
          font-size: 1.8rem;
          color: #333;
        }
        
        /* Sidebar Styles */
        .logo-section {
          text-align: center;
          margin-bottom: 25px;
        }
        .logo-circle {
          width: 60px;
          height: 60px;
          background-color: #e8dcaa;
          border-radius: 50%;
          margin: 0 auto 10px;
        }
        .logo-section h2 {
          font-size: 16px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-nav a {
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          padding: 10px 15px;
          border-radius: 8px;
          transition: 0.3s;
        }
        .sidebar-nav a:hover,
        .sidebar-nav a.active {
          background-color: white;
          color: #08112b;
        }
        
        /* Topbar Placeholder */

        .main-content {
           padding-top: 0;
        }
        
        /* Main users container */
        .users-container {
          background-color: #fff;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        /* Search Bar */
        .search-container {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 2px solid #485168;
          border-radius: 20px;
          overflow: hidden;
          width: 330px;
          margin-bottom: 20px;
        }
        .search-container input {
          border: none;
          outline: none;
          padding: 8px 10px;
          flex: 1;
          font-size: 15px;
          color: #485168;
          background: transparent;
        }
        .search-container button {
          background: none;
          border: none;
          color: #1e3a8a;
          cursor: pointer;
          padding: 8px;
        }
        
        /* Table */
        .users-container table {
          width: 100%;
          border-collapse: collapse;
        }
        .users-container th,
        .users-container td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        .users-container th {
          background-color: #485168;
          color: white;
          position: relative;
        }
        .dropdown-wrapper {
          display: inline-block;
          position: relative;
        }
        .dropdown-toggle {
          cursor: pointer;
          user-select: none;
          margin-left: 5px;
        }
        .sort-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: #fff;
          border: 1px solid #ccc;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          z-index: 10;
          border-radius: 5px;
          width: 120px;
          padding: 5px 0;
        }
        .sort-dropdown div {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        .sort-dropdown div:hover {
          background-color: #f0f0f0;
        }
        .empty-row td {
          height: 53px;
          background-color: #f9f9f9;
        }
        
        /* Action Buttons */
        .edit-btn { 
          background-color: #f59e0b; /* Amber */
          color: white;
          border: none;
          border-radius: 5px;
          padding: 6px 12px;
          cursor: pointer;
        }
        .edit-btn:hover {
          background-color: #d97706;
        }
        
        /* Print Toolbar */
        .print-toolbar-mu {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end; 
          align-items: center;
        }
        .print-controls-mu {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .print-controls-mu select {
          display: none; 
        }
        .print-btn-mu {
          background-color: #485168;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        .print-btn-mu:hover {
          background-color: #2f3952;
        }
        
        /* --- Modal Styling --- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          overflow-y: auto; 
        }
        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 800px; 
          max-height: 90vh;
          overflow-y: auto; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          margin: 20px auto; 
        }
        .modal-content h2, .modal-content h3 {
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .modal-form-user {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
        }
        .form-group input,
        .form-group textarea { /* Added textarea */
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          font-family: 'Poppins', sans-serif;
        }
        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input-wrapper input {
          flex: 1;
          padding-right: 60px; /* Make space for the button */
        }
        .password-toggle-btn {
          position: absolute;
          right: 1px;
          top: 1px;
          bottom: 1px;
          background: #eee;
          border: none;
          border-left: 1px solid #ccc;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
          padding: 0 12px;
        }
        .password-toggle-btn:hover {
          background: #ddd;
        }
        
        .modal-actions {
          display: flex;
          justify-content: space-between; 
          gap: 10px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .modal-actions-right {
          display: flex;
          gap: 10px;
        }
        .save-btn, .cancel-btn, .delete-account-btn {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
        }
        .cancel-btn {
          background-color: #ccc;
        }
        .save-btn {
          background-color: #3b82f6;
          color: white;
        }
        .delete-account-btn {
          background-color: #d9534f;
          color: white;
        }
        
        /* History Table */
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .history-table th, .history-table td {
          border: 1px solid #ddd;
          padding: 8px;
          font-size: 0.9rem;
        }
        .history-table th {
          background-color: #f4f4f4;
        }
        
        /* Print Styles */
        @media print {
          body * {
            visibility: hidden;
          }
          #printableArea, #printableArea * {
             visibility: visible;
          }
          #printableArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          .sidebar, .topbar, .search-container, .print-toolbar-mu, .edit-btn, .dropdown-toggle, .header-mf {
            display: none;
          }
          .users-container {
            box-shadow: none;
            padding: 0;
          }
          .users-container table th, .users-container table td {
            border: 1px solid #000;
          }
          .main-content {
            margin-left: 0;
            padding: 0;
          }
          #print-header {
            display: block; 
            text-align: center;
            margin-bottom: 20px;
          }
        }
        #print-header { 
          display: none;
        }
        #history-print-area .print-btn-mu {
          display: none; 
        }
      `}</style>
      {/* --- Sidebar --- */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-circle"></div>
          <h2>Logo & Company Name</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="/admin">Dashboard</a>
          <a href="/view-products">View Products</a>
          <a href="/manage-furnitures">Manage Furnitures</a>
          <a href="/manage-orders">Manage Orders</a>
          <a href="/manage-users" className="active">
            Manage Users
          </a>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <div className="main-content">
        <Topbar />
        <div className="header-mf">
          <h1>MANAGE USERS</h1>
        </div>
            
        <div className="users-container">
          <div className="order-container">
            {/* Search bar */}
            <div className="search-container">
              <input 
                type="text" 
                placeholder="What user are you looking for?"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button>🔍</button>
            </div>

            {/* Table */}
            <div id="printableArea">
              <div id="print-header">
                <h2>Nest & Nook - User Report</h2>
                <p>Date: {today}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    {tableHeaders.map((col) => (
                      <th key={col} style={{ position: "relative", cursor: "pointer" }}>
                        <div className="dropdown-wrapper">
                          <span>{col}</span>
                          <span
                            className="dropdown-toggle"
                            onClick={() => toggleSortDropdown(col)}
                          >
                            ⇅
                          </span>
                          {sortDropdownOpen === col && (
                            <div className="sort-dropdown">
                              <div onClick={() => handleTableSort(col, 'Ascending')}>Ascending</div>
                              <div onClick={() => handleTableSort(col, 'Descending')}>Descending</div>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {rowsToDisplay.map((user, index) =>
                    user ? (
                      <tr key={user.id}>
                        <td>{user.id.slice(-6).toUpperCase()}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{user.address}</td>
                        <td>{user.orders}</td>
                        <td>
                          <button className="edit-btn" onClick={() => openEditModal(user)}>Edit</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={`empty-${index}`} className="empty-row">
                        <td colSpan={tableHeaders.length + 1}></td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* PRINT SECTION */}
            <div className="print-toolbar-mu">
              <div className="print-controls-mu">
                 {/* Dropdowns are hidden per your request */ }
              </div>
              <button className="print-btn-mu" onClick={handlePrint}>🖨️ Print PDF</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- NEW: Edit User Modal --- */}
      {isModalOpen && currentUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User: {currentUser.name}</h2>
            
            <form className="modal-form-user" onSubmit={handleUserUpdate}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="User's password"
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 09123456789"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Shipping Address</label>
                <textarea
                  id="address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Enter shipping address"
                />
              </div>
            </form>

            <div className="history-header">
              <h3>Transaction History</h3>
              <button className="print-btn-mu" onClick={handlePrintHistory}>🖨️ Print History</button>
            </div>
            
            <div id="history-print-area" style={{maxHeight: '300px', overflowY: 'auto'}}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Products</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr><td colSpan="5" style={{textAlign: "center"}}>Loading history...</td></tr>
                  ) : userHistory.length > 0 ? (
                    userHistory.map(order => (
                      <tr key={order.id}>
                        <td>{order.id.slice(-6).toUpperCase()}</td>
                        <td>{formatDate(order.date)}</td>
                        <td>
  {Array.isArray(order.products)
    ? order.products.map((p, idx) => (
        <div key={idx}>
          {p.name} x{p.quantity}
        </div>
      ))
    : "—"}
</td>

                        <td>{formatPrice(order.total)}</td>
                        <td>{order.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{textAlign: "center"}}>No transactions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button type="button" className="delete-account-btn" onClick={handleUserDelete}>Delete Account</button>
              <div className="modal-actions-right">
                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="save-btn" onClick={handleUserUpdate}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;