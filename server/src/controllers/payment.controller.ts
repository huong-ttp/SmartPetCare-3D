import { Request, Response, NextFunction } from "express";
import paymentService from "../services/payment.service";

export const createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const ownerId = req.user!.user_id;

        const payment =
            await paymentService.createPayment(
                ownerId,
                req.body
            );

        res.status(201).json({
            success: true,
            data: payment
        });

    } catch (error) {
        next(error);
    }

};

export const getPaymentByInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const invoiceId = Number(
      req.params.invoiceId
    );

    const payment =
      await paymentService.getPaymentByInvoice(
        ownerId,
        invoiceId
      );

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    next(error);
  }

};

export const getPaymentsByOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const payments =
      await paymentService.getPaymentsByOwner(
        ownerId
      );

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    next(error);
  }

};

export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const paymentId = Number(
      req.params.id
    );

    const payment =
      await paymentService.getPaymentById(
        ownerId,
        paymentId
      );

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    next(error);
  }

};

export const updatePaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const paymentId = Number(
      req.params.id
    );

    const payment =
      await paymentService.updatePaymentStatus(
        paymentId,
        req.body
      );

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    next(error);
  }

};

export const getPaymentByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const paymentId =
      Number(req.params.id);

    const payment =
      await paymentService.getPaymentByIdAdmin(
        paymentId
      );

    res.json({

      success: true,

      data: payment

    });

  } catch (error) {

    next(error);

  }

};

export const confirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const paymentId =
      Number(req.params.id);

    const payment =
      await paymentService.confirmPayment(
        paymentId
      );

    res.json({

      success: true,

      message:
        "Payment confirmed successfully",

      data: payment

    });

  } catch (error) {

    next(error);

  }

};

export const rejectPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const paymentId =
      Number(req.params.id);

    const payment =
      await paymentService.rejectPayment(
        paymentId,
        req.body.reason
      );

    res.json({

      success: true,

      message:
        "Payment rejected successfully",

      data: payment

    });

  } catch (error) {

    next(error);

  }

};

export const createCashPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const payment =
      await paymentService.createCashPayment(
        req.body
      );

    res.status(201).json({

      success: true,

      message:
        "Cash payment recorded successfully",

      data: payment

    });

  } catch (err) {

    next(err);

  }

};

export const listPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payments = await paymentService.listPayments({
      search: req.query.search as string,
      status: req.query.status as string,
      method: req.query.method as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

export default {
    createPayment,
    getPaymentByInvoice,
    getPaymentsByOwner,
    getPaymentById,
    updatePaymentStatus,
    getPaymentByIdAdmin,
    confirmPayment,
    rejectPayment,
    createCashPayment,
    listPayments
};