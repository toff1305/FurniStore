const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // --- 1. IMPORT BCRYPT ---
const SALT_WORK_FACTOR = 10; 

const CustomerSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone_number: String,
  shipping_address: String,
  otp_code: String,
  time_validity_of_code: Date,
  date_registered: { type: Date, default: Date.now },
  role: {
    type: String,
    default: 'customer' // Default role is 'customer'
  }
});

// --- 2. ADD PRE-SAVE HOOK TO HASH PASSWORD ---
// This runs AUTOMATICALLY before any .save() or .create()
CustomerSchema.pre("save", function(next) {
  const user = this;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // Generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);

    // Hash the password using our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);

      // Override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

// --- 3. ADD THE MISSING PASSWORD COMPARISON METHOD ---
// This is the function the error was complaining about
CustomerSchema.methods.comparePassword = function(candidatePassword) {
  // 'this.password' is the hashed password from the database
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Customer", CustomerSchema);