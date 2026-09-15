import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";

interface CreateAppointmentData {
  pet_id: number;
  service_id: number;
  appointment_date: string;
  start_time: string;
  reason?: string;
  notes?: string;
}
interface CancelAppointmentData {
  cancel_reason: string;
}

class AppointmentService {
    async createAppointment(
  ownerId: number,
  data: CreateAppointmentData
) {
    await petService.getPetById(
  data.pet_id,
  ownerId
);
const serviceResult = await pool.query(
  `
  SELECT *
  FROM services
  WHERE service_id = $1
    AND is_active = true;
  `,
  [data.service_id]
);
if (serviceResult.rowCount === 0) {
  throw new AppError(
    "Service not found",
    404
);
}
const service = serviceResult.rows[0];
const duration = service.duration_minutes;
const start = new Date(
  `1970-01-01T${data.start_time}`
);

start.setMinutes(
  start.getMinutes() + duration
);
const endTime =
  start
    .toTimeString()
    .slice(0,5);
const existed = await pool.query(
`
SELECT *
FROM appointments
WHERE appointment_date = $1
AND start_time = $2
AND status <> 'cancelled';
`,
[
    data.appointment_date,
    data.start_time
]
);
if (existed.rowCount! > 0) {
    throw new AppError(
        "Appointment time is unavailable",
        409
    );
}
const result = await pool.query(
  `
  INSERT INTO appointments(
      pet_id,
      doctor_id,
      service_id,
      appointment_date,
      start_time,
      end_time,
      status,
      reason,
      notes
  )
  VALUES(
      $1,
      NULL,
      $2,
      $3,
      $4,
      $5,
      'confirmed',
      $6,
      $7
  )
  RETURNING *;
  `,
  [
      data.pet_id,
      data.service_id,
      data.appointment_date,
      data.start_time,
      endTime,
      data.reason ?? null,
      data.notes ?? null
  ]
);
return result.rows[0];

}

async getAppointmentsByOwner(
  ownerId: number
) {

  const result = await pool.query(
    `
    SELECT
      a.*,
      p.name AS pet_name,
      s.name AS service_name
    FROM appointments a
    JOIN pets p
      ON a.pet_id = p.pet_id
    JOIN services s
      ON a.service_id = s.service_id
    WHERE p.owner_id = $1
    ORDER BY
      a.appointment_date DESC,
      a.start_time DESC;
    `,
    [ownerId]
  );

  return result.rows;
}

async getAppointmentById(
  ownerId: number,
  appointmentId: number
) {

  const result = await pool.query(
    `
    SELECT
      a.*,
      p.name AS pet_name,
      s.name AS service_name
    FROM appointments a
    JOIN pets p
      ON a.pet_id = p.pet_id
    JOIN services s
      ON a.service_id = s.service_id
    WHERE
      a.appointment_id = $1
      AND p.owner_id = $2;
    `,
    [
      appointmentId,
      ownerId
    ]
  );

  if (result.rowCount === 0) {
    throw new AppError(
        "Appointment not found",
        404
    );
}

  return result.rows[0];
}
async cancelAppointment(
  ownerId: number,
  appointmentId: number,
  data: CancelAppointmentData
) {

  const result = await pool.query(
    `
    SELECT
      a.*,
      p.owner_id
    FROM appointments a
    JOIN pets p
      ON a.pet_id = p.pet_id
    WHERE
      a.appointment_id = $1
      AND p.owner_id = $2;
    `,
    [
      appointmentId,
      ownerId
    ]
  );

  if (result.rowCount === 0) {
    throw new AppError(
      "Appointment not found",
      404
    );
  }

  const appointment = result.rows[0];
  if (
  appointment.status === "completed"
) {
  throw new AppError(
    "Completed appointment cannot be cancelled",
    400
  );
}

if (
  appointment.status === "cancelled"
) {
  throw new AppError(
    "Appointment already cancelled",
    400
  );
}
const updateResult = await pool.query(
  `
  UPDATE appointments
  SET
    status = 'cancelled',
    cancel_reason = $1,
    updated_at = NOW()
  WHERE appointment_id = $2
  RETURNING *;
  `,
  [
    data.cancel_reason,
    appointmentId
  ]
);

return updateResult.rows[0];
}
}
export default new AppointmentService();