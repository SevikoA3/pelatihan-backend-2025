import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { users as usersTable } from "../model/users.js";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { supabase } from "../db/supabase.js";

dotenv.config();

const getUsers = async (req, res, next) => {
  try {
    const allUsers = await db.select().from(usersTable);
    res.status(200).json({
      status: "success",
      message: "Successfully get all users",
      data: allUsers,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, Number(id)));
    if (!user.length) {
      res.status(400).json({
        status: "error",
        message: `User with id ${id} not found`,
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "Successfully get user",
        user: user[0],
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

const register = async (req, res, next) => {
  try {
    const { username, password, name, division } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }
    // Check if user exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (existingUser.length) {
      return res.status(409).json({ message: "User already exists" });
    }
    // Insert new user
    const inserted = await db
      .insert(usersTable)
      .values({ username, password, name, division })
      .returning();
    const newUser = inserted[0];
    // Remove sensitive data
    const { password: _, refresh_token: __, ...safeUserData } = newUser;

    // Generate JWT token
    const accessToken = jwt.sign(safeUserData, process.env.ACCESS_KEY_SECRET, {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign(
      safeUserData,
      process.env.REFRESH_KEY_SECRET,
      { expiresIn: "3d" }
    );
    // Update refresh token in db
    await db
      .update(usersTable)
      .set({ refresh_token: refreshToken })
      .where(eq(usersTable.id, newUser.id));
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User created successfully",
      accessToken,
      user: safeUserData,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();
    if (!deleted.length) {
      res.status(400).json({
        status: "error",
        message: `User with id ${id} not found`,
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "Successfully delete user",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Edit user
const editUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, division } = req.body;
    let profilePictureUrl;

    if (req.file) {
      const file = req.file;
      const fileName = `profile-pictures/${id}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res
          .status(500)
          .json({ message: "Error uploading file to Supabase." });
      }

      const { data: publicUrlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        return res
          .status(500)
          .json({ message: "Error getting public URL from Supabase." });
      }
      profilePictureUrl = publicUrlData.publicUrl;
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (division) updateData.division = division;
    if (profilePictureUrl) updateData.profile_picture_url = profilePictureUrl;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided." });
    }

    const updated = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, Number(id)))
      .returning();

    if (!updated.length) {
      return res.status(404).json({
        // Changed to 404 for not found
        status: "error",
        message: `User with id ${id} not found`,
      });
    }

    // Remove sensitive data before sending response
    const { password: _, refresh_token: __, ...safeUserData } = updated[0];

    res.status(200).json({
      status: "success",
      message: "Successfully update user",
      data: safeUserData, // Send back the updated user data (without password/token)
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const userArr = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    const user = userArr[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const { password: _, refresh_token: __, ...safeUserData } = user;
    const accessToken = jwt.sign(safeUserData, process.env.ACCESS_KEY_SECRET, {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign(
      safeUserData,
      process.env.REFRESH_KEY_SECRET,
      { expiresIn: "3d" }
    );
    await db
      .update(usersTable)
      .set({ refresh_token: refreshToken })
      .where(eq(usersTable.id, user.id));
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: safeUserData,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Get new access token from refresh token
const getToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({
        status: "Error",
        message: "Refresh token tidak ada",
      });
    }
    const userArr = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.refresh_token, refreshToken));
    const user = userArr[0];
    if (!user || !user.refresh_token) {
      return res.status(401).json({
        status: "Error",
        message: "Refresh token tidak ada",
      });
    }
    jwt.verify(
      refreshToken,
      process.env.REFRESH_KEY_SECRET,
      (error, decoded) => {
        if (error) {
          return res.status(403).json({
            status: "Error",
            message: "Refresh token tidak valid",
          });
        }
        const { password: _, refresh_token: __, ...safeUserData } = user;
        const accessToken = jwt.sign(
          safeUserData,
          process.env.ACCESS_KEY_SECRET,
          {
            expiresIn: "30s",
          }
        );
        return res.status(200).json({
          status: "Success",
          message: "Berhasil mendapatkan access token.",
          accessToken,
        });
      }
    );
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "No refresh token provided",
      });
    }
    const userArr = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.refresh_token, refreshToken));
    const user = userArr[0];
    if (!user) {
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res.status(400).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }
    await db
      .update(usersTable)
      .set({ refresh_token: "" })
      .where(eq(usersTable.id, user.id));
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
};

export {
  getUsers,
  getUser,
  register,
  deleteUser,
  editUser,
  login,
  getToken,
  logout,
};
