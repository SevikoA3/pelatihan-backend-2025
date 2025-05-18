import jwt from "jsonwebtoken";
import users from "../model/users.js";
import dotenv from "dotenv";

dotenv.config();

const getUsers = (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      message: "Successfully get all users",
      data: users,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getUser = (req, res, next) => {
  try {
    const { id } = req.params;

    const user = users.find((user) => user.id == id);

    if (!user) {
      res.status(400).json({
        status: "error",
        message: `User with id ${id} not found`,
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "succuessfully get user",
        user: user,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const register = (req, res, next) => {
  try {
    const { username, password, name, division } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // Cek apakah user sudah ada
    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Buat user baru
    const newUser = {
      id: users.length,
      username,
      password, // plain text
      refresh_token: "",
      name: name || "",
      division: division || "",
    };
    users.push(newUser);

    // Hapus data sensitif sebelum membuat token
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

    // Simpan refresh token ke user
    newUser.refresh_token = refreshToken;

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 hari
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

const deleteUser = (req, res, next) => {
  try {
    const { id } = req.params;

    const targetedUser = users.findIndex((user) => user.id == id);

    if (targetedUser == -1) {
      res.status(400).json({
        status: "error",
        message: `User with id ${id} not found`,
      });
    } else {
      users.splice(targetedUser, 1);

      res.status(200).json({
        status: "success",
        message: "Successfully delete user",
        data: users,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUser = (req, res, next) => {
  try {
    const { id, name, division } = req.body;

    const targetedUser = users.findIndex((user) => user.id == id);

    if (targetedUser === -1) {
      res.status(400).json({
        status: "error",
        message: `User with id ${id} not found`,
      });
    } else {
      users[targetedUser] = {
        id: targetedUser,
        name: name,
        division: division,
      };

      res.status(200).json({
        status: "success",
        message: "Successfully update user",
        data: users,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // Cari user berdasarkan username
    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Cek password (plain text)
    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Hapus data sensitif sebelum membuat token
    const { password: _, refresh_token: __, ...safeUserData } = user;

    // Generate JWT token
    const accessToken = jwt.sign(safeUserData, process.env.ACCESS_KEY_SECRET, {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign(
      safeUserData,
      process.env.REFRESH_KEY_SECRET,
      { expiresIn: "3d" }
    );

    // Simpan refresh token ke user
    user.refresh_token = refreshToken;

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 hari
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

const getToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      const error = new Error("Refresh token tidak ada");
      error.statusCode = 401;
      throw error;
    }

    // Cari user di array users
    const user = users.find((u) => u.refresh_token === refreshToken);

    if (!user || !user.refresh_token) {
      const error = new Error("Refresh token tidak ada");
      error.statusCode = 401;
      throw error;
    }

    // Kalo ketemu, verifikasi refresh token
    jwt.verify(
      refreshToken, // <- refresh token yg mau diverifikasi
      process.env.REFRESH_KEY_SECRET, // <- Secret key dari refresh token
      (error, decoded) => {
        // Jika ada error (access token tidak valid/kadaluarsa), kirim respons error
        if (error) {
          return res.status(403).json({
            status: "Error",
            message: "Refresh token tidak valid",
          });
        }
        // Konversi data user ke bentuk object
        const userPlain = user.toJSON();

        // Hapus data sensitif sebelum membuat token baru, dalam hal ini password sama refresh token dihapus
        const { password: _, refresh_token: __, ...safeUserData } = userPlain;

        // Buat access token baru (expire selama 30 detik)
        const accessToken = jwt.sign(
          safeUserData,
          process.env.ACCESS_KEY_SECRET,
          {
            expiresIn: "30s",
          }
        );

        // Kirim respons sukses + kasih access token yg udah dibikin tadi
        return res.status(200).json({
          status: "Success",
          message: "Berhasil mendapatkan access token.",
          accessToken, // <- Access token baru untuk client
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

const logout = (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "No refresh token provided",
      });
    }

    // Find user by refresh token
    const user = users.find((u) => u.refresh_token === refreshToken);
    if (!user) {
      // Still clear cookie for security
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

    // Remove refresh token from user object
    user.refresh_token = "";

    // Clear refresh token cookie
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
