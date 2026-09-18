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

export default {
    createPayment,
    getPaymentByInvoice,
    getPaymentsByOwner,
    getPaymentById,
    updatePaymentStatus
};