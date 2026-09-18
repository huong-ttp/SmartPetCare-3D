import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";

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
        mr.pet_id,
        mr.appointment_id,
        mr.doctor_id,
        mr.record_date,
        mr.diagnosis,
        mr.treatment,
        mr.prescription,
        mr.weight_at_visit,
        mr.notes,
        mr.created_at,
        u.full_name AS doctor_name,
        p.name AS pet_name
      FROM medical_records mr
      INNER JOIN pets p
        ON mr.pet_id = p.pet_id
      LEFT JOIN users u
        ON mr.doctor_id = u.user_id
      WHERE mr.pet_id = $1
      ORDER BY mr.record_date DESC, mr.created_at DESC;
      `,
      [petId]
    );

    return result.rows;
  }

  async getMedicalRecordById(
    ownerId: number,
    recordId: number
  ) {
    const recordResult = await pool.query(
      `
      SELECT
        mr.record_id,
        mr.pet_id,
        mr.appointment_id,
        mr.doctor_id,
        mr.diagnosis,
        mr.treatment,
        mr.prescription,
        mr.weight_at_visit,
        mr.record_date,
        mr.notes,
        mr.created_at,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.owner_id,
        u.full_name AS doctor_name,
        a.appointment_date,
        a.start_time AS appointment_start_time,
        a.end_time AS appointment_end_time,
        a.status AS appointment_status,
        s.name AS service_name
      FROM medical_records mr
      INNER JOIN pets p
        ON mr.pet_id = p.pet_id
      LEFT JOIN users u
        ON mr.doctor_id = u.user_id
      LEFT JOIN appointments a
        ON mr.appointment_id = a.appointment_id
      LEFT JOIN services s
        ON a.service_id = s.service_id
      WHERE mr.record_id = $1;
      `,
      [recordId]
    );

    if (recordResult.rowCount === 0) {
      throw new AppError("Medical record not found", 404);
    }

    const record = recordResult.rows[0];

    // Check ownership: Record must belong to the requesting owner's pet
    if (record.owner_id !== ownerId) {
      throw new AppError("Medical record not found", 404);
    }

    // Query vaccinations administered in this visit (PET_VACCINATIONS.medical_record_id trỏ tới record này)
    const vacResult = await pool.query(
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
        vt.name AS vaccine_name,
        vt.description AS vaccine_description,
        vt.recommended_interval_days
      FROM pet_vaccinations pv
      LEFT JOIN vaccine_types vt
        ON pv.vaccine_type_id = vt.vaccine_type_id
      WHERE pv.medical_record_id = $1
      ORDER BY pv.date_administered DESC, pv.vaccination_id DESC;
      `,
      [recordId]
    );

    return {
      ...record,
      vaccinations: vacResult.rows,
    };
  }
}

export default new MedicalRecordService();