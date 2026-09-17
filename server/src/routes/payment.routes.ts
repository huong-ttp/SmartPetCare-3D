import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware";

import paymentController from "../controllers/payment.controller";

const router = Router();

router.post(
  "/",
  authMiddleware,
  paymentController.createPayment
);

router.get(
  "/invoice/:invoiceId",
  authMiddleware,
  paymentController.getPaymentByInvoice
);

router.get(
  "/",
  authMiddleware,
  paymentController.getPaymentsByOwner
);

router.get(
  "/:id",
  authMiddleware,
  paymentController.getPaymentById
);

router.put(
  "/:id/status",
  authMiddleware,
  paymentController.updatePaymentStatus
);
export default router;