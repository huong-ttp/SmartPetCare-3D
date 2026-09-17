import pool from "../config/database.config";
import petService from "./pet.service";

class MedicalRecordService {

  async getMedicalRecordsByPet(
    ownerId: number,
    petId: number
  ) {

    // Kiểm tra pet có thuộc owner
    await petService.getPetById(
      petId,
      ownerId
    );

    const result = await pool.query(
      `
      SELECT
        mr.record_id,
        mr.record_date,
        mr.diagnosis,
        mr.treatment,
        mr.prescription,
        mr.weight_at_visit,
        mr.notes,

        u.full_name AS doctor_name

      FROM medical_records mr

      INNER JOIN users u
        ON mr.doctor_id = u.user_id

      WHERE mr.pet_id = $1

      ORDER BY mr.record_date DESC;
      `,
      [
        petId
      ]
    );

    return result.rows;
  }

}

export default new MedicalRecordService();