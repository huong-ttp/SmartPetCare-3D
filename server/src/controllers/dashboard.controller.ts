import { Request, Response, NextFunction } from "express";
import pool from "../config/database.config";
import adminService from "../services/admin.service";
import appointmentService from "../services/appointment.service";

class DashboardController {
  /**
   * GET /api/dashboard
   * Endpoint thống kê tổng quan đa vai trò (Admin / Doctor / Owner)
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;

      // 1. Dành cho Quản trị viên (Admin)
      if (user.role === "admin") {
        const adminData = await adminService.getDashboard();
        return res.json({
          success: true,
          role: "admin",
          data: adminData,
        });
      }

      // 2. Dành cho Bác sĩ (Doctor)
      if (user.role === "doctor") {
        const doctorData = await appointmentService.getDoctorDashboard(user.user_id);
        return res.json({
          success: true,
          role: "doctor",
          data: doctorData,
        });
      }

      // 3. Dành cho Khách hàng / Chủ nuôi (Owner)
      const ownerId = user.user_id;

      // 3.1 Đếm số thú cưng
      const petsCountRes = await pool.query(
        `SELECT COUNT(*)::int AS total FROM pets WHERE owner_id = $1;`,
        [ownerId]
      );
      const totalPets = petsCountRes.rows[0]?.total || 0;

      // 3.2 Lịch hẹn sắp tới
      const upcomingApptsRes = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM appointments a
        JOIN pets p ON a.pet_id = p.pet_id
        WHERE p.owner_id = $1
          AND a.status = 'confirmed'
          AND (a.appointment_date > CURRENT_DATE 
               OR (a.appointment_date = CURRENT_DATE AND a.start_time >= CURRENT_TIME));
        `,
        [ownerId]
      );
      const upcomingAppointments = upcomingApptsRes.rows[0]?.total || 0;

      // 3.3 Hóa đơn chưa thanh toán
      const unpaidInvoicesRes = await pool.query(
        `
        SELECT 
          COUNT(*)::int AS total_unpaid,
          COALESCE(SUM(total_amount), 0)::numeric AS total_amount_due
        FROM invoices
        WHERE owner_id = $1 AND status = 'unpaid';
        `,
        [ownerId]
      );
      const unpaidInvoices = unpaidInvoicesRes.rows[0]?.total_unpaid || 0;
      const totalAmountDue = unpaidInvoicesRes.rows[0]?.total_amount_due || 0;

      // 3.4 Lịch tiêm phòng sắp đến hạn (trong 14 ngày tới)
      const vacDueRes = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM pet_vaccinations pv
        JOIN pets p ON pv.pet_id = p.pet_id
        WHERE p.owner_id = $1
          AND pv.next_due_date >= CURRENT_DATE
          AND pv.next_due_date <= CURRENT_DATE + INTERVAL '14 day';
        `,
        [ownerId]
      );
      const vaccinesDue = vacDueRes.rows[0]?.total || 0;

      // 3.5 Top 5 lịch hẹn gần nhất của chủ nuôi
      const recentApptsRes = await pool.query(
        `
        SELECT 
          a.appointment_id,
          a.appointment_date,
          a.start_time,
          a.end_time,
          a.status,
          a.reason,
          p.name AS pet_name,
          p.species AS pet_species,
          s.name AS service_name,
          u.full_name AS doctor_name
        FROM appointments a
        JOIN pets p ON a.pet_id = p.pet_id
        LEFT JOIN services s ON a.service_id = s.service_id
        LEFT JOIN users u ON a.doctor_id = u.user_id
        WHERE p.owner_id = $1
        ORDER BY a.appointment_date DESC, a.start_time DESC
        LIMIT 5;
        `,
        [ownerId]
      );

      // 3.6 Thông báo chưa đọc
      const unreadNotifsRes = await pool.query(
        `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1 AND is_read = false;`,
        [ownerId]
      );
      const unreadNotifications = unreadNotifsRes.rows[0]?.total || 0;

      return res.json({
        success: true,
        role: "owner",
        data: {
          overview: {
            totalPets,
            upcomingAppointments,
            unpaidInvoices,
            totalAmountDue,
            vaccinesDue,
            unreadNotifications,
          },
          recentAppointments: recentApptsRes.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/stats
   * Thống kê tổng quan toàn hệ thống phòng khám
   */
  async getGeneralStats(req: Request, res: Response, next: NextFunction) {
    try {
      const statsRes = await pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM users WHERE is_deleted = false) AS total_users,
          (SELECT COUNT(*)::int FROM users WHERE role = 'doctor' AND is_active = true AND is_deleted = false) AS active_doctors,
          (SELECT COUNT(*)::int FROM pets) AS total_pets,
          (SELECT COUNT(*)::int FROM appointments WHERE appointment_date = CURRENT_DATE AND status <> 'cancelled') AS today_appointments,
          (SELECT COUNT(*)::int FROM appointments WHERE status = 'completed') AS total_completed_appointments,
          (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM invoices WHERE status = 'paid') AS total_revenue;
      `);

      return res.json({
        success: true,
        data: statsRes.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/admin
   */
  async getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getDashboard();
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/doctor
   */
  async getDoctorDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await appointmentService.getDoctorDashboard(req.user!.user_id);
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
