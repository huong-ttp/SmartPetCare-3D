import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";

interface CreateHealthLogData {
  pet_id: number;
  weight_kg?: number;
  height_cm?: number;
  temperature?: number;
  appetite?: string;
  activity_level?: string;
  stool_condition?: string;
  vomiting?: boolean;
  symptoms?: string;
  notes?: string;
  log_date: string;
}

class HealthLogService {
  async createHealthLog(
    userId: number,
    data: CreateHealthLogData,
    userRole?: string
  ) {
    // Kiểm tra pet có tồn tại và phân quyền (owner hoặc doctor / admin)
    const pet = await petService.getPetById(
      data.pet_id,
      userId,
      userRole
    );

    const loggedBy = userId;
    const ownerId = pet.owner_id;

    // Thêm health log
    const result = await pool.query(
      `
      INSERT INTO pet_health_logs(
        pet_id,
        owner_id,
        weight_kg,
        height_cm,
        log_date,
        temperature,
        appetite,
        activity_level,
        stool_condition,
        vomiting,
        symptoms,
        notes,
        logged_by
      )
      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *;
      `,
      [
        data.pet_id,
        ownerId,
        data.weight_kg !== undefined && data.weight_kg !== null ? data.weight_kg : null,
        data.height_cm !== undefined && data.height_cm !== null ? data.height_cm : null,
        data.log_date,
        data.temperature !== undefined && data.temperature !== null ? data.temperature : null,
        data.appetite ?? null,
        data.activity_level ?? null,
        data.stool_condition ?? null,
        data.vomiting ?? false,
        data.symptoms ?? null,
        data.notes ?? null,
        loggedBy,
      ]
    );

    // Cập nhật cache weight cho bảng pets nếu có weight_kg
    if (data.weight_kg !== undefined && data.weight_kg !== null) {
      await pool.query(
        `
        UPDATE pets
        SET
          weight_kg = $1,
          updated_at = NOW()
        WHERE pet_id = $2
        `,
        [data.weight_kg, data.pet_id]
      );
    }

    return result.rows[0];
  }

  async getHealthLogsByPet(
    userId: number,
    petId: number,
    userRole?: string
  ) {
    await petService.getPetById(
      petId,
      userId,
      userRole
    );

    const result = await pool.query(
      `
      SELECT *
      FROM pet_health_logs
      WHERE pet_id = $1
      ORDER BY log_date DESC, created_at DESC;
      `,
      [petId]
    );

    return result.rows;
  }

  async getLatestHealthLog(
    userId: number,
    petId: number,
    userRole?: string
  ) {
    await petService.getPetById(
      petId,
      userId,
      userRole
    );

    const result = await pool.query(
      `
      SELECT *
      FROM pet_health_logs
      WHERE pet_id = $1
      ORDER BY log_date DESC, created_at DESC
      LIMIT 1;
      `,
      [petId]
    );

    return result.rows[0] ?? null;
  }

  async deleteHealthLog(
    userId: number,
    logId: number,
    userRole?: string
  ) {
    const logRes = await pool.query(
      `SELECT * FROM pet_health_logs WHERE log_id = $1`,
      [logId]
    );

    if (logRes.rows.length === 0) {
      throw new AppError("Health log not found", 404);
    }

    const log = logRes.rows[0];

    // Cho phép doctor, admin, hoặc người tạo/chủ nuôi xóa
    const normalizedRole = userRole?.toLowerCase();
    if (
      normalizedRole !== "doctor" &&
      normalizedRole !== "admin" &&
      log.owner_id !== userId &&
      log.logged_by !== userId
    ) {
      throw new AppError("You do not have permission to delete this health log", 403);
    }

    await pool.query(`DELETE FROM pet_health_logs WHERE log_id = $1`, [logId]);

    return { message: "Health log deleted successfully" };
  }
}

export default new HealthLogService();