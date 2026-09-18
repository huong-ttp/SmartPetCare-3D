import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";

class VaccinationService {
  async getVaccinationsByPet(ownerId: number, petId: number) {
    // Verify that the pet belongs to the requesting owner
    await petService.getPetById(petId, ownerId);

    const result = await pool.query(
      `
      SELECT
        pv.vaccination_id,
        pv.pet_id,
        pv.vaccine_type_id,
        pv.medical_record_id,
        pv.administered_by,
        pv.date_administered,
        pv.next_due_date,
        pv.batch_number,
        pv.reminder_sent,
        pv.created_at,
        vt.name AS vaccine_name,
        vt.description AS vaccine_description,
        vt.recommended_interval_days,
        u.full_name AS doctor_name,
        p.name AS pet_name
      FROM pet_vaccinations pv
      INNER JOIN vaccine_types vt
        ON pv.vaccine_type_id = vt.vaccine_type_id
      INNER JOIN pets p
        ON pv.pet_id = p.pet_id
      LEFT JOIN users u
        ON pv.administered_by = u.user_id
      WHERE pv.pet_id = $1
      ORDER BY pv.date_administered DESC, pv.next_due_date ASC, pv.vaccination_id DESC;
      `,
      [petId]
    );

    return result.rows;
  }
}

export default new VaccinationService();
