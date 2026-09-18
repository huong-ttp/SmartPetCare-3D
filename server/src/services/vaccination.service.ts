import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";

export interface CreateVaccinationData {
  pet_id?: number | string;
  vaccine_type_id: number | string;
  medical_record_id?: number | string | null;
  appointment_id?: number | string | null;
  batch_number?: string;
  date_administered?: string;
}

class VaccinationService {
  async getVaccinationsByPet(ownerId: number, petId: number, userRole?: string) {
    // Verify that the pet belongs to the requesting owner or user is doctor/admin
    await petService.getPetById(petId, ownerId, userRole);

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
    appointmentId?: number | null,
    data: CreateVaccinationData = {} as CreateVaccinationData
  ) {
    const rawApptId = appointmentId || data.appointment_id;
    const vaccineTypeId = Number(data.vaccine_type_id);

    if (!vaccineTypeId || isNaN(vaccineTypeId)) {
      throw new AppError("Vaccine type ID is required", 400);
    }

    let resolvedPetId: number | null = data.pet_id ? Number(data.pet_id) : null;
    let resolvedMedicalRecordId: number | null = data.medical_record_id ? Number(data.medical_record_id) : null;

    // Resolve from appointment if available
    if (rawApptId) {
      const apptRes = await pool.query(
        `SELECT appointment_id, pet_id, doctor_id FROM appointments WHERE appointment_id = $1`,
        [rawApptId]
      );
      if (apptRes.rowCount! > 0) {
        if (!resolvedPetId) {
          resolvedPetId = Number(apptRes.rows[0].pet_id);
        }
      }

      // If medical_record_id not provided, check if one already exists for this appointment
      if (!resolvedMedicalRecordId) {
        const medRes = await pool.query(
          `SELECT record_id FROM medical_records WHERE appointment_id = $1 ORDER BY record_id DESC LIMIT 1`,
          [rawApptId]
        );
        if (medRes.rowCount! > 0) {
          resolvedMedicalRecordId = Number(medRes.rows[0].record_id);
        }
      }
    }

    // Resolve from medical_record if pet_id still missing
    if (!resolvedPetId && resolvedMedicalRecordId) {
      const medRes = await pool.query(
        `SELECT record_id, pet_id FROM medical_records WHERE record_id = $1`,
        [resolvedMedicalRecordId]
      );
      if (medRes.rowCount! > 0) {
        resolvedPetId = Number(medRes.rows[0].pet_id);
      }
    }

    if (!resolvedPetId) {
      throw new AppError("Pet ID is required to record vaccination", 400);
    }

    // Check vaccine type existence & recommended interval
    const vaccineTypeResult = await pool.query(
      `
      SELECT *
      FROM vaccine_types
      WHERE vaccine_type_id = $1;
      `,
      [vaccineTypeId]
    );

    if (vaccineTypeResult.rowCount === 0) {
      throw new AppError("Vaccine type not found", 404);
    }

    const vaccineType = vaccineTypeResult.rows[0];

    const administeredDate = data.date_administered
      ? new Date(data.date_administered)
      : new Date();

    const nextDueDate = new Date(administeredDate);
    const intervalDays = Number(vaccineType.recommended_interval_days) || 365;
    nextDueDate.setDate(nextDueDate.getDate() + intervalDays);

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
        resolvedPetId,
        vaccineTypeId,
        resolvedMedicalRecordId,
        doctorId,
        administeredDate.toISOString().split("T")[0],
        nextDueDate.toISOString().split("T")[0],
        data.batch_number?.trim() || null
      ]
    );

    const createdId = vaccinationResult.rows[0].vaccination_id;

    // Fetch joined details
    const detailResult = await pool.query(
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
      WHERE pv.vaccination_id = $1;
      `,
      [createdId]
    );

    const vaccination = detailResult.rows[0] || vaccinationResult.rows[0];

    return {
      vaccination,
      message: "Vaccination created successfully."
    };
  }
}

export default new VaccinationService();
