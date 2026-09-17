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

export default {
  getInvoicesByOwner,
  getInvoiceById
};