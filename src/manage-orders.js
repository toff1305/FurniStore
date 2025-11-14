import React, { useState, useEffect, useRef } from "react";
import "./manage-orders.css"; // Styles are embedded below
 import Topbar from "./topbar-admin"; // Using placeholder

// // --- Topbar Placeholder ---
// const Topbar = () => {
//   return <div className="topbar"></div>;
// };
// --- End Placeholder ---

function ManageOrders() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NEW: Get token from localStorage ---
  const token = localStorage.getItem("token");

  // --- NEW: State for Tab Navigation ---
  const [activeTab, setActiveTab] = useState("Pending");
  
  const [searchTerms, setSearchTerms] = useState({
    "Pending": "",
    "To Ship": "",
    "To Receive": "",
    "Completed": "",
    "Cancelled": "",
  });

  const [sortConfigs, setSortConfigs] = useState({
    "Pending": { key: 'date', direction: 'Descending' },
    "To Ship": { key: 'date', direction: 'Descending' },
    "To Receive": { key: 'date', direction: 'Descending' },
    "Completed": { key: 'date', direction: 'Descending' },
    "Cancelled": { key: 'date', direction: 'Descending' },
  });

  const [dropdownOpen, setDropdownOpen] = useState(null); 
  
  const [actionHistory, setActionHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingDetailModal, setLoadingDetailModal] = useState(false);
  
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  
  const [lockedOrderIds, setLockedOrderIds] = useState(new Set());
  
  const sectionRefs = {
    "Pending": useRef(null),
    "To Ship": useRef(null),
    "To Receive": useRef(null),
    "Completed": useRef(null),
    "Cancelled": useRef(null),
  };
  
  // --- NEW: State for Column Visibility ---
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    "Order ID": true,
    "Order Date": true,
    "User ID": true,
    "Name": true,
    "Payment Method": true,
    "Total Price": true,
    "Actions": true
  });
  
  const orderSections = ["Pending", "To Ship", "To Receive", "Completed", "Cancelled"];
  
  // --- Use an object for base headers to manage visibility state ---
  const baseTableHeaders = {
    "Order ID": "orderId",
    "Order Date": "date",
    "User ID": "userId",
    "Name": "name",
    "Payment Method": "payment",
    "Total Price": "total",
  };
  const headerKeys = Object.keys(baseTableHeaders);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- MODIFIED: Added Authorization Header ---
        const response = await fetch("http://localhost:5000/api/orders", {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch orders. Are you logged in as an admin?");
        }
        const data = await response.json();
        setAllOrders(data);
        // --- NEW: Initialize lockedOrderIds Set from fetched data ---
        const lockedIds = new Set();
        data.forEach(order => {
          if (order.isLocked) {
            lockedIds.add(order.id);
          }
        });
        setLockedOrderIds(lockedIds);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]); // Add token as dependency
  
  // --- Effect to clear highlight after animation ---
  useEffect(() => {
    if (highlightedOrderId) {
      const timer = setTimeout(() => {
        setHighlightedOrderId(null);
      }, 2500); // Must match CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [highlightedOrderId]);

  // --- 2. HANDLERS ---
  
  const handleSearchChange = (status, value) => {
    setSearchTerms(prev => ({ ...prev, [status]: value }));
  };

  const toggleSortDropdown = (key) => {
    setDropdownOpen(dropdownOpen === key ? null : key);
  };
  
  const handleTableSort = (status, key, direction) => {
    const dataKey = baseTableHeaders[key] || key;
    
    setSortConfigs(prev => ({
      ...prev,
      [status]: { key: dataKey, direction }
    }));
    setDropdownOpen(null);
  };
  
  // --- Toggle Lock Function ---
  const handleToggleLock = async (orderId) => {
    const originalOrders = [...allOrders];
    
    // Optimistically update UI
    setAllOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, isLocked: !order.isLocked } : order
      )
    );
    // Update the Set as well
    setLockedOrderIds(prevLockedIds => {
      const newLockedIds = new Set(prevLockedIds);
      if (newLockedIds.has(orderId)) {
        newLockedIds.delete(orderId);
      } else {
        newLockedIds.add(orderId);
      }
      return newLockedIds;
    });

    try {
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/toggle-lock`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to update lock status");
      }
      
      const data = await response.json();
      
      // Re-sync with server response
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.id ? { ...order, isLocked: data.isLocked } : order
        )
      );

    } catch (err) {
      alert("Error: " + err.message);
      setAllOrders(originalOrders); // Revert on failure
      // Revert the Set
      setLockedOrderIds(prevLockedIds => {
        const newLockedIds = new Set(prevLockedIds);
        if (newLockedIds.has(orderId)) {
          newLockedIds.delete(orderId);
        } else {
          newLockedIds.add(orderId);
        }
        return newLockedIds;
      });
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, isUndo = false) => {
    const originalOrders = [...allOrders];
    const orderToUpdate = allOrders.find(o => o.id === orderId);
    
    if (!orderToUpdate) return;
    
    // --- CHECK LOCK STATUS ---
    if (orderToUpdate.isLocked) {
      alert("This order is locked. Please unlock it to change the status.");
      return;
    }
    
    const oldStatus = orderToUpdate.status;

    if (!isUndo) {
      const historyEntry = {
        id: Date.now(),
        orderId: orderId,
        orderDisplayId: orderToUpdate.orderId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        timestamp: new Date(),
      };
      setActionHistory(prev => [historyEntry, ...prev]);
    }

    setAllOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    setHighlightedOrderId(orderId);
    
    // --- UPDATED: Scroll to new tab ---
    setActiveTab(newStatus); // Switch to the new tab
    const targetRef = sectionRefs[newStatus];
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    try {
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errData = await response.json();
        if (errData.message.includes("locked")) {
          alert(errData.message); 
        }
        throw new Error("Failed to update status");
      }
      
      const updatedOrder = await response.json();
      
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    } catch (err) {
      console.error(err.message);
      setAllOrders(originalOrders); 
      if(!isUndo) {
           setActionHistory(prev => prev.slice(1));
      }
    }
  };
  
  const handleUndo = (historyLog) => {
    handleStatusUpdate(historyLog.orderId, historyLog.fromStatus, true);
    setActionHistory(prev => prev.filter(item => item.id !== historyLog.id));
  };
  
  const openDetailModal = async (orderId) => {
    setIsDetailModalOpen(true);
    setLoadingDetailModal(true);
    try {
      // --- MODIFIED: Added Authorization Header ---
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/details`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Could not fetch order details.");
      }
      const data = await response.json();
      setSelectedOrderDetails(data);
    } catch (err) {
      alert(err.message);
      closeDetailModal();
    } finally {
      setLoadingDetailModal(false);
    }
  };
  
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrderDetails(null);
  };
  
  // --- NEW: Column Visibility Toggle ---
  const handleColumnToggle = (columnName) => {
    // Enforce the rule: At least one ID column must be visible
    const isTogglingOrderId = columnName === "Order ID";
    const isTogglingUserId = columnName === "User ID";
    
    const isOrderIdVisible = visibleColumns["Order ID"];
    const isUserIdVisible = visibleColumns["User ID"];
    
    // Check if user is trying to hide the last ID column
    if (isTogglingOrderId && isOrderIdVisible && !isUserIdVisible) {
      alert("Error: Cannot hide 'Order ID' while 'User ID' is also hidden. At least one must be visible.");
      return;
    }
    if (isTogglingUserId && isUserIdVisible && !isOrderIdVisible) {
      alert("Error: Cannot hide 'User ID' while 'Order ID' is also hidden. At least one must be visible.");
      return;
    }

    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };
  
  const handlePrint = (sectionId) => {
    const printContents = document.getElementById(sectionId).innerHTML;
    
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write(`
      <style>
        body { font-family: "Poppins", sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; }
        .print-header-mo { text-align: center; margin-bottom: 20px; }
        .print-header-mo h1, .print-header-mo h2, .print-header-mo p { margin: 0; }
        .approve-btn, .dropdown-toggle, .actions-cell { display: none; } /* Hide actions */
        tr.status-Pending td { background-color: #fee2e2 !important; }
        tr.status-To-Ship td { background-color: #ffedd5 !important; }
        tr.status-To-Receive td { background-color: #dbeafe !important; }
        tr.status-Cancelled td { background-color: #e5e7eb !important; }
        
        /* --- NEW: Hide columns for print based on state --- */
        ${!visibleColumns["Order ID"] ? '.col-order-id { display: none; }' : ''}
        ${!visibleColumns["Order Date"] ? '.col-order-date { display: none; }' : ''}
        ${!visibleColumns["User ID"] ? '.col-user-id { display: none; }' : ''}
        ${!visibleColumns["Name"] ? '.col-name { display: none; }' : ''}
        ${!visibleColumns["Payment Method"] ? '.col-payment-method { display: none; }' : ''}
        ${!visibleColumns["Total Price"] ? '.col-total-price { display: none; }' : ''}
        
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `₱${numericPrice.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const formatHistoryTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // --- 3. RENDER LOGIC ---

  const renderTable = (statusTitle) => {
    const sortConfig = sortConfigs[statusTitle];
    const searchTerm = searchTerms[statusTitle].toLowerCase();

    // Calculate colspan based on visible columns
    const visibleHeaderKeys = headerKeys.filter(key => visibleColumns[key]);
    const colSpan = visibleHeaderKeys.length + (visibleColumns["Actions"] ? 1 : 0);

    let ordersForSection = allOrders.filter(o => o.status === statusTitle);

    if (searchTerm) {
      ordersForSection = ordersForSection.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm) ||
        order.userId.toLowerCase().includes(searchTerm) ||
        order.name.toLowerCase().includes(searchTerm) ||
        order.payment.toLowerCase().includes(searchTerm)
      );
    }

    // --- UPDATED SORTING: Locked rows go to the bottom ---
    ordersForSection.sort((a, b) => {
      // 1. Primary Sort: Locked status
      if (a.isLocked && !b.isLocked) return 1;  // a is locked, b is not -> a comes after b
      if (!a.isLocked && b.isLocked) return -1; // a is not locked, b is -> a comes before b
      
      // 2. Secondary Sort: User's selected column
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'total' || sortConfig.key === 'date') {
        valA = (sortConfig.key === 'date') ? new Date(valA) : (Number(valA) || 0);
        valB = (sortConfig.key === 'date') ? new Date(valB) : (Number(valB) || 0);
      } else {
        valA = valA?.toString().toLowerCase() || '';
        valB = valB?.toString().toLowerCase() || '';
      }

      if (valA < valB) return sortConfig.direction === 'Ascending' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'Ascending' ? 1 : -1;
      return 0;
    });

    const rowsToDisplay = ordersForSection.length < 5 
      ? [...ordersForSection, ...Array(5 - ordersForSection.length).fill(null)] 
      : ordersForSection;

    const printableAreaId = `printableArea-${statusTitle.replace(/\s+/g, '-')}`;

    return (
      <div className="order-section" key={statusTitle} ref={sectionRefs[statusTitle]}>
        
        <div className="search-container-mo">
          <input 
            type="text" 
            placeholder={`Search ${statusTitle} orders...`} 
            value={searchTerms[statusTitle]}
            onChange={(e) => handleSearchChange(statusTitle, e.target.value)}
          />
          <button>🔍</button>
        </div>

        <div id={printableAreaId}>
          <div className="print-header-mo">
            <h1>Nest & Nook - Order Report</h1>
            <h2>{statusTitle.toUpperCase()}</h2>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                {headerKeys.map((col) => ( 
                  visibleColumns[col] && (
                    <th key={col} style={{ position: "relative" }} className={`col-${baseTableHeaders[col]}`}>
                      <div className="dropdown-container">
                        <span>{col}</span>
                        <span 
                          className="dropdown-toggle" 
                          onClick={() => toggleSortDropdown(`${statusTitle}-${col}`)}
                        >
                          ⇅
                        </span>
                      </div>
                      {dropdownOpen === `${statusTitle}-${col}` && (
                        <div className="sort-dropdown">
                          <div onClick={() => handleTableSort(statusTitle, col, 'Ascending')}>Ascending</div>
                          <div onClick={() => handleTableSort(statusTitle, col, 'Descending')}>Descending</div>
                        </div>
                      )}
                    </th>
                  )
                ))}
                {visibleColumns["Actions"] && <th className="actions-cell">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {rowsToDisplay.map((order, index) => {
                  const isLocked = order ? order.isLocked : false;
                  const isHighlighted = order?.id === highlightedOrderId;
                  
                  return order ? (
                    <tr 
                      key={order.id || index} 
                      className={`
                        ${order ? `status-${order.status.replace(/\s+/g, '-')}` : ''}
                        ${isHighlighted ? 'highlight-fade' : ''}
                        ${isLocked ? 'locked-row' : ''}
                      `}
                    >
                      {visibleColumns["Order ID"] && (
                        <td className="col-orderId">
                          <span 
                            className="order-id-link" 
                            onClick={() => openDetailModal(order.id)}
                          >
                            {order.orderId}
                          </span>
                        </td>
                      )}
                      {visibleColumns["Order Date"] && <td className="col-date">{formatDate(order.date)}</td>}
                      {visibleColumns["User ID"] && <td className="col-userId">{order.userId}</td>}
                      {visibleColumns["Name"] && <td className="col-name">{order.name}</td>}
                      {visibleColumns["Payment Method"] && <td className="col-payment">{order.payment}</td>}
                      {visibleColumns["Total Price"] && <td className="col-total">{formatPrice(order.total)}</td>}
                      
                      {visibleColumns["Actions"] && (
                        <td className="actions-cell">
                          {statusTitle === "Pending" && (
                            <>
                              <button className="approve-btn ship" onClick={() => handleStatusUpdate(order.id, "To Ship")} disabled={isLocked}>
                                Approve
                              </button>
                              <button className="approve-btn cancel" onClick={() => handleStatusUpdate(order.id, "Cancelled")} disabled={isLocked}>
                                Cancel
                              </button>
                            </>
                          )}
                          {statusTitle === "To Ship" && (
                            <>
                              <button className="approve-btn receive" onClick={() => handleStatusUpdate(order.id, "To Receive")} disabled={isLocked}>
                                Mark Receiving
                              </button>
                              <button className="approve-btn reject" onClick={() => handleStatusUpdate(order.id, "Pending")} disabled={isLocked}>
                                Reject
                              </button>
                            </>
                          )}
                          {statusTitle === "To Receive" && (
                            <>
                              <button className="approve-btn complete" onClick={() => handleStatusUpdate(order.id, "Completed")} disabled={isLocked}>
                                Mark Completed
                              </button>
                              <button className="approve-btn reject" onClick={() => handleStatusUpdate(order.id, "Pending")} disabled={isLocked}>
                                Return
                              </button>
                            </>
                          )}
                          {statusTitle === "Completed" && ( 
                            <button className="approve-btn reject" onClick={() => handleStatusUpdate(order.id, "Pending")} disabled={isLocked}>
                              Re-Open
                            </button>
                          )}
                          {statusTitle === "Cancelled" && ( 
                            <button className="approve-btn ship" onClick={() => handleStatusUpdate(order.id, "Pending")} disabled={isLocked}>
                              Re-Open
                            </button>
                          )}
                          <button 
                            className={`approve-btn lock ${isLocked ? 'locked' : ''}`} 
                            onClick={() => handleToggleLock(order.id)}
                            title={isLocked ? "Unlock row" : "Lock row"}
                          >
                            {isLocked ? '🔒' : '🔓'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ) : (
                    <tr key={`empty-${index}`} className="empty-row">
                      <td colSpan={colSpan}></td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>
        
        <div className="print-toolbar-mo">
          <div className="print-controls-mo">
            <button className="print-btn-mo" onClick={() => handlePrint(printableAreaId)}>
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="manage-orders-page">
      <style>{`
        /* --- Basic Layout --- */
        .manage-orders-page {
          display: flex;
          min-height: 100vh;
          background-color: #f5f7fa;
          font-family: 'Poppins', sans-serif;
        }
        .admin-container {
          display: flex;
          flex-grow: 1;
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
        .header-mo {
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 20px;
        }
        .header-mo h1 {
          font-size: 1.8rem;
          color: #333;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
        
        .history-btn, .column-toggle-btn {
          background-color: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
        }
        .history-btn:hover, .column-toggle-btn:hover {
          background-color: #4b5563;
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
        
        /* --- NEW: Tab Navigation --- */
        .tab-navigation {
          display: flex;
          background-color: #fff;
          border-radius: 10px 10px 0 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          overflow: hidden;
          border-bottom: 2px solid #485168;
        }
        .tab-btn {
          flex: 1;
          padding: 15px 10px;
          font-size: 1rem;
          font-weight: 600;
          color: #485168;
          background-color: #f4f4f4;
          border: none;
          border-right: 1px solid #ddd;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn:last-child {
          border-right: none;
        }
        .tab-btn:hover {
          background-color: #e9e9e9;
        }
        .tab-btn.active {
          background-color: #485168;
          color: white;
        }
        
        .tab-content-area {
          /* This holds the active table */
        }
        
        /* Order Section */
        .order-section {
          background-color: #fff;
          border-radius: 0 0 10px 10px; /* Rounded bottom */
          padding: 0; 
          margin-bottom: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          overflow: hidden; 
        }
        .section-header {
          /* This is now the Tab, so we don't need a separate one */
          display: none;
        }
        
        /* Search Bar */
        .search-container-mo {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 2px solid #485168;
          border-radius: 20px;
          overflow: hidden;
          width: 330px;
          margin: 20px; 
        }
        .search-container-mo input {
          border: none;
          outline: none;
          padding: 8px 10px;
          flex: 1;
          font-size: 15px;
          color: #485168;
          background: transparent;
        }
        .search-container-mo button {
          background: none;
          border: none;
          color: #1e3a8a;
          cursor: pointer;
          padding: 8px;
        }
        
        /* Table */
        .order-section table {
          width: 100%;
          border-collapse: collapse;
        }
        .order-section th,
        .order-section td {
          padding: 12px 20px; 
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        .order-section th {
          background-color: #f4f4f4; 
          color: #333; 
          position: relative;
          font-weight: bold;
        }
        .dropdown-container {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .dropdown-toggle {
          cursor: pointer;
          user-select: none;
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
        
        /* --- Priority Coloring --- */
        tr.status-Pending td {
          background-color: #fee2e2; /* Light Red */
        }
        tr.status-To-Ship td {
          background-color: #ffedd5; /* Light Orange */
        }
        tr.status-To-Receive td {
          background-color: #dbeafe; /* Light Blue */
        }
        tr.status-Cancelled td {
          background-color: #e5e7eb; /* Light Gray */
          color: #6b7280;
        }
        tr.status-Completed:nth-of-type(even) td,
        tr.status-Cancelled:nth-of-type(even) td {
          background-color: #f9f9f9; 
        }
         tr.status-Completed:nth-of-type(odd) td,
         tr.status-Cancelled:nth-of-type(odd) td {
          background-color: #fff; 
        }
        
        /* --- Fix for row hover --- */
        .order-section tbody tr:not(.empty-row):hover td {
           background-color: #eef2ff; /* A light indigo hover */
        }
        tr.status-Cancelled:hover td {
           background-color: #d1d5db !important; /* Darker gray hover for cancelled */
        }

        /* --- Highlight Animation --- */
        @keyframes highlight-fade {
          from { background-color: #fcd34d; } /* Yellow */
          to { 
            background-color: transparent; 
          }
        }
        .order-section table tr.highlight-fade td {
          animation: highlight-fade 2.5s ease-out;
        }

        /* --- Clickable Order ID --- */
        .order-id-link {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 500;
        }
        .order-id-link:hover {
          color: #1d4ed8;
        }
        
        /* --- NEW: Locked Row Style --- */
        .locked-row td {
          opacity: 0.7;
          background-color: #f3f4f6 !important; /* Light gray to show it's locked */
        }
        .locked-row:hover td {
          background-color: #e5e7eb !important; /* Slightly darker gray on hover */
        }


        /* Action Buttons */
        .approve-btn {
          border: none;
          border-radius: 5px;
          padding: 8px 12px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-right: 5px; 
        }
        /* --- NEW: Disabled Style --- */
        .approve-btn:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        .approve-btn.ship { background-color: #3b82f6; }
        .approve-btn.ship:hover:not(:disabled) { background-color: #2563eb; }
        .approve-btn.receive { background-color: #f59e0b; }
        .approve-btn.receive:hover:not(:disabled) { background-color: #d97706; }
        .approve-btn.complete { background-color: #10b981; }
        .approve-btn.complete:hover:not(:disabled) { background-color: #059669; }
        .approve-btn.cancel,
        .approve-btn.reject { background-color: #ef4444; }
        .approve-btn.cancel:hover:not(:disabled),
        .approve-btn.reject:hover:not(:disabled) { background-color: #dc2626; }
        
        /* --- NEW: Lock Button Style --- */
        .approve-btn.lock {
          background-color: #6b7280;
          font-size: 1rem;
          padding: 6px 10px;
        }
        .approve-btn.lock:hover {
          background-color: #4b5563;
        }
        .approve-btn.lock.locked {
          background-color: #f59e0b;
        }
         .approve-btn.lock.locked:hover {
          background-color: #d97706;
        }

        
        /* Print Toolbar */
        .print-toolbar-mo {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
          padding: 0 20px 20px; 
        }
        .print-controls-mo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .print-controls-mo select {
          display: none; /* Hiding the dropdowns */
        }
        .print-btn-mo {
          background-color: #485168;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        .print-btn-mo:hover {
          background-color: #2f3952;
        }
        
        .note {
          display: none;
        }
        
        /* --- History & Column Modals --- */
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
        }
        .modal-content-small {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .modal-content-small h2 {
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .history-list {
          list-style: none;
          padding: 0;
          margin: 0;
          overflow-y: auto;
        }
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 8px;
          border-bottom: 1px solid #f0f0f0;
        }
        .history-item:last-child {
          border-bottom: none;
        }
        .history-details {
          font-size: 0.9rem;
        }
        .history-details strong {
          color: #3b82f6;
        }
        .history-timestamp {
          font-size: 0.8rem;
          color: #666;
          text-align: right;
        }
        .undo-btn {
          background-color: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.8rem;
          cursor: pointer;
          margin-left: 10px;
        }
        .undo-btn:hover {
          background-color: #4b5563;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .cancel-btn {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
          background-color: #ccc;
        }
        
        /* --- NEW: Column Modal Styles --- */
        .column-checkbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .checkbox-item:hover {
          background-color: #f4f4f4;
        }
        .checkbox-item input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .checkbox-item label {
          font-size: 1rem;
          color: #333;
          cursor: pointer;
        }
        
        /* --- NEW: Order Detail Modal --- */
        .order-detail-modal-content {
          background-color: white;
          padding: 0;
          border-radius: 8px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .order-detail-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        .order-detail-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        .order-detail-header p {
          margin: 0;
          color: #666;
        }
        .order-detail-body {
          padding: 20px;
          overflow-y: auto;
          background-color: #f9f9f9;
        }
        .order-detail-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-block p {
          margin: 0 0 5px 0;
          color: #555;
          font-size: 0.9rem;
        }
        .info-block strong {
          color: #000;
          font-weight: 500;
        }
        .order-detail-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #fff;
        }
        .order-detail-table th, .order-detail-table td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        .order-detail-table th {
          background-color: #553535ff;
        }
        .order-detail-table .item-total, .order-detail-table .item-price {
          text-align: right;
        }
        .order-detail-footer {
          display: flex;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #eee;
          background-color: #fff;
        }
        .order-detail-total {
          font-size: 1.3rem;
          font-weight: bold;
          color: #000;
        }
        
        /* Print Styles */
        .print-header-mo {
          display: none;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .sidebar, .topbar, .search-container-mo, .print-toolbar-mo, .note, .header-mo, .actions-cell {
            display: none;
          }
          .main-content {
            margin-left: 0;
            padding: 0;
          }
          .order-section {
            box-shadow: none;
            border-bottom: 2px solid #000;
            padding: 0;
            margin: 0;
            page-break-inside: avoid;
          }
          .order-section table, 
          [id*="printableArea-"],
          [id*="printableArea-"] * {
            visibility: visible;
          }
          [id*="printableArea-"] {
            position: static;
          }
          .print-header-mo {
            visibility: visible;
            display: block;
            text-align: center;
            margin-bottom: 20px;
          }
          .order-section th, .order-section td {
            border: 1px solid #000;
          }
          .order-section th {
            background-color: #eee;
            color: #000;
          }
          .dropdown-toggle {
            display: none;
          }
          tr.status-Pending td { background-color: #fee2e2 !important; }
          tr.status-To-Ship td { background-color: #ffedd5 !important; }
          tr.status-To-Receive td { background-color: #dbeafe !important; }
          tr.status-Cancelled td { background-color: #e5e7eb !important; }
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
          <a href="/manage-orders" className="active">Manage Orders</a>
          <a href="/manage-users">Manage Users</a>
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <div className="main-content">
        <Topbar />
        <div className="header-mo">
          <h1>MANAGE ORDERS</h1>
          <div className="header-actions">
            <button className="column-toggle-btn" onClick={() => setIsColumnModalOpen(true)}>
              Manage Columns
            </button>
            <button className="history-btn" onClick={() => setIsHistoryModalOpen(true)}>
              View Action History ({actionHistory.length})
            </button>
          </div>
        </div>
        
        {/* --- NEW: Tab Navigation --- */}
        <div className="tab-navigation">
          {orderSections.map(status => (
            <button
              key={status}
              className={`tab-btn ${activeTab === status ? 'active' : ''}`}
              onClick={() => setActiveTab(status)}
            >
              {status} ({allOrders.filter(o => o.status === status).length})
            </button>
          ))}
        </div>

        {loading && <p style={{textAlign: 'center', padding: '50px'}}>Loading orders...</p>}
        {error && <p style={{textAlign: 'center', color: 'red', padding: '50px'}}>Error: {error}</p>}
        
        {!loading && !error && (
          <div className="tab-content-area">
            {/* Render only the active table */}
            {renderTable(activeTab)}
          </div>
        )}
      </div>
      
      {/* --- History Modal --- */}
      {isHistoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
            <h2>Action History (This Session)</h2>
            <ul className="history-list">
              {actionHistory.length > 0 ? (
                actionHistory.map(log => (
                  <li key={log.id} className="history-item">
                    <div>
                      <div className="history-details">
                        Moved Order <strong>{log.orderDisplayId}</strong> from <strong>{log.fromStatus}</strong> to <strong>{log.toStatus}</strong>.
                      </div>
                      <div className="history-timestamp">
                        {formatHistoryTime(log.timestamp)}
                      </div>
                    </div>
                    <button className="undo-btn" onClick={() => handleUndo(log)}>Undo</button>
                  </li>
                ))
              ) : (
                <p style={{textAlign: 'center', color: '#666'}}>No actions taken yet in this session.</p>
              )}
            </ul>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- NEW: Column Visibility Modal --- */}
      {isColumnModalOpen && (
        <div className="modal-overlay" onClick={() => setIsColumnModalOpen(false)}>
          <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
            <h2>Manage Table Columns</h2>
            <p style={{marginTop: 0, marginBottom: '15px', color: '#555'}}>Select columns to show or hide.</p>
            <div className="column-checkbox-grid">
              {Object.keys(visibleColumns).map(key => (
                <div key={key} className="checkbox-item">
                  <input 
                    type="checkbox"
                    id={`col-toggle-${key}`}
                    checked={visibleColumns[key]}
                    onChange={() => handleColumnToggle(key)}
                  />
                  <label htmlFor={`col-toggle-${key}`}>{key}</label>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setIsColumnModalOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Order Detail Modal --- */}
      {isDetailModalOpen && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="order-detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-detail-header">
              {loadingDetailModal ? (
                <h2>Loading Order Details...</h2>
              ) : selectedOrderDetails ? (
                <>
                  <h2>Order ID: {selectedOrderDetails.orderId}</h2>
                  <p>Customer: {selectedOrderDetails.customerName} ({selectedOrderDetails.customerEmail})</p>
                </>
              ) : (
                <h2>Order Details</h2>
              )}
            </div>
            
            {loadingDetailModal ? (
              <p style={{textAlign: 'center', padding: '50px'}}>Loading...</p>
            ) : selectedOrderDetails ? (
              <>
                <div className="order-detail-body">
                  <div className="order-detail-info">
                    <div className="info-block">
                      <p><strong>Order Date:</strong> {formatDate(selectedOrderDetails.orderDate)}</p>
                      <p><strong>Order Status:</strong> {selectedOrderDetails.orderStatus}</p>
                    </div>
                    <div className="info-block">
                      <p><strong>Payment Method:</strong> {selectedOrderDetails.paymentMethod}</p>
                      <p><strong>Payment Status:</strong> {selectedOrderDetails.paymentStatus}</p>
                    </div>
                  </div>
                  
                  <h3>Items Ordered</h3>
                  <table className="order-detail-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th className="item-price">Unit Price</th>
                        <th className="item-total">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderDetails.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td className="item-price">{formatPrice(item.price)}</td>
                          <td className="item-total">{formatPrice(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="order-detail-footer">
                  <div className="order-detail-total">
                    Total: <span>{formatPrice(selectedOrderDetails.total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p style={{textAlign: 'center', padding: '50px'}}>Could not load order details.</p>
            )}
            
            <div className="modal-actions" style={{justifyContent: 'flex-end', paddingTop: '15px', padding: '20px', background: '#f9f9f9'}}>
              <button className="cancel-btn" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ManageOrders;