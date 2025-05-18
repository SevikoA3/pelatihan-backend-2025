import { Router } from "express";
import { 
  getUsers,
  getUser,
  register,
  deleteUser,
  editUser,
  login,
  getToken,
  logout
} from "../controller/user_controller.js";

const router = Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.post("/register", register);
router.delete("/:id", deleteUser);
router.put("/", editUser);
router.post("/login", login);
router.post("/token", getToken);
router.post("/logout", logout);

export default router;