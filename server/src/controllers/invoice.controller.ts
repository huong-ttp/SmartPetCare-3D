import { Request, Response, NextFunction } from "express";
import invoiceService from "../services/invoice.service";

export const getInvoicesByOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const invoices =
      await invoiceService.getInvoicesByOwner(
        ownerId,
        {
          status: req.query.status as string
        }
      );

    res.json({
      success: true,
      data: invoices
    });

  } catch (error) {
    next(error);
  }

  
};

export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const invoiceId = Number(req.params.id);

    const invoice =
      await invoiceService.getInvoiceById(
        ownerId,
        invoiceId
      );

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    next(error);
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

        page: Number(req.query.page),

        limit: Number(req.query.limit)

      });

    res.json({

      success: true,

      data: invoices

    });

  } catch (error) {

    next(error);

  }

};

export const getInvoiceByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const invoiceId = Number(req.params.id);

    const invoice =
      await invoiceService.getInvoiceByIdAdmin(invoiceId);

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    next(error);
  }
};

export const cancelInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const invoiceId = Number(req.params.id);

    const { reason } = req.body;

    const invoice =
      await invoiceService.cancelInvoice(
        invoiceId,
        reason
      );

    res.json({

      success: true,

      message: "Invoice cancelled successfully",

      data: invoice

    });

  } catch (error) {

    next(error);

  }

};

export default {
  getInvoicesByOwner,
  getInvoiceById,
  listInvoices,
  getInvoiceByIdAdmin,
  cancelInvoice
};