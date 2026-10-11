import { Request, Response, NextFunction } from "express";
import shiftService from "../services/shift.service";
import AppError from "../utils/AppError";
import {
  shiftRangeQuerySchema,
  createShiftSchema,
  updateShiftSchema,
} from "../validations/shift.validation";

const firstError = (error: { issues: { message: string }[] }) =>
  error.issues[0]?.message ?? "Dữ liệu không hợp lệ";

const parseId = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("ID ca trực không hợp lệ", 400);
  }
  return id;
};

/** Bác sĩ: xem ca trực của chính mình */
export const getMyShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = shiftRangeQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new AppError(firstError(parsed.error), 400);

    const data = await shiftService.getDoctorShifts(req.user!.user_id, {
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/** Admin: xem ca trực của tất cả (hoặc 1) bác sĩ */
export const listShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = shiftRangeQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new AppError(firstError(parsed.error), 400);

    const data = await shiftService.listShifts({
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      doctorId: parsed.data.doctor_id,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createShiftSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(firstError(parsed.error), 400);

    const data = await shiftService.createShifts(req.user!.user_id, parsed.data);

    res.status(201).json({
      success: true,
      message:
        data.skipped_count > 0
          ? `Đã tạo ${data.created_count} ca, bỏ qua ${data.skipped_count} ca đã tồn tại`
          : `Đã tạo ${data.created_count} ca trực`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateShiftSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(firstError(parsed.error), 400);

    const data = await shiftService.updateShift(parseId(req.params.id as string), parsed.data);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await shiftService.deleteShift(parseId(req.params.id as string));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export default { getMyShifts, listShifts, createShifts, updateShift, deleteShift };
