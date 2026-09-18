import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";

interface CreateVaccinationData {
  vaccine_type_id: number;
  batch_number?: string;
  date_administered?: string;
}

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

  async createVaccination(
    doctorId: number,
    appointmentId: number,
    data: CreateVaccinationData
  ) {
    const medicalRecordResult = await pool.query(
      `
      SELECT
        record_id,
        pet_id
      FROM medical_records
      WHERE
        appointment_id = $1
        AND doctor_id = $2;
      `,
      [
        appointmentId,
        doctorId
      ]
    );

    if (medicalRecordResult.rowCount === 0) {
      throw new AppError(
        "Medical record not found",
        404
      );
    }

    const medicalRecord = medicalRecordResult.rows[0];

    const existed = await pool.query(
      `
      SELECT vaccination_id
      FROM pet_vaccinations
      WHERE medical_record_id = $1;
      `,
      [
        medicalRecord.record_id
      ]
    );

    if (existed.rowCount! > 0) {
      throw new AppError(
        "Vaccination already exists for this medical record",
        400
      );
    }

    const vaccineTypeResult = await pool.query(
      `
      SELECT *
      FROM vaccine_types
      WHERE vaccine_type_id = $1;
      `,
      [
        data.vaccine_type_id
      ]
    );

    if (vaccineTypeResult.rowCount === 0) {
      throw new AppError(
        "Vaccine type not found",
        404
      );
    }

    const vaccineType = vaccineTypeResult.rows[0];

    const administeredDate = new Date(
      data.date_administered ?? new Date()
    );

    const nextDueDate = new Date(
      administeredDate
    );

    nextDueDate.setDate(
      nextDueDate.getDate() +
      vaccineType.recommended_interval_days
    );

    const vaccinationResult = await pool.query(
      `
      INSERT INTO pet_vaccinations
      (
        pet_id,
        vaccine_type_id,
        medical_record_id,
        administered_by,
        date_administered,
        next_due_date,
        batch_number,
        reminder_sent
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        false
      )
      RETURNING *;
      `,
      [
        medicalRecord.pet_id,
        data.vaccine_type_id,
        medicalRecord.record_id,
        doctorId,
        administeredDate,
        nextDueDate,
        data.batch_number ?? null
      ]
    );

    const vaccination = vaccinationResult.rows[0];

    return {
      vaccination,
      message: "Vaccination created successfully."
    };
  }
}

export default new VaccinationService();
