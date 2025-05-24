import express from "express";
import {
  getUsers,
  getUser,
  register,
  deleteUser,
  editUser,
  login,
  getToken,
} from "../controller/user_controller.js";
import { verifyToken } from "../middleware/verify_token.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/users", getUsers);

router.get("/users/:id", verifyToken, getUser);

router.post("/users", register);

router.delete("/users/:id", verifyToken, deleteUser);

router.put(
  "/users/:id",
  verifyToken,
  upload.single("profilePicture"),
  editUser
);

router.post("/login", login);

router.get("/token", getToken);

export default router;
