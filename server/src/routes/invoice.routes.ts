import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import invoiceController from "../controllers/invoice.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  invoiceController.getInvoicesByOwner
);

router.get(
  "/:id",
  authMiddleware,
  invoiceController.getInvoiceById
);

router.get(

  "/admin/list",

  authMiddleware,

  invoiceController.listInvoices

);

router.put(

  "/admin/:id/cancel",

  authMiddleware,

  invoiceController.cancelInvoice

);

export default router;