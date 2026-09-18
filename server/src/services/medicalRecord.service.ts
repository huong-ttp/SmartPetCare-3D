import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";

interface CreateMedicalRecordData {
  diagnosis: string;
  treatment?: string;
  prescription?: string;
  weight_at_visit?: number;
  record_date?: string;
  notes?: string;
}

class MedicalRecordService {
  async getMedicalRecordsByPet(
    ownerId: number,
    petId: number,
    userRole?: string
  ) {
    // Kiểm tra pet có thuộc owner hoặc userRole là doctor/admin
    await petService.getPetById(
      petId,
      ownerId,
      userRole
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

  async createMedicalRecord(
    doctorId: number,
    appointmentId: number,
    data: CreateMedicalRecordData
  ) {
    const appointmentResult = await pool.query(
      `
      SELECT
        a.*,
        p.owner_id,
        s.price
      FROM appointments a
      JOIN pets p
        ON a.pet_id = p.pet_id
      JOIN services s
        ON a.service_id = s.service_id
      WHERE
        a.appointment_id = $1
        AND a.doctor_id = $2;
      `,
      [
        appointmentId,
        doctorId
      ]
    );

    if (appointmentResult.rowCount === 0) {
      throw new AppError(
        "Appointment not found",
        404
      );
    }

    const appointment = appointmentResult.rows[0];

    // 1
    const existed = await pool.query(
      `
      SELECT record_id
      FROM medical_records
      WHERE appointment_id = $1
      `,
      [appointmentId]
    );

    if (existed.rowCount! > 0) {
      throw new AppError(
        "Medical record already exists",
        400
      );
    }

    // 2
    if (appointment.status !== "confirmed") {
      throw new AppError(
        "Appointment is not confirmed",
        400
      );
    }

    // 3
    if (!data.diagnosis) {
      throw new AppError(
        "Diagnosis is required",
        400
      );
    }

    const medicalRecordResult = await pool.query(
      `
      INSERT INTO medical_records
      (
        pet_id,
        appointment_id,
        doctor_id,
        diagnosis,
        treatment,
        prescription,
        weight_at_visit,
        record_date,
        notes
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
        COALESCE($8, CURRENT_DATE),
        $9
      )
      RETURNING *;
      `,
      [
        appointment.pet_id,
        appointmentId,
        doctorId,
        data.diagnosis,
        data.treatment ?? null,
        data.prescription ?? null,
        data.weight_at_visit ?? null,
        data.record_date ?? null,
        data.notes ?? null
      ]
    );

    const medicalRecord = medicalRecordResult.rows[0];

    await pool.query(
      `
      UPDATE appointments
      SET
        status = 'completed',
        updated_at = NOW()
      WHERE appointment_id = $1;
      `,
      [
        appointmentId
      ]
    );

    // Cập nhật Pet.weight_kg (cache) từ weight_at_visit nếu có
    if (data.weight_at_visit) {
      await pool.query(
        `
        UPDATE pets
        SET weight_kg = $1, updated_at = NOW()
        WHERE pet_id = $2;
        `,
        [data.weight_at_visit, appointment.pet_id]
      );
    }

    const invoiceResult = await pool.query(
      `
      INSERT INTO invoices
      (
        appointment_id,
        owner_id,
        total_amount,
        status,
        issued_date
      )
      VALUES
      (
        $1,
        $2,
        $3,
        'unpaid',
        CURRENT_DATE
      )
      RETURNING *;
      `,
      [
        appointmentId,
        appointment.owner_id,
        appointment.price
      ]
    );

    const invoice = invoiceResult.rows[0];

    await pool.query(
      `
      INSERT INTO invoice_items
      (
        invoice_id,
        service_id,
        quantity,
        unit_price,
        subtotal
      )
      VALUES
      (
        $1,
        $2,
        1,
        $3,
        $3
      );
      `,
      [
        invoice.invoice_id,
        appointment.service_id,
        appointment.price
      ]
    );

    return {
      medical_record: medicalRecord,
      invoice,
      message:
        "Medical record created successfully. Invoice generated automatically."
    };
  }

  async listPatientsByDoctor(
    doctorId: number,
    search?: string
  ) {
    let query = `
      SELECT
        p.pet_id,
        p.name,
        p.species,
        p.breed,
        p.gender,
        p.avatar_url,
        p.date_of_birth,
        p.weight_kg,
        u.user_id AS owner_id,
        u.full_name AS owner_name,
        u.phone AS owner_phone,
        u.email AS owner_email,
        COUNT(DISTINCT mr.record_id) AS total_records,
        COUNT(DISTINCT a.appointment_id) AS total_appointments,
        MAX(COALESCE(mr.record_date, a.appointment_date)) AS last_visit_date
      FROM pets p
      INNER JOIN users u
        ON p.owner_id = u.user_id
      LEFT JOIN medical_records mr
        ON mr.pet_id = p.pet_id AND mr.doctor_id = $1
      LEFT JOIN appointments a
        ON a.pet_id = p.pet_id AND a.doctor_id = $1 AND a.status = 'completed'
      WHERE (mr.record_id IS NOT NULL OR a.appointment_id IS NOT NULL)
    `;

    const values: any[] = [doctorId];

    if (search && search.trim() !== "") {
      query += `
        AND
        (
          LOWER(p.name) LIKE LOWER($2)
          OR
          LOWER(u.full_name) LIKE LOWER($2)
          OR
          LOWER(COALESCE(p.breed, '')) LIKE LOWER($2)
        )
      `;

      values.push(`%${search.trim()}%`);
    }

    query += `
      GROUP BY
        p.pet_id,
        p.name,
        p.species,
        p.breed,
        p.gender,
        p.avatar_url,
        p.date_of_birth,
        p.weight_kg,
        u.user_id,
        u.full_name,
        u.phone,
        u.email
      ORDER BY
        last_visit_date DESC NULLS LAST,
        p.name ASC;
    `;

    const result = await pool.query(
      query,
      values
    );

    return result.rows;
  }
}

export default new MedicalRecordService();