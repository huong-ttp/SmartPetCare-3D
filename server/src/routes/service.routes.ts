import { Router } from "express";
import authMiddleware, {authorize} from "../middleware/auth.middleware";
import serviceController from "../controllers/service.controller";
import {listServices, getActiveServices} from "../controllers/service.controller";
import {createService, updateService, toggleServiceActive, deleteService} from "../controllers/service.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  serviceController.getActiveServices
);

router.get(
  "/active",
  getActiveServices
);

router.get(
  "/admin",
  authMiddleware,
  authorize("admin"),
  listServices
);

router.post(
  "/admin",
  authMiddleware,
  authorize("admin"),
  createService
);

router.put(
  "/admin/:id",
  authMiddleware,
  authorize("admin"),
  updateService
);

router.patch(
  "/admin/:id/toggle-active",
  authMiddleware,
  authorize("admin"),
  toggleServiceActive
);

router.delete(
  "/admin/:id",
  authMiddleware,
  authorize("admin"),
  deleteService
);

export default router;