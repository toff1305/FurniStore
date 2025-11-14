import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
 import "./user-header.css"; // Styles are embedded below
 import logo from "./assets/logo.png"; // Using placeholder

export default function UserNavbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [searchQuery, setSearchQuery] = useState(""); // REMOVED
  const dropdownRef = useRef(null);
  
  // --- STATE ---
  const [userName, setUserName] = useState("User");
  const [menuData, setMenuData] = useState([]); // For category dropdown
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  // --- REMOVED search/filter state ---
  // const [allProducts, setAllProducts] = useState([]);
  // const [suggestions, setSuggestions] = useState([]);
  // const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);
  // const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  // const [maxPriceLimit, setMaxPriceLimit] = useState(50000); 
  // const [filters, setFilters] = useState(...);

  // --- Click outside handlers ---
  const categoryMenuRef = useRef(null);
  // const searchSuggestionsRef = useRef(null); // REMOVED

  const handleClickOutside = useCallback((event) => {
    // Close profile dropdown
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
    // Close category dropdown
    if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
      setIsCategoryOpen(false);
    }
    // --- REMOVED search suggestion click outside ---
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);
  
  // --- Data Fetching Effect ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem("userName");
      if (storedName) {
        setUserName(storedName);
      }
    }

    // Fetch data for dropdowns
    const fetchHeaderData = async () => {
      try {
        // --- REMOVED product fetch, only fetch categories ---
        const catRes = await fetch("http://localhost:5000/api/categories-and-types");

        if (catRes.ok) {
          const { categories, productTypes } = await catRes.json();
          // Build the menu structure
          const catMap = new Map(categories.map(c => [c._id, { name: c.category_name, types: [] }]));
          productTypes.forEach(pt => {
            // Ensure pt.category_id exists and is an object before accessing _id
            if (pt.category_id && pt.category_id._id && catMap.has(pt.category_id._id)) {
              catMap.get(pt.category_id._id).types.push(pt.product_type_name);
            }
          });
          setMenuData(Array.from(catMap.values()));
        }

        // --- REMOVED product processing ---

      } catch (err) {
        console.error("Failed to fetch header data:", err);
      }
    };
    
    fetchHeaderData();
  }, []);

  // --- Search Suggestion Effect (REMOVED) ---

  // --- Event Handlers ---

  // --- REMOVED handleSearch, handleSuggestionClick, handleFilterChange, clearFilters ---

  const handleCategoryScroll = (categoryName) => {
    navigate(`/shop#${encodeURIComponent(categoryName)}`);
    setIsCategoryOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("token"); // --- IMPORTANT: Remove token on logout
    
    alert("Logged out!");
    navigate("/home"); 
  };
  
  // --- Sub-component for Filter Modal (REMOVED) ---

  return (
    <>
      <style>{`
        .shop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 40px;
          background-color: #ffffff;
          border-bottom: 2px solid #f0f0f0;
          font-family: 'Poppins', sans-serif;
          
          /* --- NEW STICKY STYLES --- */
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 900;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .shop-logo {
          height: 50px;
          width: auto;
          cursor: pointer;
        }
        
        .shop-welcome {
          margin-left:300px;
          font-size: 1.1rem;
          font-weight: 500;
          color: #333;
        }
        
        /* --- REMOVED .header-center and search styles --- */
        
        .shop-nav-icons {
          display: flex;
          align-items: center;
          gap: 25px;
        }
        
        .shop-icon {
          font-size: 1.5rem;
          cursor: pointer;
          position: relative;
          color: #333;
        }
        
        .profile-dropdown {
          position: absolute;
          top: 130%; /* Position below the icon */
          right: 0;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #eee;
          width: 160px;
          z-index: 10;
          overflow: hidden;
        }
        
        .dropdown-item {
          padding: 12px 18px;
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
          cursor: pointer;
        }
        
        .dropdown-item:hover {
          background-color: #f5f7fa;
        }
        
        .dropdown-item:first-child {
          border-bottom: 1px solid #f0f0f0;
        }

        /* --- NEW: Category Dropdown --- */
        .nav-categories {
          position: relative;
        }
        .nav-categories-btn {
          font-size: 1.1rem;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          padding: 10px 0;
        }
        .nav-categories-btn:hover {
          color: #4a552b;
        }
        
        .category-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          width: 250px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 100;
          padding: 10px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .category-dropdown-menu ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .category-item > span {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4a2f0c;
          padding: 8px;
          display: block;
        }
        .category-item ul {
          padding-left: 15px;
        }
        .type-item {
          font-size: 1rem;
          color: #333;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .type-item:hover {
          background: #f5f7fa;
          color: #4a552b;
        }

        /* --- NEW: Filter Modal --- */
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
        .modal-content h2 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 25px;
          text-align: center;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .filter-group label {
          display: block;
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 10px;
          color: #555;
        }
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .price-inputs input {
          width: 100%;
          padding: 10px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .price-inputs span {
          font-weight: 600;
        }
        .star-rating {
          display: flex;
          gap: 5px;
          font-size: 2rem;
        }
        .star-rating span {
          cursor: pointer;
          color: #ccc;
        }
        .star-rating span.on {
          color: #f59e0b;
        }
        .clear-rating {
          font-size: 0.9rem;
          color: #3b82f6;
          cursor: pointer;
          text-decoration: underline;
          margin-top: 5px;
          display: inline-block;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .cancel-btn, .save-btn {
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
        .save-btn {
          background-color: #4a552b;
          color: white;
        }
        .save-btn:hover {
          background-color: #3d4823;
        /* --- REMOVED Filter Modal Styles --- */
      `}</style>
      <header className="shop-header">
        <div className="header-left">
          <Link to="/shop">
            <img 
              src={"https://placehold.co/150x50/08112b/e8dcaa?text=Nest+Nook"} 
              alt="Logo" 
              className="shop-logo" 
            />
          </Link>
          
          {/* --- NEW: Category Dropdown --- */}
          <div className="nav-categories" ref={categoryMenuRef}>
            <span className="nav-categories-btn" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
              Categories ▾
            </span>
            {isCategoryOpen && (
              <div className="category-dropdown-menu">
                <ul>
                  {menuData.map(category => (
                    <li key={category.name} className="category-item">
                      <span onClick={() => handleCategoryScroll(category.name)}>
                        {category.name}
                      </span>
                      <ul>
                        {category.types.map(type => (
                          <li 
                            key={type} 
                            className="type-item"
                            onClick={() => handleCategoryScroll(category.name)} // Still scrolls to main cat
                          >
                            {type}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="shop-welcome">
            <span>Welcome, {userName}!</span>
          </div>
        </div>

        {/* --- REMOVED header-center and search bar --- */}

        {/* NAV ICONS */}
        <div className="shop-nav-icons">
          <span className="shop-icon" onClick={() => navigate("/cart")} title="Go to Cart">
            🛒
          </span>
          {/* --- FIXED: Point to /profile_user --- */}
          <span className="shop-icon" onClick={() => navigate("/orderss")} title="View Orders">
            📦
          </span>
          <div className="shop-icon" ref={dropdownRef}>
            <span onClick={() => setDropdownOpen(!dropdownOpen)} title="Profile">👤</span>
            {dropdownOpen && (
              <div className="profile-dropdown">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/profile"); // --- FIXED: Point to /profile
                    setDropdownOpen(false);
                  }}
                >
                  View Profile
                </div>
                <div
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- REMOVED Filter Modal --- */}
    </>
  );
}