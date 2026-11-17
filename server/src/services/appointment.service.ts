import pool from "../config/database.config";
import petService from "./pet.service";
import AppError from "../utils/AppError";
import {
  emitSlotUpdate,
  emitNotificationToRole,
  emitNotificationToUser,
  emitDashboardUpdate,
} from "../socket";

interface CreateAppointmentData {
  pet_id: number;
  service_id?: number | null;
  appointment_date: string;
  start_time: string;
  end_time?: string;
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
  date?: string;
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

    let duration = 30;
    let serviceId: number | null = null;

    if (data.service_id) {
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
          "Dịch vụ không tồn tại hoặc đã ngưng hoạt động",
          404
        );
      }
      const service = serviceResult.rows[0];
      duration = Number(service.duration_minutes) || 30;
      serviceId = Number(data.service_id);
    }

    const start = new Date(
      `1970-01-01T${data.start_time}`
    );

    start.setMinutes(
      start.getMinutes() + duration
    );
    const endTime = data.end_time || start.toTimeString().slice(0, 5);

    // Sử dụng transaction và advisory lock để loại bỏ hoàn toàn race condition khi đặt cùng lúc
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      // Khóa lock theo ngày đặt lịch trong phạm vi transaction (tự giải phóng khi commit hoặc rollback)
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1));", [
        `appointment_booking_${data.appointment_date}`,
      ]);

      // 1. Kiểm tra thú cưng có bị trùng hoặc chồng chéo khung giờ với ca hẹn khác không
      const petConflict = await client.query(
        `
        SELECT appointment_id, start_time, COALESCE(end_time, start_time + interval '30 minutes') AS end_time
        FROM appointments
        WHERE
            pet_id = $1
            AND appointment_date = $2
            AND status <> 'cancelled'
            AND (
              start_time < $4::time
              AND COALESCE(end_time, start_time + interval '30 minutes') > $3::time
            );
        `,
        [
          data.pet_id,
          data.appointment_date,
          data.start_time,
          endTime,
        ]
      );

      if (petConflict.rowCount && petConflict.rowCount > 0) {
        const conflict = petConflict.rows[0];
        const confStart = String(conflict.start_time).slice(0, 5);
        const confEnd = String(conflict.end_time).slice(0, 5);
        throw new AppError(
          `Thú cưng đã có lịch hẹn vào khung giờ giao thoa (${confStart} - ${confEnd}). Vui lòng chọn giờ khác!`,
          409
        );
      }

      // 2. Xác định năng lực phòng khám (capacity) trong khung giờ này
      // Ưu tiên đếm số bác sĩ có ca trực đang hoạt động và bao phủ khung giờ này
      const shiftCapacityRes = await client.query(
        `
        SELECT COUNT(DISTINCT ds.doctor_id)::int AS count
        FROM doctor_shifts ds
        JOIN users u ON ds.doctor_id = u.user_id
        WHERE ds.shift_date = $1
          AND ds.is_off = false
          AND u.is_active = true
          AND u.is_deleted = false
          AND ds.start_time <= $2::time
          AND ds.end_time >= $3::time;
        `,
        [data.appointment_date, data.start_time, endTime]
      );

      let clinicCapacity = Number(shiftCapacityRes.rows[0]?.count) || 0;

      // Nếu ngày này chưa lên lịch ca trực cụ thể, dùng số lượng bác sĩ active trong hệ thống
      if (clinicCapacity === 0) {
        const doctorResult = await client.query(
          `
          SELECT COUNT(*)::int AS count
          FROM users
          WHERE role = 'doctor'
            AND is_active = true
            AND is_deleted = false;
          `
        );
        clinicCapacity = Math.max(1, Number(doctorResult.rows[0]?.count) || 1);
      }

      // 3. Đếm số ca khám hiện tại của phòng khám bị chồng chéo thời gian
      const bookedOverlapRes = await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM appointments
        WHERE appointment_date = $1
          AND status <> 'cancelled'
          AND (
            start_time < $3::time
            AND COALESCE(end_time, start_time + interval '30 minutes') > $2::time
          );
        `,
        [data.appointment_date, data.start_time, endTime]
      );

      const bookedCount = Number(bookedOverlapRes.rows[0]?.count) || 0;
      if (bookedCount >= clinicCapacity) {
        throw new AppError(
          `Khung giờ ${data.start_time} - ${endTime} ngày ${data.appointment_date} đã kín lịch nhận khám (${bookedCount}/${clinicCapacity} ca). Vui lòng chọn khung giờ khác!`,
          409
        );
      }

      // 4. Tạo lịch hẹn mới
      const result = await client.query(
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
          serviceId,
          data.appointment_date,
          data.start_time,
          endTime,
          data.reason ?? null,
          data.notes ?? null,
        ]
      );

      await client.query("COMMIT;");

      const newAppointment = result.rows[0];

      // Gửi realtime cập nhật slot cho các client đang xem ngày này
      emitSlotUpdate(data.appointment_date, {
        time: data.start_time,
        action: "booked",
      });

      // Báo cho Admin biết có lịch hẹn mới
      emitNotificationToRole("admin", {
        type: "appointment",
        title: "Lịch hẹn mới",
        content: `Có lịch hẹn khám mới lúc ${data.start_time} ngày ${data.appointment_date}.`,
        appointment_id: newAppointment.appointment_id,
      });

      // Cập nhật số liệu dashboard admin
      emitDashboardUpdate("admin", { reason: "new_appointment" });

      return newAppointment;
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  }

  async getAppointmentsByOwner(
    ownerId: number,
    filter: AppointmentFilter
  ) {

    let query = `
      SELECT
        a.*,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.weight_kg AS pet_weight,
        s.name AS service_name,
        s.description AS service_description,
        s.price AS service_price,
        s.duration_minutes AS service_duration,
        u.full_name AS doctor_name,
        u.phone AS doctor_phone,
        mr.record_id AS medical_record_id,
        inv.invoice_id AS invoice_id
      FROM appointments a
      JOIN pets p
        ON a.pet_id = p.pet_id
      LEFT JOIN services s
        ON a.service_id = s.service_id
      LEFT JOIN users u
        ON a.doctor_id = u.user_id
      LEFT JOIN medical_records mr
        ON mr.appointment_id = a.appointment_id
      LEFT JOIN invoices inv
        ON inv.appointment_id = a.appointment_id
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
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.weight_kg AS pet_weight,
        s.name AS service_name,
        s.description AS service_description,
        s.price AS service_price,
        s.duration_minutes AS service_duration,
        u.full_name AS doctor_name,
        u.phone AS doctor_phone,
        mr.record_id AS medical_record_id,
        inv.invoice_id AS invoice_id
      FROM appointments a
      JOIN pets p
        ON a.pet_id = p.pet_id
      LEFT JOIN services s
        ON a.service_id = s.service_id
      LEFT JOIN users u
        ON a.doctor_id = u.user_id
      LEFT JOIN medical_records mr
        ON mr.appointment_id = a.appointment_id
      LEFT JOIN invoices inv
        ON inv.appointment_id = a.appointment_id
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

  const cancelledAppointment = updateResult.rows[0];

  // Gửi realtime cập nhật slot trống lại cho ngày này
  if (appointment.appointment_date) {
    const appDateStr =
      typeof appointment.appointment_date === "string"
        ? appointment.appointment_date.split("T")[0]
        : new Date(appointment.appointment_date).toISOString().split("T")[0];
    emitSlotUpdate(appDateStr, {
      time: appointment.start_time,
      action: "cancelled",
    });
  }

  // Nếu có bác sĩ được gán, báo cho bác sĩ biết ca hẹn đã bị hủy
  if (appointment.doctor_id) {
    emitNotificationToUser(appointment.doctor_id, {
      type: "appointment",
      title: "Lịch hẹn đã bị hủy",
      content: `Lịch hẹn khám lúc ${appointment.start_time} ngày ${appointment.appointment_date} đã bị hủy bởi chủ nuôi.`,
      appointment_id: appointmentId,
    });
    emitDashboardUpdate(appointment.doctor_id, { reason: "appointment_cancelled" });
  }

  emitDashboardUpdate("admin", { reason: "appointment_cancelled" });

  return cancelledAppointment;
}

  async getAvailableSlots(
    ownerId: number,
    query: AvailableSlotQuery
  ) {
    // 1. Kiểm tra pet thuộc quyền sở hữu của owner
    await petService.getPetById(
      query.pet_id,
      ownerId
    );

    // 2. Danh sách các slot tiêu chuẩn của phòng khám
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
      "16:30",
    ];

    // 3. Lấy tất cả ca hẹn trong ngày (không tính đã hủy) kèm khoảng thời gian
    const bookedAppointmentsRes = await pool.query(
      `
      SELECT
        start_time,
        COALESCE(end_time, start_time + interval '30 minutes') AS end_time,
        pet_id
      FROM appointments
      WHERE
        appointment_date = $1
        AND status <> 'cancelled';
      `,
      [query.date]
    );

    const bookedAppointments = bookedAppointmentsRes.rows;

    // 4. Lấy ca trực của bác sĩ trong ngày (nếu có cấu hình)
    const shiftsRes = await pool.query(
      `
      SELECT ds.doctor_id, ds.start_time, ds.end_time
      FROM doctor_shifts ds
      JOIN users u ON ds.doctor_id = u.user_id
      WHERE ds.shift_date = $1
        AND ds.is_off = false
        AND u.is_active = true
        AND u.is_deleted = false;
      `,
      [query.date]
    );

    // Fallback nếu không có ca trực: đếm tổng bác sĩ đang hoạt động
    const fallbackDoctorsRes = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE role = 'doctor'
        AND is_active = true
        AND is_deleted = false;
      `
    );
    const fallbackCapacity = Math.max(1, Number(fallbackDoctorsRes.rows[0]?.count) || 1);

    // 5. Tính toán slot khả dụng
    return allSlots.map((slot) => {
      // Mỗi slot mặc định 30 phút
      const [h, m] = slot.split(":").map(Number);
      const slotStartMin = h * 60 + m;
      const slotEndMin = slotStartMin + 30;

      // Tính capacity cho slot này
      let slotCapacity = 0;
      if (shiftsRes.rows.length > 0) {
        // Đếm số bác sĩ có ca trực bao phủ slot này
        const matchingShifts = shiftsRes.rows.filter((shift) => {
          const [shH, shM] = String(shift.start_time).split(":").map(Number);
          const [ehH, ehM] = String(shift.end_time).split(":").map(Number);
          const shiftStartMin = shH * 60 + shM;
          const shiftEndMin = ehH * 60 + ehM;
          return shiftStartMin <= slotStartMin && shiftEndMin >= slotEndMin;
        });
        slotCapacity = matchingShifts.length;
      }
      if (slotCapacity === 0) {
        slotCapacity = fallbackCapacity;
      }

      // Đếm số ca khám giao thoa với slot này [slotStartMin, slotEndMin)
      let bookedCount = 0;
      let isPetAlreadyBooked = false;

      for (const app of bookedAppointments) {
        const [aStartH, aStartM] = String(app.start_time).split(":").map(Number);
        const [aEndH, aEndM] = String(app.end_time).split(":").map(Number);
        const appStartMin = aStartH * 60 + aStartM;
        const appEndMin = aEndH * 60 + aEndM;

        // Hai khoảng thời gian giao nhau khi: appStart < slotEnd && appEnd > slotStart
        const isOverlap = appStartMin < slotEndMin && appEndMin > slotStartMin;
        if (isOverlap) {
          bookedCount++;
          if (app.pet_id === query.pet_id) {
            isPetAlreadyBooked = true;
          }
        }
      }

      const isCapacityFull = bookedCount >= slotCapacity;
      const isAvailable = !isPetAlreadyBooked && !isCapacityFull;

      return {
        time: slot,
        available: isAvailable,
        booked: bookedCount,
        capacity: slotCapacity,
        remaining: Math.max(0, slotCapacity - bookedCount),
      };
    });
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
      to_char(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      to_char(a.start_time, 'HH24:MI') AS start_time,
      to_char(a.end_time, 'HH24:MI') AS end_time,
      a.status,
      a.reason,
      a.notes,
      a.created_at,
      a.updated_at,

      p.pet_id,
      p.name AS pet_name,
      p.species AS pet_species,
      p.breed AS pet_breed,

      u.user_id AS owner_id,
      u.full_name AS owner_name,
      u.phone AS owner_phone,

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
    if (filter.date) {
      values.push(filter.date);
      query += ` AND a.appointment_date = $${values.length}`;
    } else {
      query += ` AND a.appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`;
    }
  }

  if (filter.tab === "upcoming") {
    query += `
      AND a.appointment_date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
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
      a.appointment_id,
      to_char(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      to_char(a.start_time, 'HH24:MI') AS start_time,
      to_char(a.end_time, 'HH24:MI') AS end_time,
      a.status,
      a.reason,
      a.notes,
      a.created_at,
      a.updated_at,

      p.pet_id,
      p.name AS pet_name,
      p.species AS pet_species,
      p.breed AS pet_breed,
      p.weight_kg AS pet_weight,

      u.user_id AS owner_id,
      u.full_name AS owner_name,
      u.phone AS owner_phone,

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

  const appointmentDateTime = new Date(
    `${appointment.appointment_date}T${appointment.start_time}`
  );

  // Thời gian hiện tại
  const now = new Date();

  // Chỉ được tạo Medical Record khi lịch hẹn đã đến hoặc đã qua
  appointment.canCreateMedicalRecord =
    appointment.status === "confirmed" &&
    appointmentDateTime <= now;

  return appointment;
}

async getDoctorDashboard(
  doctorId: number
): Promise<DoctorDashboard> {

  // Hôm nay: Đếm các ca hẹn đang hoạt động (không tính ca đã hủy để khớp với ca trực và KPI "Cần khám hôm nay")
  const today = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE
      doctor_id = $1
      AND appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      AND status <> 'cancelled';
    `,
    [doctorId]
  );

  const upcoming = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE
      doctor_id = $1
      AND appointment_date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
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

  // Bệnh nhân từng khám: Đếm số lượng pet distinct có medical_record HOẶC có lịch hẹn đã hoàn thành của bác sĩ này
  // (Đồng bộ chuẩn 100% với định nghĩa bệnh nhân trong listPatientsByDoctor)
  const patients = await pool.query(
    `
    SELECT COUNT(DISTINCT pet_id) AS total
    FROM (
      SELECT pet_id FROM medical_records WHERE doctor_id = $1
      UNION
      SELECT pet_id FROM appointments WHERE doctor_id = $1 AND status = 'completed'
    ) p;
    `,
    [doctorId]
  );

  const todayList = await pool.query(
    `
    SELECT
      a.appointment_id,
      to_char(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      to_char(a.start_time, 'HH24:MI') AS start_time,
      to_char(a.end_time, 'HH24:MI') AS end_time,
      a.status,
      a.reason,
      a.notes,

      p.pet_id,
      p.name AS pet_name,
      p.species AS pet_species,
      p.breed AS pet_breed,

      u.user_id AS owner_id,
      u.full_name AS owner_name,
      u.phone AS owner_phone,

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
      AND a.appointment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date

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