import React, { useState, useEffect } from "react";
 import "./admin.css"; // Assuming admin.css is in the correct path
// import { Link } from "react-router-dom"; // Link component removed
import Topbar from "./topbar-admin"; // Make sure this file exists or remove this line

/**
 * @typedef {object} FormattedOrder
 * @property {string} orderId - The ID of the order.
 * @property {string} userId - The customer's name (not their ID).
 * @property {string} productName - The name of the product.
 * @property {string} orderDate - The formatted date of the order.
 * @property {string} status - The order status (e.g., "Pending", "Completed").
 */

/**
 * Admin dashboard component to display performance overview and all orders.
 */
function Admin() {
  function shortenOrderId(id) {
  return id ? id.slice(-6).toUpperCase() : "";
}

  // --- STATE FOR ALL DATA ---

  /** @type {[FormattedOrder[], React.Dispatch<React.SetStateAction<FormattedOrder[]>>]} */
  const [allOrders, setAllOrders] = useState([]); // Master list of all orders

  /** @type {[FormattedOrder[], React.Dispatch<React.SetStateAction<FormattedOrder[]>>]} */
  const [orders, setOrders] = useState([]); // The *displayed* list (filtered/searched)

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [loading, setLoading] = useState(true);

  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} */
  const [customerCount, setCustomerCount] = useState(0);

  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} */
  const [productCount, setProductCount] = useState(0);

  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // --- STATE FOR FILTERING ---
  
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [searchQuery, setSearchQuery] = useState(""); // For the search bar

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [statusFilter, setStatusFilter] = useState(""); // For the status dropdown

  // --- State for print options (orderBy, selectBy) removed ---

  const statusOptions = ["To Receive", "Completed", "To Ship", "Pending"];

  // --- FETCH DATA ---
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // --- NEW: Get the token from localStorage ---
      const token = localStorage.getItem("token");

      const [ordersRes, customersRes, productsRes] = await Promise.all([
        // --- MODIFIED: Added headers ---
        fetch("http://localhost:5000/api/order-details", {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }),
        // --- MODIFIED: Added headers ---
        fetch("http://localhost:5000/api/stats/total-customers", {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }),
        // --- MODIFIED: Added headers ---
        fetch("http://localhost:5000/api/stats/total-products", {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }),
      ]);

      if (!ordersRes.ok || !customersRes.ok || !productsRes.ok) {
        throw new Error("Data could not be fetched! Are you logged in as an admin?");
      }

      /** @type {FormattedOrder[]} */
      const ordersData = await ordersRes.json();
      const customersData = await customersRes.json();
      const productsData = await productsRes.json();

      setAllOrders(ordersData);
      setCustomerCount(customersData.totalCustomers);
      setProductCount(productsData.totalProducts);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // --- EFFECT TO HANDLE FILTERING AND SEARCHING ---
  useEffect(() => {
    let filteredData = [...allOrders];

    // 1. Filter by Status
    if (statusFilter) {
      filteredData = filteredData.filter(
        (order) => order.status === statusFilter
      );
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredData = filteredData.filter(
        (order) =>
          order.orderId.toLowerCase().includes(lowerCaseQuery) ||
          order.userId.toLowerCase().includes(lowerCaseQuery) ||
          order.productName.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setOrders(filteredData); // Update the displayed orders
  }, [searchQuery, statusFilter, allOrders]); // Re-run whenever these change

  // --- COMPONENT FUNCTIONS ---

  /**
   * Toggles the visibility of a column dropdown.
   * @param {string} key - The column key (e.g., "OrderId", "Status").
   */
  const toggleDropdown = (key) => {
    setDropdownOpen(dropdownOpen === key ? null : key);
  };

  /**
   * Sorts the orders table by a specific column.
   * @param {"OrderId" | "UserId" | "Product Name" | "OrderDate"} key - The column to sort by.
   * @param {"ascending" | "descending"} direction - The sort direction.
   */
  const sortTable = (key, direction) => {
    const keyMap = {
      OrderId: "orderId",
      UserId: "userId",
      "Product Name": "productName",
      OrderDate: "orderDate",
    };

    const sortKey = keyMap[key];
    const sortedOrders = [...orders].sort((a, b) => {
      const valA = a[sortKey]?.toString().toLowerCase() || "";
      const valB = b[sortKey]?.toString().toLowerCase() || "";
      if (valA < valB) return direction === "ascending" ? -1 : 1;
      if (valA > valB) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setOrders(sortedOrders); 
    setDropdownOpen(null);
  };

  /**
   * Filters the orders table by status.
   * @param {string} status - The status to filter by (e.g., "Completed").
   */
  const filterStatus = (status) => {
    setStatusFilter(status); // Set the status filter state
    setDropdownOpen(null);
  };

  /**
   * Handles changes to the search input.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Triggers the browser's print dialog.
   */
  const handlePrint = () => {
    window.print();
  };

  const rowsToDisplay =
    orders.length < 5 ? [...orders, ...Array(5 - orders.length).fill(null)] : orders;

  // Get today's date for the print header
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // --- JSX ---
  return (
    <div className="admin-page">
      {/* --- STYLES --- */}
      <style>
        {`
          /* --- NEW: FIX FOR STAT CARDS --- */
          .stats-cards {
            display: flex;
            flex-wrap: wrap; /* Allows cards to wrap on smaller screens */
            gap: 20px; /* Space between cards */
            margin-bottom: 30px; /* Space below the row of cards */
          }
          
          .stats-cards .card {
            flex: 1; /* Each card will grow to take equal space */
            min-width: 200px; /* Prevents cards from becoming too narrow */
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
            text-align: center;
          }
          
          .stats-cards .card h1 {
            font-size: 2.2rem;
            font-weight: 700;
            margin: 0 0 5px 0;
          }
          
          .stats-cards .card p {
            font-size: 1rem;
            color: #555;
            margin: 0;
          }
          /* --- END OF CARD FIX --- */
          
          /* --- UPDATED PRINT CONTROLS --- */
          .print-controls-dashboard {
            display: flex;
            justify-content: flex-end; /* Pushes button to the right */
            margin-top: 20px;
          }
          
          .print-btn-dashboard {
            padding: 10px 20px;
            font-size: 0.9rem;
            background-color: #333;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .print-btn-dashboard:hover {
            background-color: #555;
          }
          /* --- END OF PRINT CONTROLS --- */

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
              padding: 20px;
            }
            #print-header {
              visibility: visible;
              display: block;
              text-align: center;
              margin-bottom: 20px;
            }
            .sidebar, .main-content .header-mf, .search-container, .stats-cards, .print-section-dashboard, .dropdown-toggle {
              display: none;
            }
            .orders-table {
              width: 100%;
              border-collapse: collapse;
            }
            .orders-table th, .orders-table td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            .orders-table th {
              background-color: #f0f0f0;
            }
            .dropdown-container span {
              visibility: visible;
            }
             .dropdown-container .dropdown-toggle {
               display: none;
             }
            .status {
              color: #000;
              background-color: transparent;
              font-weight: bold;
            }
          }
          
          #print-header {
            display: none;
          }
        `}
      </style>
      
      <div className="admin-container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo-section">
            <div className="logo-circle"></div>
            <h2>Logo & Company Name</h2>
          </div>
          <nav className="sidebar-nav">
            {/* --- Replaced <Link> with <a> --- */}
            <a href="/admin" className="active">
              Dashboard
            </a>
            <a href="/view-products">View Products</a>
            <a href="/manage-furnitures">Manage Furnitures</a>
            <a href="/manage-orders">Manage Orders</a>
            <a href="/manage-users">Manage Users</a>
          </nav>
        </aside>

        <Topbar />

        {/* MAIN CONTENT */}
        <div className="main-content">
          <div className="header-mf">
            <h1>PERFORMANCE OVERVIEW</h1>
          </div>

          <div className="order-section">
            {/* --- SEARCH CONTAINER --- */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by Order ID, Customer, or Product..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button>🔍</button>
            </div>

            <section className="dashboard-section">
              {/* --- STAT CARDS --- */}
              <div className="stats-cards">
                 <div className="card">
                  <h1>{loading ? "..." : customerCount}</h1>
                  <p>Total Customers</p>
                </div>
                <div className="card">
                  <h1>{loading ? "..." : productCount}</h1>
                  <p>Total Products</p>
                </div>
                <div className="card">
                  <h1>{loading ? "..." : allOrders.length}</h1>
                  <p>Total Orders</p>
                </div>
                <div className="card">
                  <h1>
                    {loading
                      ? "..."
                      : allOrders.filter(
                          (o) => o.status === "Pending" || o.status === "To Ship"
                        ).length}
                  </h1>
                  <p>Pending Orders</p>
                </div>
              </div>

              {/* --- PRINTABLE AREA WRAPPER --- */}
              <div id="printableArea">
              
                {/* --- PRINT-ONLY HEADER --- */}
                <div id="print-header">
                  <h1>Nest & Nook</h1>
                  <h2>Furniture Store</h2>
                  <p>Order Report</p>
                  <p>Date: {today}</p>
                </div>

                <h3>VIEW ALL ORDERS</h3>
                <table className="orders-table">
                  <thead>
                    <tr>
                      {["OrderId", "UserId", "Product Name", "OrderDate", "Status"].map((col) => (
                        <th key={col} style={{ position: "relative" }}>
                          <div className="dropdown-container">
                            <span>{col.replace(/([A-Z])/g, " $1")}</span>
                            <div
                              className={`dropdown-toggle ${dropdownOpen === col ? "active" : ""}`}
                              onClick={() => toggleDropdown(col)}
                            >
                              ⇅
                            </div>
                          </div>
                          {dropdownOpen === col && (
                            <div className="sort-dropdown">
                              {col === "Status" ? (
                                statusOptions.map((status) => (
                                  <div key={status} onClick={() => filterStatus(status)}>
                                    {status}
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div onClick={() => sortTable(col, "ascending")}>Ascending</div>
                                  <div onClick={() => sortTable(col, "descending")}>Descending</div>
                                </>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                          Loading data from database...
                        </td>
                      </tr>
                    ) : (
                      rowsToDisplay.map((order, index) =>
                        order ? (
                          <tr key={index}>
                            <td>{shortenOrderId(order.orderId)}</td>
                            <td>{order.userId}</td>
                            <td>{order.productName}</td>
                            <td>{order.orderDate}</td>
                            <td
                              className={`status ${(order.status || "").toLowerCase().replace(" ", "")}`}
                            >
                              {order.status || "N/A"}
                            </td>
                          </tr>
                        ) : (
                          <tr key={`empty-${index}`} className="empty-row">
                            <td colSpan="5"></td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
                
                {!loading && orders.length === 0 && (
                  <p style={{ textAlign: "center", color: "#777", marginTop: "10px" }}>
                    {allOrders.length > 0
                      ? "No orders found for this filter."
                      : "No orders found in the database."}
                  </p>
                )}
                
              </div> {/* End of printableArea */}


              {/* --- UPDATED PRINT SECTION --- */}
              <div className="print-section-dashboard">
                <div className="print-controls-dashboard">
                  {/* Dropdowns removed as requested */}
                  <button className="print-btn-dashboard" onClick={handlePrint}>
                    🖨️ Print / Save as PDF
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;

