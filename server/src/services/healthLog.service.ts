import pool from "../config/database.config";
import petService from "./pet.service";

interface CreateHealthLogData {
  pet_id: number;
  weight_kg: number;
  height_cm?: number;
  log_date: string;
}

class HealthLogService {
  async createHealthLog(
    ownerId: number,
    data: CreateHealthLogData
  ) {

    // Kiểm tra pet có tồn tại và thuộc owner
    await petService.getPetById(
      data.pet_id,
      ownerId
    );

    // Thêm health log
    const result = await pool.query(
      `
      INSERT INTO pet_health_logs(
        pet_id,
        owner_id,
        weight_kg,
        height_cm,
        log_date
      )
      VALUES(
        $1,$2,$3,$4,$5
      )
      RETURNING *;
      `,
      [
        data.pet_id,
        ownerId,
        data.weight_kg,
        data.height_cm ?? null,
        data.log_date
      ]
    );

    // Cập nhật cache weight cho bảng pets
    await pool.query(
      `
      UPDATE pets
      SET
        weight_kg = $1,
        updated_at = NOW()
      WHERE pet_id = $2
      `,
      [
        data.weight_kg,
        data.pet_id
      ]
    );

    return result.rows[0];
  }
  async getHealthLogsByPet(
    ownerId: number,
    petId: number,
    userRole?: string
  ) {
    await petService.getPetById(
      petId,
      ownerId,
      userRole
    );
    const result = await pool.query(
      `
      SELECT *
      FROM pet_health_logs
      WHERE pet_id = $1
      ORDER BY log_date DESC;
      `,
      [
        petId
      ]
    );
    return result.rows;
  }

  async getLatestHealthLog(
    ownerId: number,
    petId: number,
    userRole?: string
  ) {
    await petService.getPetById(
      petId,
      ownerId,
      userRole
    );

  const result = await pool.query(
    `
    SELECT *
    FROM pet_health_logs
    WHERE pet_id = $1
    ORDER BY log_date DESC
    LIMIT 1;
    `,
    [
      petId
    ]
  );

  return result.rows[0] ?? null;
}
}

export default new HealthLogService();