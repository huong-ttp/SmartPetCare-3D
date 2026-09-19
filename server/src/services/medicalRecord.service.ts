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

interface UpdateMedicalRecordData {

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
const medicalRecord =
  medicalRecordResult.rows[0];
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

async updateMedicalRecord(
  recordId: number,
  data: UpdateMedicalRecordData
) {

  const existed = await pool.query(
    `
    SELECT *

    FROM medical_records

    WHERE record_id = $1;
    `,
    [recordId]
  );

  if (existed.rowCount === 0) {

    throw new AppError(
      "Medical record not found",
      404
    );

  }
    const result = await pool.query(
    `
    UPDATE medical_records

    SET

      diagnosis = $1,

      treatment = $2,

      prescription = $3,

      weight_at_visit = $4,

      record_date = $5,

      notes = $6

    WHERE record_id = $7

    RETURNING *;
    `,
    [

      data.diagnosis,

      data.treatment ?? null,

      data.prescription ?? null,

      data.weight_at_visit ?? null,

      data.record_date ?? null,

      data.notes ?? null,

      recordId

    ]
  );

  return result.rows[0];

}

async deleteMedicalRecord(
  recordId: number
) {

  const existed = await pool.query(
    `
    SELECT *
    FROM medical_records
    WHERE record_id = $1;
    `,
    [recordId]
  );

  if (existed.rowCount === 0) {

    throw new AppError(
      "Medical record not found",
      404
    );

  }
    const vaccineResult = await pool.query(
    `
    SELECT COUNT(*) AS total

    FROM pet_vaccinations

    WHERE medical_record_id = $1;
    `,
    [recordId]
  );

  const vaccineCount =
    Number(vaccineResult.rows[0].total);

  if (vaccineCount > 0) {

    throw new AppError(
      "Cannot delete medical record because vaccination records are linked.",
      409
    );

  }
    await pool.query(
    `
    DELETE FROM medical_records

    WHERE record_id = $1;
    `,
    [recordId]
  );

  return {

    message:
      "Medical record deleted successfully"

  };

}
async listPatientsByDoctor(
  doctorId: number,
  search?: string
) {
  let query = `
    SELECT DISTINCT
      p.pet_id,
      p.name,
      p.species,
      p.breed,
      p.gender,
      p.avatar_url,

      u.user_id AS owner_id,
      u.full_name AS owner_name

    FROM medical_records mr

    INNER JOIN pets p
      ON mr.pet_id = p.pet_id

    INNER JOIN users u
      ON p.owner_id = u.user_id

    WHERE mr.doctor_id = $1
  `;

  const values: any[] = [doctorId];

  if (search) {
    query += `
      AND
      (
        LOWER(p.name) LIKE LOWER($2)
        OR
        LOWER(u.full_name) LIKE LOWER($2)
      )
    `;

    values.push(`%${search}%`);
  }

  query += `
    ORDER BY
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