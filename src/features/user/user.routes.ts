import { Router } from "express";
import { getAllUsers, deleteUser } from "./user.controller";
import { authGuard } from "../../common/middleware/auth.guard";
import { adminGuard } from "../../common/middleware/admin.guard";

const router = Router();

// Only Admins can hit these
router.get("/", authGuard, adminGuard, getAllUsers);
router.delete("/:id", authGuard, adminGuard, deleteUser);

export default router;