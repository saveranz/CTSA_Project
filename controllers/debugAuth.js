import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

export const debugLogin = async (req, res) => {
  try {
    console.log("=== Debug Login Start ===");
    console.log("Request body:", req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log("❌ Missing credentials");
      return res.status(400).json({ 
        success: false, 
        error: "Email/Username and password are required" 
      });
    }

    // Check total admin count
    const adminCount = await Admin.count();
    console.log(`Total admin accounts in database: ${adminCount}`);

    // Try to find the admin
    const user = await Admin.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase().trim() },
          { username: email.toLowerCase().trim() }
        ]
      },
      raw: true
    });

    console.log("Admin search result:", user ? "Found" : "Not found");
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "No admin account found with these credentials" 
      });
    }

    // Compare passwords
    try {
      const match = await bcrypt.compare(password, user.password);
      console.log("Password match result:", match);

      if (!match) {
        return res.status(401).json({ 
          success: false, 
          error: "Invalid password" 
        });
      }

      // Set up session
      req.session.userId = user.id;
      req.session.userType = "admin";
      req.session.userName = user.fullName;

      console.log("Session data set:", req.session);

      return res.json({ 
        success: true, 
        redirect: "/admin-dashboard" 
      });

    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return res.status(500).json({ 
        success: false, 
        error: "Error comparing passwords" 
      });
    }

  } catch (error) {
    console.error("Debug login error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: error.message
    });
  }
};