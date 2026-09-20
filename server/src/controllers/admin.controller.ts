import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";
import invoiceService from "../services/invoice.service";

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const dashboard =
      await adminService.getDashboard();

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    next(error);
  }

};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const users =
await adminService.listUsers({

    search: req.query.search as string,

    role: req.query.role as string,

    status: req.query.status as string,

    page: Number(req.query.page) || 1,

    limit: Number(req.query.limit) || 10

});

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    next(error);
  }

};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const user =
      await adminService.createUser(
        req.body
      );

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }

};

export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const adminId =
      req.user!.user_id;

    const userId =
      Number(req.params.id);

    const user =
      await adminService.updateUserRole(
        adminId,
        userId,
        req.body
      );

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }

};

export const toggleUserActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const adminId =
      req.user!.user_id;

    const userId =
      Number(req.params.id);

    const user =
      await adminService.toggleUserActive(
        adminId,
        userId
      );

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }

};

export const listPets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const pets =
      await adminService.listPets({

        search:
          req.query.search as string,

        species:
          req.query.species as string,

        page:
          Number(req.query.page) || 1,

        limit:
          Number(req.query.limit) || 10

      });

    res.json({
      success: true,
      data: pets
    });

  } catch (error) {
    next(error);
  }

};

export const getPetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const pet =
      await adminService.getPetById(
        Number(req.params.id)
      );

    res.json({

      success: true,

      data: pet

    });

  }

  catch (err) {

    next(err);

  }

};

export const updatePet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const pet =
      await adminService.updatePet(
        Number(req.params.id),
        req.body
      );

    res.json({

      success: true,

      message: "Pet updated successfully",

      data: pet

    });

  } catch (err) {

    next(err);

  }

};

export const deletePet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const result =
      await adminService.deletePet(
        Number(req.params.id)
      );

    res.json({

      success: true,

      message: result.message

    });

  } catch (err) {

    next(err);

  }

};

export const listAppointments = async (

  req: Request,

  res: Response,

  next: NextFunction

) => {

  try {

    const appointments =
      await adminService.listAppointments({

        search:
          req.query.search as string,

        status:
          req.query.status as string,

        unassigned:
          req.query.unassigned === "true",

        dateFrom:
          req.query.dateFrom as string,

        dateTo:
          req.query.dateTo as string,

        page:
          Number(req.query.page) || 1,

        limit:
          Number(req.query.limit) || 10

      });

    res.json({

      success: true,

      data: appointments

    });

  } catch (err) {

    next(err);

  }

};

export const listDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const doctors =
      await adminService.listDoctors();

    res.json({

      success: true,

      data: doctors

    });

  } catch (err) {

    next(err);

  }

};

export const assignDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const appointment =
      await adminService.assignDoctor(

        Number(req.params.id),

        req.body.doctor_id

      );

    res.json({

      success: true,

      message: "Doctor assigned successfully",

      data: appointment

    });

  } catch (err) {

    next(err);

  }

};

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const appointment =
      await adminService.cancelAppointment(

        Number(req.params.id),

        req.body.cancel_reason

      );

    res.json({

      success: true,

      message: "Appointment cancelled successfully",

      data: appointment

    });

  } catch (err) {

    next(err);

  }

};

export const listMedicalRecords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const records =
      await adminService.listMedicalRecords({

        search:
          req.query.search as string,

        doctorId:
          req.query.doctorId
            ? Number(req.query.doctorId)
            : undefined,

        dateFrom:
          req.query.dateFrom as string,

        dateTo:
          req.query.dateTo as string,

        page:
          Number(req.query.page) || 1,

        limit:
          Number(req.query.limit) || 10

      });

    res.json({

      success: true,

      data: records

    });

  } catch (err) {

    next(err);

  }

};

export const listVaccinations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const data =
      await adminService.listVaccinations({

        search: req.query.search as string,

        vaccineType: req.query.vaccineType
          ? Number(req.query.vaccineType)
          : undefined,

        dueStatus: req.query.dueStatus as
          | "upcoming"
          | "overdue"
          | "valid"
          | undefined,

        page: req.query.page
          ? Number(req.query.page)
          : 1,

        limit: req.query.limit
          ? Number(req.query.limit)
          : 10

      });

    res.json({

      success: true,

      data

    });

  } catch (err) {

    next(err);

  }

};

export const listInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const invoices =
      await invoiceService.listInvoices({
        search: req.query.search as string,
        status: req.query.status as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const invoice =
      await invoiceService.getInvoiceByIdAdmin(
        Number(req.params.id)
      );

    res.json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const invoice =
      await invoiceService.cancelInvoice(
        Number(req.params.id),
        req.body.reason
      );

    res.json({
      success: true,
      message: "Invoice cancelled successfully",
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getDashboard,
  listUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
  listPets,
  getPetById,
  updatePet,
  deletePet,
  listAppointments,
  listDoctors,
  assignDoctor,
  cancelAppointment,
  listMedicalRecords,
  listVaccinations,
  listInvoices,
  getInvoiceByIdAdmin,
  cancelInvoice
};