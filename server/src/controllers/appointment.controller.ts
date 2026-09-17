import { Request, Response, NextFunction } from "express";

class AppointmentController {
    async getMyAppointments(req: Request, res: Response, next: NextFunction) {
        try {
            // TODO: Query appointments từ database theo req.user.user_id
            return res.json([]);
        } catch (error) {
            next(error);
        }
    }
}

export default new AppointmentController();
