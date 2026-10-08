import pool from "../config/database.config";
import AppError from "../utils/AppError";

export type ShiftType = "morning" | "afternoon";

export interface CreateShiftData {
  doctor_id: number;
  dates: string[];
  shift_types: ShiftType[];
  start_time?: string;
  end_time?: string;
  room?: string | null;
  max_patients?: number;
  is_off?: boolean;
  note?: string | null;
}

export interface UpdateShiftData {
  start_time?: string;
  end_time?: string;
  room?: string | null;
  max_patients?: number;
  is_off?: boolean;
  note?: string | null;
}

export interface ShiftFilter {
  startDate: string;
  endDate: string;
  doctorId?: number;
}

const DEFAULT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  morning: { start: "08:00", end: "12:00" },
  afternoon: { start: "13:00", end: "17:00" },
};

const DEFAULT_ROOMS: Record<ShiftType, string> = {
  morning: "Phòng khám 101 - Khám tổng quát & Tiêm phòng",
  afternoon: "Phòng khám 103 - Da liễu, Siêu âm & Tiểu phẫu",
};

const SHIFT_SELECT = `
  SELECT
    s.shift_id,
    s.doctor_id,
    u.full_name AS doctor_name,
    to_char(s.shift_date, 'YYYY-MM-DD') AS shift_date,
    s.shift_type,
    to_char(s.start_time, 'HH24:MI') AS start_time,
    to_char(s.end_time, 'HH24:MI') AS end_time,
    s.room,
    s.max_patients,
    s.is_off,
    s.note
  FROM doctor_shifts s
  JOIN users u ON u.user_id = s.doctor_id
`;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Ngày + phút hiện tại theo múi giờ Việt Nam */
const getVietnamNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = Number(get("hour")) % 24;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + Number(get("minute")),
  };
};

const computeStatus = (
  date: string,
  start: string,
  end: string,
  isOff: boolean
): "scheduled" | "active" | "completed" | "off" => {
  if (isOff) return "off";
  const now = getVietnamNow();
  if (date < now.date) return "completed";
  if (date > now.date) return "scheduled";
  if (now.minutes < toMinutes(start)) return "scheduled";
  if (now.minutes <= toMinutes(end)) return "active";
  return "completed";
};

const assertTimeRange = (start: string, end: string) => {
  if (toMinutes(end) <= toMinutes(start)) {
    throw new AppError("Giờ kết thúc phải sau giờ bắt đầu", 400);
  }
};

class ShiftService {
  private async assertActiveDoctor(doctorId: number) {
    const result = await pool.query(
      `SELECT user_id FROM users
       WHERE user_id = $1 AND role = 'doctor' AND is_active = TRUE`,
      [doctorId]
    );
    if (result.rowCount === 0) {
      throw new AppError("Bác sĩ không tồn tại hoặc đã bị vô hiệu hóa", 404);
    }
  }

  /** Gắn lịch hẹn của bác sĩ vào từng ca (theo ngày + khung giờ) rồi tính trạng thái */
  private async attachAppointments(shifts: any[], filter: ShiftFilter) {
    if (shifts.length === 0) return [];

    const doctorIds = [...new Set(shifts.map((s) => s.doctor_id))];

    const apptResult = await pool.query(
      `
      SELECT
        a.appointment_id,
        a.doctor_id,
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
        u.full_name AS owner_name,
        u.phone AS owner_phone,
        s.name AS service_name
      FROM appointments a
      JOIN pets p ON p.pet_id = a.pet_id
      JOIN users u ON u.user_id = p.owner_id
      LEFT JOIN services s ON s.service_id = a.service_id
      WHERE a.doctor_id = ANY($1::int[])
        AND a.appointment_date BETWEEN $2 AND $3
        AND a.status <> 'cancelled'
      ORDER BY a.appointment_date, a.start_time
      `,
      [doctorIds, filter.startDate, filter.endDate]
    );

    return shifts.map((s) => {
      const shiftStart = toMinutes(s.start_time);
      const shiftEnd = toMinutes(s.end_time);

      const appointments = apptResult.rows
        .filter((a) => {
          if (a.doctor_id !== s.doctor_id || a.appointment_date !== s.shift_date) {
            return false;
          }
          const t = toMinutes(a.start_time);
          return t >= shiftStart && t < shiftEnd;
        })
        .map((a) => ({
          ...a,
          id: String(a.appointment_id),
        }));

      return {
        id: String(s.shift_id),
        shift_id: s.shift_id,
        doctor_id: s.doctor_id,
        doctor_name: s.doctor_name,
        date: s.shift_date,
        shift_type: s.shift_type,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room || DEFAULT_ROOMS[s.shift_type as ShiftType],
        status: computeStatus(s.shift_date, s.start_time, s.end_time, s.is_off),
        is_off: s.is_off,
        max_patients: s.is_off ? 0 : s.max_patients,
        appointments_count: appointments.length,
        appointments,
        note: s.note,
      };
    });
  }

  async getDoctorShifts(doctorId: number, filter: Omit<ShiftFilter, "doctorId">) {
    const result = await pool.query(
      `${SHIFT_SELECT}
       WHERE s.doctor_id = $1 AND s.shift_date BETWEEN $2 AND $3
       ORDER BY s.shift_date, s.start_time`,
      [doctorId, filter.startDate, filter.endDate]
    );
    return this.attachAppointments(result.rows, { ...filter, doctorId });
  }

  async listShifts(filter: ShiftFilter) {
    const values: any[] = [filter.startDate, filter.endDate];
    let where = "WHERE s.shift_date BETWEEN $1 AND $2";

    if (filter.doctorId) {
      values.push(filter.doctorId);
      where += ` AND s.doctor_id = $${values.length}`;
    }

    const result = await pool.query(
      `${SHIFT_SELECT} ${where}
       ORDER BY s.shift_date, s.start_time, u.full_name`,
      values
    );
    return this.attachAppointments(result.rows, filter);
  }

  async createShifts(adminId: number, data: CreateShiftData) {
    await this.assertActiveDoctor(data.doctor_id);

    const created: number[] = [];
    let skipped = 0;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const date of data.dates) {
        for (const type of data.shift_types) {
          const start = data.start_time ?? DEFAULT_TIMES[type].start;
          const end = data.end_time ?? DEFAULT_TIMES[type].end;
          assertTimeRange(start, end);

          const res = await client.query(
            `INSERT INTO doctor_shifts
               (doctor_id, shift_date, shift_type, start_time, end_time,
                room, max_patients, is_off, note, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (doctor_id, shift_date, shift_type) DO NOTHING
             RETURNING shift_id`,
            [
              data.doctor_id,
              date,
              type,
              start,
              end,
              data.room ?? DEFAULT_ROOMS[type],
              data.max_patients ?? 6,
              data.is_off ?? false,
              data.note ?? null,
              adminId,
            ]
          );

          if (res.rowCount && res.rowCount > 0) {
            created.push(res.rows[0].shift_id);
          } else {
            skipped++;
          }
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    if (created.length > 0) {
      const datesSummary =
        data.dates.length > 1
          ? `${data.dates[0]} đến ${data.dates[data.dates.length - 1]} (${created.length} ca)`
          : `${data.dates[0]} (${created.length} ca)`;

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, content, sent_at)
         VALUES ($1, 'system', $2, $3, NOW())`,
        [
          data.doctor_id,
          "Lịch làm việc mới",
          `Quản trị viên đã phân công ca trực mới cho bạn: ${datesSummary}. Vui lòng kiểm tra lịch làm việc.`,
        ]
      ).catch((err) => console.warn("[createShifts] Lỗi gửi thông báo:", err));
    }

    return { created_count: created.length, skipped_count: skipped, shift_ids: created };
  }

  async updateShift(shiftId: number, data: UpdateShiftData) {
    const existing = await pool.query(
      `SELECT to_char(start_time, 'HH24:MI') AS start_time,
              to_char(end_time, 'HH24:MI') AS end_time
       FROM doctor_shifts WHERE shift_id = $1`,
      [shiftId]
    );

    if (existing.rowCount === 0) {
      throw new AppError("Ca trực không tồn tại", 404);
    }

    assertTimeRange(
      data.start_time ?? existing.rows[0].start_time,
      data.end_time ?? existing.rows[0].end_time
    );

    await pool.query(
      `UPDATE doctor_shifts SET
         start_time = COALESCE($1, start_time),
         end_time = COALESCE($2, end_time),
         room = CASE WHEN $3::boolean THEN $4 ELSE room END,
         max_patients = COALESCE($5, max_patients),
         is_off = COALESCE($6, is_off),
         note = CASE WHEN $7::boolean THEN $8 ELSE note END
       WHERE shift_id = $9`,
      [
        data.start_time ?? null,
        data.end_time ?? null,
        data.room !== undefined,
        data.room ?? null,
        data.max_patients ?? null,
        data.is_off ?? null,
        data.note !== undefined,
        data.note ?? null,
        shiftId,
      ]
    );

    const result = await pool.query(`${SHIFT_SELECT} WHERE s.shift_id = $1`, [shiftId]);
    const row = result.rows[0];
    const [shift] = await this.attachAppointments(result.rows, {
      startDate: row.shift_date,
      endDate: row.shift_date,
    });

    // Thông báo cho bác sĩ về việc điều chỉnh ca trực
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, content, sent_at)
       VALUES ($1, 'system', $2, $3, NOW())`,
      [
        row.doctor_id,
        "Cập nhật ca trực",
        `Ca trực ngày ${row.shift_date} (${row.shift_type === "morning" ? "Ca sáng" : "Ca chiều"}) của bạn đã được cập nhật thông tin.`,
      ]
    ).catch((err) => console.warn("[updateShift] Lỗi gửi thông báo:", err));

    return shift;
  }

  async deleteShift(shiftId: number) {
    const existing = await pool.query(
      `SELECT doctor_id, to_char(shift_date, 'YYYY-MM-DD') AS shift_date, shift_type,
              to_char(start_time, 'HH24:MI') AS start_time,
              to_char(end_time, 'HH24:MI') AS end_time
       FROM doctor_shifts WHERE shift_id = $1`,
      [shiftId]
    );

    if (existing.rowCount === 0) {
      throw new AppError("Ca trực không tồn tại", 404);
    }

    const row = existing.rows[0];

    const apptCheck = await pool.query(
      `SELECT COUNT(*)::int AS count FROM appointments
       WHERE doctor_id = $1
         AND appointment_date = $2
         AND start_time >= $3::time
         AND start_time < $4::time
         AND status = 'confirmed'`,
      [row.doctor_id, row.shift_date, row.start_time, row.end_time]
    );

    if (apptCheck.rows[0].count > 0) {
      throw new AppError(
        `Không thể xóa ca trực vì đang có ${apptCheck.rows[0].count} lịch hẹn đã xác nhận. Vui lòng chuyển hoặc hủy lịch hẹn trước khi xóa ca trực.`,
        400
      );
    }

    await pool.query(
      `DELETE FROM doctor_shifts WHERE shift_id = $1`,
      [shiftId]
    );

    // Thông báo cho bác sĩ về việc hủy ca trực
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, content, sent_at)
       VALUES ($1, 'system', $2, $3, NOW())`,
      [
        row.doctor_id,
        "Hủy ca trực",
        `Ca trực ngày ${row.shift_date} (${row.shift_type === "morning" ? "Ca sáng" : "Ca chiều"}) của bạn đã bị hủy bởi quản trị viên.`,
      ]
    ).catch((err) => console.warn("[deleteShift] Lỗi gửi thông báo:", err));

    return { shift_id: shiftId };
  }
}

export default new ShiftService();
