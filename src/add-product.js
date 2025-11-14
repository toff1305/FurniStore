import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./add-product.css";
import Topbar from "./topbar-admin";

function AddFurnitures() {
  const [form, setForm] = useState({
    category: "",
    type: "",
    name: "",
    price: "",
    discount: "",
    description: "",
    height: "",
    width: "",
    length: "",
    image: null,
  });

  // Category-to-type mapping
  const typeOptions = {
    "Living Room": ["Sofa", "Center Table"],
    "Dining Room": ["Chair", "Dining Set"],
    Bedroom: ["Bed", "Wardrobe", "Vanity"],
  };

  // Handle input
  const handleChange = (e) => {
    const { id, value, files } = e.target;

    if (id === "category") {
      setForm({ ...form, category: value, type: "" });
    } else {
      setForm({ ...form, [id]: files ? files[0] : value });
    }
  };

  // Add button handler
  const handleAdd = () => {
    if (!form.category) {
      alert("Please select a category.");
      return;
    }
    if (!form.type) {
      alert("Please select a product type.");
      return;
    }
    if (!form.name) {
      alert("Please enter a product name.");
      return;
    }

    alert("Furniture added successfully!");
    console.log(form);
  };

  return (
    <div className="manage-furnitures-page">
      <div className="admin-container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo-section">
            <div className="logo-circle"></div>
            <h2>Logo & Company Name</h2>
          </div>

          <nav className="sidebar-nav">
            <Link to="/admin">Dashboard</Link>
            <Link to="/view-products">View Products</Link>
            <Link to="/manage-furnitures" className="active">
              Manage Furnitures
            </Link>
            <Link to="/manage-orders">Manage Orders</Link>
            <Link to="/manage-users">Manage Users</Link>
          </nav>
        </aside>

        <Topbar />

        {/* MAIN CONTENT */}
        <div className="main-content">
          
          <div className="header-mf">
           
            <h1>MANAGE FURNITURES</h1>
          </div>

          <div className="add-furniture-container">
             <button className="back-btn" onClick={() => window.history.back()} >
    ← back </button>
    
            <h3 className="section-title">ADD NEW FURNITURE</h3>

            <form className="form-sections">
              {/* PRODUCT FAMILY */}
              <div className="form-group">
                <h4>PRODUCT FAMILY</h4>

                <label>Select Category:</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">-- Select Category --</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Bedroom">Bedroom</option>
                </select>

                <label>Select Product Type:</label>
                <select
                  id="type"
                  value={form.type}
                  onChange={handleChange}
                  disabled={!form.category}
                  className="input-field"
                >
                  <option value="">
                    {form.category
                      ? "-- Select Type --"
                      : "Select category first"}
                  </option>
                  {form.category &&
                    typeOptions[form.category].map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                </select>
              </div>

              {/* PRODUCT OVERVIEW */}
              <div className="form-group">
                <h4>PRODUCT OVERVIEW</h4>

                <label>Product Name:</label>
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-field"
                />

                <div className="price-row">
                  <div style={{ flex: 1 }}>
                    <label>Product Price:</label>
                    <input
                      type="number"
                      id="price"
                      value={form.price}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label>Discounted Price:</label>
                    <input
                      type="number"
                      id="discount"
                      value={form.discount}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <label>Product Description:</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={handleChange}
                  className="input-field"
                ></textarea>
              </div>

              {/* PRODUCT DIMENSIONS */}
              <div className="form-group">
                <h4>PRODUCT DIMENSIONS</h4>

                <label>Product Height:</label>
                <input
                  type="text"
                  id="height"
                  value={form.height}
                  onChange={handleChange}
                  className="input-field"
                />

                <label>Product Width:</label>
                <input
                  type="text"
                  id="width"
                  value={form.width}
                  onChange={handleChange}
                  className="input-field"
                />

                <label>Product Length:</label>
                <input
                  type="text"
                  id="length"
                  value={form.length}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              {/* IMAGE UPLOAD */}
<div className="form-group">
  <h4>PRODUCT IMAGE LINKS</h4>

  {[1, 2, 3, 4, 5].map((num) => (
    <div key={num} className="mb-2">
      <input
        type="url"
        id={`image_link_${num}`}
        name={`image_link_${num}`}
        placeholder={`Enter Image Link ${num}`}
        onChange={handleChange}
        className="input-field w-full p-2 border rounded"
      />
    </div>
  ))}
</div>


              <button
                type="button"
                className="add-btn"
                onClick={handleAdd}
              >
                ADD FURNITURE
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddFurnitures;
