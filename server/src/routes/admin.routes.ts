import { Router } from "express";
import adminController from "../controllers/admin.controller";
import authMiddleware, {
  authorize
} from "../middleware/auth.middleware";

import invoiceController from "../controllers/invoice.controller";
import paymentController from "../controllers/payment.controller";
import notificationController from "../controllers/notification.controller";


const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  authorize("admin"),
  adminController.getDashboard
);

router.get(
  "/stats",
  authMiddleware,
  authorize("admin"),
  adminController.getDashboard
);

router.get(
  "/users",
  authMiddleware,
  authorize("admin"),
  adminController.listUsers
);

router.post(
  "/users",
  authMiddleware,
  authorize("admin"),
  adminController.createUser
);

router.put(
  "/users/:id",
  authMiddleware,
  authorize("admin"),
  adminController.updateUser
);

router.put(
  "/users/:id/role",
  authMiddleware,
  authorize("admin"),
  adminController.updateUserRole
);

router.patch(
  "/users/:id/toggle-active",
  authMiddleware,
  authorize("admin"),
  adminController.toggleUserActive
);

router.get(
  "/pets",
  authMiddleware,
  authorize("admin"),
  adminController.listPets
);

router.get(
  "/pets/:id",
  authMiddleware,
  authorize("admin"),
  adminController.getPetById
);

router.put(
  "/pets/:id",
  authMiddleware,
  authorize("admin"),
  adminController.updatePet
);

router.delete(
  "/pets/:id",
  authMiddleware,
  authorize("admin"),
  adminController.deletePet
);

router.get(
  "/appointments",
  authMiddleware,
  authorize("admin"),
  adminController.listAppointments
);


// Appointment Management



router.get(
  "/doctors",
  authMiddleware,
  authorize("admin"),
  adminController.listDoctors
);

router.put(
  "/appointments/:id/assign",
  authMiddleware,
  authorize("admin"),
  adminController.assignDoctor
);

router.put(
  "/appointments/:id/cancel",
  authMiddleware,
  authorize("admin"),
  adminController.cancelAppointment
);

router.get(
  "/medical-records",
  authMiddleware,
  authorize("admin"),
  adminController.listMedicalRecords
);

router.get(
  "/vaccinations",
  authMiddleware,
  authorize("admin"),
  adminController.listVaccinations
);

router.get(
  "/invoices",
  authMiddleware,
  authorize("admin"),
  invoiceController.listInvoices
);

router.get(
  "/invoices/:id",
  authMiddleware,
  authorize("admin"),
  invoiceController.getInvoiceByIdAdmin
);

router.put(
  "/invoices/:id/cancel",
  authMiddleware,
  authorize("admin"),
  invoiceController.cancelInvoice
);

router.get(
  "/payments/:id",
  authMiddleware,
  authorize("admin"),
  paymentController.getPaymentByIdAdmin
);

router.put(
  "/payments/:id/confirm",
  authMiddleware,
  authorize("admin"),
  paymentController.confirmPayment
);

router.put(
  "/payments/:id/reject",
  authMiddleware,
  authorize("admin"),
  paymentController.rejectPayment
);

router.post(
  "/payments/cash",
  authMiddleware,
  authorize("admin"),
  paymentController.createCashPayment

);

router.get(
  "/notifications",
  authMiddleware,
  authorize("admin"),
  notificationController.listNotifications
);

router.post(
  "/notifications/system",
  authMiddleware,
  authorize("admin"),
  notificationController.sendSystemNotification
);
export default router;