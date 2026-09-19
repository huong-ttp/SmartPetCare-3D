import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface CreateVaccinationData {
  vaccine_type_id: number;
  batch_number?: string;
  date_administered?: string;
}

interface UpdateVaccinationData {
  batch_number: string;
  date_administered: string;
}
class VaccinationService {
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

const medicalRecord =
  medicalRecordResult.rows[0];

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

const vaccineType =
  vaccineTypeResult.rows[0];

  const administeredDate = new Date(
  data.date_administered ??
  new Date()
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
  message:
    "Vaccination created successfully."
};


}
async updateVaccination(
  vaccinationId: number,
  data: UpdateVaccinationData
) {

  if (!data.batch_number?.trim()) {
    throw new AppError(
      "Batch number is required",
      400
    );
  }

  if (!data.date_administered) {
    throw new AppError(
      "Date administered is required",
      400
    );
  }

  // Vaccine tồn tại?
  const vaccinationResult =
    await pool.query(
      `
      SELECT
        pv.*,
        vt.recommended_interval_days
      FROM pet_vaccinations pv

      INNER JOIN vaccine_types vt
        ON pv.vaccine_type_id =
           vt.vaccine_type_id

      WHERE vaccination_id = $1;
      `,
      [vaccinationId]
    );

  if (vaccinationResult.rowCount === 0) {
    throw new AppError(
      "Vaccination not found",
      404
    );
  }

  const vaccination =
    vaccinationResult.rows[0];
      const interval =
    vaccination.recommended_interval_days;

  const nextDueResult =
    await pool.query(
      `
      SELECT
        ($1::date + ($2 || ' days')::interval)::date
          AS next_due_date;
      `,
      [
        data.date_administered,
        interval
      ]
    );

  const nextDueDate =
    nextDueResult.rows[0].next_due_date;
      const result =
    await pool.query(
      `
      UPDATE pet_vaccinations

      SET
        batch_number = $1,

        date_administered = $2,

        next_due_date = $3

      WHERE vaccination_id = $4

      RETURNING *;
      `,
      [
        data.batch_number,
        data.date_administered,
        nextDueDate,
        vaccinationId
      ]
    );

  return result.rows[0];
}

async deleteVaccination(
  vaccinationId: number
) {

  const existed = await pool.query(
    `
    SELECT vaccination_id
    FROM pet_vaccinations
    WHERE vaccination_id = $1;
    `,
    [vaccinationId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Vaccination not found",
      404
    );
  }

  await pool.query(
    `
    DELETE
    FROM pet_vaccinations
    WHERE vaccination_id = $1;
    `,
    [vaccinationId]
  );

  return {
    message:
      "Vaccination deleted successfully"
  };
}
}

export default new VaccinationService();