import express from "express";
import { getUsers, getUser, register, deleteUser, editUser, login, getToken } from "../controller/user_controller.js";
import { verifyToken } from "../middleware/verify_token.js";

const router = express.Router();

router.get("/users", verifyToken, getUsers);

router.get("/users/:id", verifyToken, getUser);

router.post("/users", register);

router.delete("/users/:id", verifyToken, deleteUser);

router.put("/users/:id", verifyToken, editUser);

router.post("/login", login);

router.get("/token", getToken);

export default router;
