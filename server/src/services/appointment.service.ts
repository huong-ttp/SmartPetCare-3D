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

interface AvailableSlotQuery {
  pet_id: number;
  date: string;
}

interface AppointmentFilter {
  status?: string;
  from?: string;
  to?: string;
}

interface DoctorAppointmentFilter {
  tab?: "today" | "upcoming" | "completed";
}

interface DoctorDashboard {
  overview: {
    todayAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    patients: number;
  };

  todayAppointments: any[];
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
WHERE
    pet_id = $1
    AND appointment_date = $2
    AND start_time = $3
    AND status <> 'cancelled';
`,
[
  data.pet_id,
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
  ownerId: number,
  filter: AppointmentFilter
) {

  let query = `
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
  `;

  const values: any[] = [ownerId];
  let index = 2;

  if (filter.status) {
    query += ` AND a.status = $${index}`;
    values.push(filter.status);
    index++;
  }

  if (filter.from) {
    query += ` AND a.appointment_date >= $${index}`;
    values.push(filter.from);
    index++;
  }

  if (filter.to) {
    query += ` AND a.appointment_date <= $${index}`;
    values.push(filter.to);
    index++;
  }

  query += `
    ORDER BY
      a.appointment_date DESC,
      a.start_time DESC;
  `;

  const result = await pool.query(query, values);

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

async getAvailableSlots(
  ownerId: number,
  query: AvailableSlotQuery
) {

  // Kiểm tra pet thuộc owner
  await petService.getPetById(
    query.pet_id,
    ownerId
  );

  // Lấy các slot đã đặt của pet trong ngày
  const booked = await pool.query(
    `
    SELECT start_time
    FROM appointments
    WHERE
      pet_id = $1
      AND appointment_date = $2
      AND status <> 'cancelled';
    `,
    [
      query.pet_id,
      query.date
    ]
  );

  const bookedTimes = booked.rows.map(
    row => row.start_time.slice(0, 5)
  );

  const allSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30"
  ];

  return allSlots.map(slot => ({
    time: slot,
    available: !bookedTimes.includes(slot)
  }));
}

async getDoctorAppointments(
  doctorId: number,
  filter: DoctorAppointmentFilter
) {
  if (!filter.tab) {
    filter.tab = "today";
  }

  let query = `
    SELECT
      a.appointment_id,
      a.appointment_date,
      a.start_time,
      a.end_time,
      a.status,
      a.reason,
      a.notes,

      p.pet_id,
      p.name AS pet_name,

      u.full_name AS owner_name,

      s.service_id,
      s.name AS service_name

    FROM appointments a

    JOIN pets p
      ON a.pet_id = p.pet_id

    JOIN users u
      ON p.owner_id = u.user_id

    JOIN services s
      ON a.service_id = s.service_id

    WHERE
      a.doctor_id = $1
  `;

  const values: any[] = [doctorId];

  if (filter.tab === "today") {

    query += `
      AND a.appointment_date = CURRENT_DATE
    `;

  }

  if (filter.tab === "upcoming") {

    query += `
      AND a.appointment_date > CURRENT_DATE
      AND a.status = 'confirmed'
    `;

  }

  if (filter.tab === "completed") {

    query += `
      AND a.status = 'completed'
    `;

  }

  query += `
    ORDER BY
      a.appointment_date,
      a.start_time;
  `;

  const result = await pool.query(
    query,
    values
  );

  return result.rows;
}

async getDoctorAppointmentById(
  doctorId: number,
  appointmentId: number
) {

  const result = await pool.query(
    `
    SELECT
      a.*,

      p.pet_id,
      p.name AS pet_name,
      p.species,
      p.breed,

      u.user_id AS owner_id,
      u.full_name AS owner_name,

      s.service_id,
      s.name AS service_name,
      s.price

    FROM appointments a

    JOIN pets p
      ON a.pet_id = p.pet_id

    JOIN users u
      ON p.owner_id = u.user_id

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

  if (result.rowCount === 0) {
  throw new AppError(
    "Appointment not found",
    404
  );
}

const appointment = result.rows[0];

// Ghép ngày + giờ hẹn
const appointmentDate = new Date(
  appointment.appointment_date
);

const dateString =
  appointmentDate
    .toISOString()
    .split("T")[0];

const appointmentDateTime = new Date(
  `${appointment.appointment_date}T${appointment.start_time}`
);

if (appointmentDateTime > new Date()) {
  throw new AppError(
    "Appointment has not started yet",
    400
  );
}

// Thời gian hiện tại
const now = new Date();

// Chỉ được tạo Medical Record
// khi lịch hẹn đã đến hoặc đã qua
appointment.canCreateMedicalRecord =
  appointment.status === "confirmed" &&
  appointmentDateTime <= now;

return appointment;
}
async getDoctorDashboard(
  doctorId: number
): Promise<DoctorDashboard> {

  const today = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE
      doctor_id = $1
      AND appointment_date = CURRENT_DATE;
    `,
    [doctorId]
  );

  const upcoming = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE
      doctor_id = $1
      AND appointment_date > CURRENT_DATE
      AND status = 'confirmed';
    `,
    [doctorId]
  );

  const completed = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE
      doctor_id = $1
      AND status = 'completed';
    `,
    [doctorId]
  );

  const patients = await pool.query(
    `
    SELECT COUNT(DISTINCT pet_id) AS total
    FROM medical_records
    WHERE doctor_id = $1;
    `,
    [doctorId]
  );

  const todayList = await pool.query(
    `
    SELECT
      a.appointment_id,
      a.start_time,
      a.status,

      p.pet_id,
      p.name AS pet_name,

      u.full_name AS owner_name,

      s.name AS service_name

    FROM appointments a

    JOIN pets p
      ON a.pet_id = p.pet_id

    JOIN users u
      ON p.owner_id = u.user_id

    JOIN services s
      ON a.service_id = s.service_id

    WHERE
      a.doctor_id = $1
      AND a.appointment_date = CURRENT_DATE

    ORDER BY a.start_time;
    `,
    [doctorId]
  );

  return {
    overview: {
      todayAppointments: Number(today.rows[0].total),
      upcomingAppointments: Number(upcoming.rows[0].total),
      completedAppointments: Number(completed.rows[0].total),
      patients: Number(patients.rows[0].total),
    },

    todayAppointments: todayList.rows,
  };
}
}




export default new AppointmentService();