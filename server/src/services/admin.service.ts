import pool from "../config/database.config";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError";

interface UserFilter {
  search?: string;
  role?: string;
  status?: string;

  page?: number;
  limit?: number;
}

interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: "doctor" | "admin";
}

interface UpdateRoleData {
  role: "owner" | "doctor" | "admin";
}

interface PetFilter {
    search?: string;
    species?: string;
    page?: number;
    limit?: number;

}

interface UpdatePetData {
  name: string;
  species: string;
  breed: string;
  gender: string;
  date_of_birth: string;
  color?: string;
  microchip_id?: string;
  avatar_url?: string;
  allergies?: string;
  chronic_conditions?: string;
  special_notes?: string;
}

interface AppointmentFilter {
  search?: string;
  status?: string;
  unassigned?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;

}

interface MedicalRecordFilter {
  search?: string;
  doctorId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface VaccinationFilter {
  search?: string;
  vaccineType?: number;
  dueStatus?: "upcoming" | "overdue" | "valid";
  page?: number;
  limit?: number;

}
class AdminService {

  async getDashboard() {
    const totalUsersResult = await pool.query(
  `
  SELECT COUNT(*) AS total
  FROM users;
  `
);
const totalPetsResult = await pool.query(
  `
  SELECT COUNT(*) AS total
  FROM pets;
  `
);
const todayAppointmentsResult = await pool.query(
  `
  SELECT COUNT(*) AS total
  FROM appointments
  WHERE appointment_date = CURRENT_DATE;
  `
);
const completedAppointmentsResult = await pool.query(
  `
  SELECT COUNT(*) AS total
  FROM appointments
  WHERE
    status = 'completed'
    AND DATE_TRUNC(
      'month',
      appointment_date
    )
    =
    DATE_TRUNC(
      'month',
      CURRENT_DATE
    );
  `
);
const unpaidInvoicesResult = await pool.query(
  `
  SELECT COUNT(*) AS total
  FROM invoices
  WHERE status = 'unpaid';
  `
);
const totalRevenueResult = await pool.query(
  `
  SELECT
    COALESCE(
      SUM(total_amount),
      0
    ) AS total
  FROM invoices
  WHERE status = 'paid';
  `
);
const monthlyRevenueResult = await pool.query(
  `
  SELECT
    COALESCE(
      SUM(total_amount),
      0
    ) AS total
  FROM invoices
  WHERE
    status = 'paid'
    AND DATE_TRUNC(
      'month',
      issued_date
    )
    =
    DATE_TRUNC(
      'month',
      CURRENT_DATE
    );
  `
);
const vaccinesDueResult = await pool.query(
  `
  SELECT COUNT(*) AS total
  FROM pet_vaccinations
  WHERE
    next_due_date
    <= CURRENT_DATE + INTERVAL '7 day';
  `
);
const appointmentStatisticsResult =
  await pool.query(
    `
    SELECT
      status,
      COUNT(*) AS total
    FROM appointments
    GROUP BY status;
    `
  );
  const revenueStatisticsResult =
  await pool.query(
    `
    SELECT

      TO_CHAR(
        issued_date,
        'YYYY-MM'
      ) AS month,

      SUM(total_amount) AS revenue

    FROM invoices

    WHERE status='paid'

    GROUP BY month

    ORDER BY month;
    `
  );
  const userStatisticsResult =
  await pool.query(
    `
    SELECT

      TO_CHAR(
        created_at,
        'YYYY-MM'
      ) AS month,

      COUNT(*) AS total

    FROM users

    GROUP BY month

    ORDER BY month;
    `
  );
  const vaccinationStatisticsResult =
  await pool.query(
    `
    SELECT

      vt.name,

      COUNT(*) AS total

    FROM pet_vaccinations pv

    INNER JOIN vaccine_types vt

      ON
      pv.vaccine_type_id
      =
      vt.vaccine_type_id

    GROUP BY
      vt.name

    ORDER BY total DESC;
    `
  );
  return {

  overview: {

    totalUsers:
      Number(
        totalUsersResult.rows[0].total
      ),

    totalPets:
      Number(
        totalPetsResult.rows[0].total
      ),

    todayAppointments:
      Number(
        todayAppointmentsResult.rows[0].total
      ),

    completedAppointments:
      Number(
        completedAppointmentsResult.rows[0].total
      ),

    unpaidInvoices:
      Number(
        unpaidInvoicesResult.rows[0].total
      ),

    revenue: {

      total:
        Number(
          totalRevenueResult.rows[0].total
        ),

      month:
        Number(
          monthlyRevenueResult.rows[0].total
        )

    },

    vaccinesDue:
      Number(
        vaccinesDueResult.rows[0].total
      )

  },

  appointmentStatistics:
    appointmentStatisticsResult.rows,

  revenueStatistics:
    revenueStatisticsResult.rows,

  userStatistics:
    userStatisticsResult.rows,

  vaccinationStatistics:
    vaccinationStatisticsResult.rows

};

  }

  async listUsers(
  filter: UserFilter
) 
{
  
const page = filter.page || 1;
const limit = filter.limit || 10;

const offset = (page - 1) * limit;
  

  let query = `
    SELECT
      user_id,
      full_name,
      email,
      phone,
      address,
      role,
      is_active,
      created_at,
      updated_at,
      role_updated_by,
      role_updated_at     
    FROM users
    WHERE 1 = 1
  `;

  let countQuery = `
SELECT COUNT(*) AS total
FROM users
WHERE 1 = 1
`;

  const values: any[] = [];
  let index = 1;

  if (filter.search) {

  const condition = `
    AND (
      LOWER(full_name)
      LIKE LOWER($${index})
      OR
      LOWER(email)
      LIKE LOWER($${index})
    )
  `;

  query += condition;
  countQuery += condition;

  values.push(`%${filter.search}%`);

  index++;
}
if (page < 1) {
  throw new AppError(
    "Page must be greater than 0",
    400
  );
}

if (limit < 1 || limit > 100) {
  throw new AppError(
    "Limit must be between 1 and 100",
    400
  );
}

// Thêm đoạn này
if (
  filter.role &&
  !["owner", "doctor", "admin"].includes(filter.role)
) {
  throw new AppError(
    "Invalid role filter",
    400
  );
}

if (filter.role) {

    const condition = `
        AND role = $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.role);

    index++;
}
if (
    filter.status &&
    filter.status !== "active" &&
    filter.status !== "inactive"
) {
    throw new AppError(
        "Invalid status",
        400
    );
}

  if (filter.status !== undefined) {

    const condition = `
        AND is_active = $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(
        filter.status === "active"
    );
    

    index++;
}

  query += `
ORDER BY created_at DESC
LIMIT $${index}
OFFSET $${index + 1};
`;

values.push(limit);
values.push(offset);

  const result =
await pool.query(
    query,
    values
);

const countResult =
await pool.query(
    countQuery,
    values.slice(0, values.length - 2)
);

  const total =
Number(countResult.rows[0].total);

return {

    items: result.rows,

    pagination: {

        page,

        limit,

        total,

        totalPages: Math.ceil(total / limit)

    }

};

}

async listPets(
  filter: PetFilter
) {

  const page = filter.page || 1;
  const limit = filter.limit || 10;
  const offset = (page - 1) * limit;

  if (page < 1) {
    throw new AppError(
      "Page must be greater than 0",
      400
    );
  }

  if (limit < 1 || limit > 100) {
    throw new AppError(
      "Limit must be between 1 and 100",
      400
    );
  }

  let query = `
    SELECT
      p.pet_id,
      p.name,
      u.full_name AS owner_name,
      p.species,
      p.breed,
      p.gender,
      p.weight_kg
    FROM pets p
    INNER JOIN users u
      ON p.owner_id = u.user_id
    WHERE 1 = 1
  `;

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM pets p
    INNER JOIN users u
      ON p.owner_id = u.user_id
    WHERE 1 = 1
  `;

  const values: any[] = [];
  let index = 1;

    if (filter.search) {

    const condition = `
      AND (
        LOWER(p.name)
        LIKE LOWER($${index})

        OR

        LOWER(u.full_name)
        LIKE LOWER($${index})
      )
    `;

    query += condition;
    countQuery += condition;

    values.push(`%${filter.search}%`);

    index++;

  }
    if (filter.species) {

    const condition = `
      AND p.species = $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.species);

    index++;

  }
    query += `
    ORDER BY p.created_at DESC
    LIMIT $${index}
    OFFSET $${index + 1};
  `;

  values.push(limit);
  values.push(offset);
    const result =
    await pool.query(
      query,
      values
    );

  const countResult =
    await pool.query(
      countQuery,
      values.slice(0, values.length - 2)
    );

  const total =
    Number(countResult.rows[0].total);

  return {

    items: result.rows,

    pagination: {

      page,

      limit,

      total,

      totalPages:
        Math.ceil(total / limit)

    }

  };

}

async getPetById(
  petId: number
) {

  const result = await pool.query(
    `
    SELECT
      p.pet_id,
      p.owner_id,
      u.full_name AS owner_name,

      p.name,
      p.species,
      p.breed,
      p.gender,
      p.date_of_birth,
      p.weight_kg,
      p.color,
      p.microchip_id,
      p.avatar_url,

      p.allergies,
      p.chronic_conditions,
      p.special_notes,

      p.created_at,
      p.updated_at

    FROM pets p

    INNER JOIN users u
      ON p.owner_id = u.user_id

    WHERE p.pet_id = $1;
    `,
    [petId]
  );

  if (result.rowCount === 0) {
    throw new AppError(
      "Pet not found",
      404
    );
  }

  return result.rows[0];

}

async createUser(
  data: CreateUserData
) {
  data.full_name = data.full_name.trim();
  data.email = data.email.trim().toLowerCase();
  
  if (!data.full_name?.trim()) {
  throw new AppError(
    "Full name is required",
    400
  );
}

if (!data.email?.trim()) {
  throw new AppError(
    "Email is required",
    400
  );
}

const emailRegex =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(data.email)) {
  throw new AppError(
    "Invalid email format",
    400
  );
}

if (!data.password || data.password.length < 6) {
  throw new AppError(
    "Password must be at least 6 characters",
    400
  );
}

  // Chỉ cho tạo doctor hoặc admin
  if (
    
    data.role !== "doctor" &&
    data.role !== "admin"
  ) {
    throw new AppError(
      "Only doctor or admin account can be created",
      400
    );
  }

  // Email đã tồn tại?
  const existed = await pool.query(
    `
    SELECT user_id
    FROM users
    WHERE email = $1;
    `,
    [data.email]
  );

  if (existed.rowCount! > 0) {
    throw new AppError(
      "Email already exists",
      409
    );
  }

  const passwordHash =
    await bcrypt.hash(
      data.password,
      10
    );

  const result = await pool.query(
    `
    INSERT INTO users
    (
      full_name,
      email,
      password_hash,
      phone,
      address,
      role,
      is_active
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      true
    )
    RETURNING
      user_id,
      full_name,
      email,
      phone,
      address,
      role,
      is_active,
      created_at;
    `,
    [
      data.full_name,
      data.email,
      passwordHash,
      data.phone ?? null,
      data.address ?? null,
      data.role
    ]
  );

  return result.rows[0];
}

async updateUserRole(
  adminId: number,
  userId: number,
  data: UpdateRoleData
) {
  const validRoles = [
  "owner",
  "doctor",
  "admin"
];

if (!validRoles.includes(data.role)) {
  throw new AppError(
    "Invalid role",
    400
  );
}

  // Không được đổi role của chính mình
  if (adminId === userId) {
    throw new AppError(
      "You cannot change your own role",
      400
    );
  }

  const existed = await pool.query(
    `
    SELECT user_id
    FROM users
    WHERE user_id = $1;
    `,
    [userId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "User not found",
      404
    );
  }

  const result = await pool.query(
    `
    UPDATE users
    SET
      role = $1,
      role_updated_by = $2,
      role_updated_at = NOW(),
      updated_at = NOW()
    WHERE user_id = $3
    RETURNING
      user_id,
      full_name,
      email,
      role,
      role_updated_by,
      role_updated_at,
      updated_at;
    `,
    [
      data.role,
      adminId,
      userId
    ]
  );

  return result.rows[0];
}

async toggleUserActive(
  adminId: number,
  userId: number
) {

  if (adminId === userId) {
    throw new AppError(
      "You cannot deactivate your own account",
      400
    );
  }

  const existed = await pool.query(
    `
    SELECT
      user_id,
      is_active
    FROM users
    WHERE user_id = $1;
    `,
    [userId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "User not found",
      404
    );
  }

  const current =
    existed.rows[0];

  const result = await pool.query(
    `
    UPDATE users
    SET
      is_active = $1,
      updated_at = NOW()
    WHERE user_id = $2
    RETURNING
      user_id,
      full_name,
      email,
      role,
      is_active,
      updated_at;
    `,
    [
      !current.is_active,
      userId
    ]
  );

  return result.rows[0];
}

async updateUser(
  userId: number,
  data: { full_name?: string; phone?: string | null; address?: string | null }
) {
  const existed = await pool.query(
    `SELECT user_id, full_name, phone, address FROM users WHERE user_id = $1;`,
    [userId]
  );

  if (existed.rowCount === 0) {
    throw new AppError("User not found", 404);
  }

  const current = existed.rows[0];
  const fullName = data.full_name !== undefined ? data.full_name.trim() : current.full_name;
  const phone = data.phone !== undefined ? data.phone : current.phone;
  const address = data.address !== undefined ? data.address : current.address;

  const result = await pool.query(
    `
    UPDATE users
    SET
      full_name = $1,
      phone = $2,
      address = $3,
      updated_at = NOW()
    WHERE user_id = $4
    RETURNING
      user_id,
      full_name,
      email,
      phone,
      address,
      role,
      is_active,
      created_at,
      updated_at,
      role_updated_by,
      role_updated_at;
    `,
    [fullName, phone, address, userId]
  );

  return result.rows[0];
}

async updatePet(
  petId: number,
  data: UpdatePetData
) {

  const existed = await pool.query(
    `
    SELECT pet_id
    FROM pets
    WHERE pet_id = $1;
    `,
    [petId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Pet not found",
      404
    );
  }

  const result = await pool.query(
    `
    UPDATE pets
    SET
      name = $1,
      species = $2,
      breed = $3,
      gender = $4,
      date_of_birth = $5,
      color = $6,
      microchip_id = $7,
      avatar_url = $8,
      allergies = $9,
      chronic_conditions = $10,
      special_notes = $11,
      updated_at = NOW()

    WHERE pet_id = $12

    RETURNING *;
    `,
    [
      data.name,
      data.species,
      data.breed,
      data.gender,
      data.date_of_birth,
      data.color ?? null,
      data.microchip_id ?? null,
      data.avatar_url ?? null,
      data.allergies ?? null,
      data.chronic_conditions ?? null,
      data.special_notes ?? null,
      petId
    ]
  );

  return result.rows[0];

}

async deletePet(
  petId: number
) {

  // Kiểm tra pet tồn tại
  const existed = await pool.query(
    `
    SELECT pet_id
    FROM pets
    WHERE pet_id = $1;
    `,
    [petId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Pet not found",
      404
    );
  }

  // Kiểm tra Appointment liên quan
  const appointmentResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE pet_id = $1;
    `,
    [petId]
  );

  // Kiểm tra Medical Record liên quan
  const medicalResult = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM medical_records
    WHERE pet_id = $1;
    `,
    [petId]
  );

  const appointmentCount =
    Number(appointmentResult.rows[0].total);

  const medicalCount =
    Number(medicalResult.rows[0].total);

  // Nếu còn dữ liệu liên quan thì không cho xóa
  if (
    appointmentCount > 0 ||
    medicalCount > 0
  ) {
    throw new AppError(
      "Cannot delete pet because related appointments or medical records exist.",
      409
    );
  }

  await pool.query(
    `
    DELETE FROM pets
    WHERE pet_id = $1;
    `,
    [petId]
  );

  return {
    message: "Pet deleted successfully"
  };

}

async listAppointments(
  filter: AppointmentFilter
) {

  const page = filter.page || 1;
  const limit = filter.limit || 10;
  const offset = (page - 1) * limit;

  if (page < 1) {
    throw new AppError(
      "Page must be greater than 0",
      400
    );
  }

  if (limit < 1 || limit > 100) {
    throw new AppError(
      "Limit must be between 1 and 100",
      400
    );
  }

  let query = `
    SELECT

    a.appointment_id,

    p.pet_id,

    p.name AS pet_name,

    u.user_id AS owner_id,

    u.full_name AS owner_name,

    s.service_id,

    s.name AS service_name,

    a.appointment_date,

    a.start_time,

    a.end_time,

    a.reason,

    a.status,

    a.doctor_id,

    d.full_name AS doctor_name

    FROM appointments a

    INNER JOIN pets p
      ON a.pet_id = p.pet_id

    INNER JOIN users u
      ON p.owner_id = u.user_id

    INNER JOIN services s
      ON a.service_id = s.service_id

    LEFT JOIN users d
      ON a.doctor_id = d.user_id

    WHERE 1 = 1
  `;

  let countQuery = `
    SELECT COUNT(*) AS total

    FROM appointments a

    INNER JOIN pets p
      ON a.pet_id = p.pet_id

    INNER JOIN users u
      ON p.owner_id = u.user_id

    INNER JOIN services s
      ON a.service_id = s.service_id

    LEFT JOIN users d
      ON a.doctor_id = d.user_id

    WHERE 1 = 1
  `;

  const values: any[] = [];
  let index = 1;

  if (filter.search) {

  const condition = `

    AND (

      LOWER(p.name)

      LIKE LOWER($${index})

      OR

      LOWER(u.full_name)

      LIKE LOWER($${index})

    )

  `;

  query += condition;
  countQuery += condition;

  values.push(`%${filter.search}%`);

  index++;

}

if (filter.status) {

  const condition = `
    AND a.status = $${index}
  `;

  query += condition;
  countQuery += condition;

  values.push(filter.status);

  index++;

}

if (filter.unassigned) {

  const condition = `
    AND a.doctor_id IS NULL
  `;

  query += condition;
  countQuery += condition;

}

if (filter.dateFrom) {

  const condition = `
    AND a.appointment_date >= $${index}
  `;

  query += condition;
  countQuery += condition;

  values.push(filter.dateFrom);

  index++;

}

if (filter.dateTo) {

  const condition = `
    AND a.appointment_date <= $${index}
  `;

  query += condition;
  countQuery += condition;

  values.push(filter.dateTo);

  index++;

}

query += `

ORDER BY

a.appointment_date DESC,

a.start_time DESC

LIMIT $${index}

OFFSET $${index + 1};

`;

values.push(limit);

values.push(offset);

const result =
await pool.query(
    query,
    values
);

const countResult =
await pool.query(
    countQuery,
    values.slice(0, values.length - 2)
);

const total =
Number(countResult.rows[0].total);

return {

    items: result.rows,

    pagination: {

        page,

        limit,

        total,

        totalPages:
            Math.ceil(total / limit)

    }

};

}

async listMedicalRecords(
  filter: MedicalRecordFilter
) {

  const page = filter.page || 1;

  const limit = filter.limit || 10;

  const offset = (page - 1) * limit;

  if (page < 1) {
    throw new AppError(
      "Page must be greater than 0",
      400
    );
  }

  if (limit < 1 || limit > 100) {
    throw new AppError(
      "Limit must be between 1 and 100",
      400
    );
  }
    let query = `
    SELECT

      mr.record_id,

      mr.record_date,

      mr.diagnosis,

      p.pet_id,

      p.name AS pet_name,

      owner.user_id AS owner_id,

      owner.full_name AS owner_name,

      doctor.user_id AS doctor_id,

      doctor.full_name AS doctor_name,

      a.appointment_id

    FROM medical_records mr

    INNER JOIN pets p
      ON mr.pet_id = p.pet_id

    INNER JOIN users owner
      ON p.owner_id = owner.user_id

    INNER JOIN users doctor
      ON mr.doctor_id = doctor.user_id

    LEFT JOIN appointments a
      ON mr.appointment_id = a.appointment_id

    WHERE 1 = 1
  `;
    let countQuery = `
    SELECT COUNT(*) AS total

    FROM medical_records mr

    INNER JOIN pets p
      ON mr.pet_id = p.pet_id

    INNER JOIN users owner
      ON p.owner_id = owner.user_id

    INNER JOIN users doctor
      ON mr.doctor_id = doctor.user_id

    LEFT JOIN appointments a
      ON mr.appointment_id = a.appointment_id

    WHERE 1 = 1
  `;
    const values: any[] = [];

  let index = 1;
    if (filter.search) {

    const condition = `
      AND (

        LOWER(p.name)
        LIKE LOWER($${index})

        OR

        LOWER(owner.full_name)
        LIKE LOWER($${index})

        OR

        LOWER(doctor.full_name)
        LIKE LOWER($${index})

      )
    `;

    query += condition;

    countQuery += condition;

    values.push(`%${filter.search}%`);

    index++;

  }
    if (filter.doctorId) {

    const condition = `
      AND doctor.user_id = $${index}
    `;

    query += condition;

    countQuery += condition;

    values.push(filter.doctorId);

    index++;

  }
    if (filter.dateFrom) {

    const condition = `
      AND mr.record_date >= $${index}
    `;

    query += condition;

    countQuery += condition;

    values.push(filter.dateFrom);

    index++;

  }
    if (filter.dateTo) {

    const condition = `
      AND mr.record_date <= $${index}
    `;

    query += condition;

    countQuery += condition;

    values.push(filter.dateTo);

    index++;

  }
    query += `

    ORDER BY

      mr.record_date DESC,

      mr.record_id DESC

    LIMIT $${index}

    OFFSET $${index + 1};

  `;

  values.push(limit);

  values.push(offset);
    const result =
    await pool.query(
      query,
      values
    );

  const countResult =
    await pool.query(
      countQuery,
      values.slice(0, values.length - 2)
    );

  const total =
    Number(countResult.rows[0].total);

  return {

    items: result.rows,

    pagination: {

      page,

      limit,

      total,

      totalPages:
        Math.ceil(total / limit)

    }

  };

}

async listDoctors() {

  const result = await pool.query(
    `
    SELECT

      user_id,
      full_name,
      email

    FROM users

    WHERE

      role = 'doctor'

      AND is_active = true

    ORDER BY full_name;
    `
  );

  return result.rows;

}

async assignDoctor(
  appointmentId: number,
  doctorId: number
) {

  // Appointment tồn tại?

  const appointment = await pool.query(
    `
    SELECT
      appointment_id,
      doctor_id,
      status
    FROM appointments
    WHERE appointment_id = $1;
    `,
    [appointmentId]
  );

  if (appointment.rowCount === 0) {
    throw new AppError(
      "Appointment not found",
      404
    );
  }

  const current =
    appointment.rows[0];

  if (current.status !== "confirmed") {
    throw new AppError(
      "Only confirmed appointments can assign doctor",
      400
    );
  }

  if (current.doctor_id) {
    throw new AppError(
      "Doctor already assigned",
      409
    );
  }

  // Doctor tồn tại?

  const doctor = await pool.query(
    `
    SELECT user_id

    FROM users

    WHERE

      user_id = $1

      AND role = 'doctor'

      AND is_active = true;
    `,
    [doctorId]
  );

  if (doctor.rowCount === 0) {
    throw new AppError(
      "Doctor not found",
      404
    );
  }

  const result = await pool.query(
    `
    UPDATE appointments

    SET

      doctor_id = $1,

      doctor_assigned_at = NOW(),

      updated_at = NOW()

    WHERE appointment_id = $2

    RETURNING *;
    `,
    [
      doctorId,
      appointmentId
    ]
  );

  return result.rows[0];

}

async cancelAppointment(
  appointmentId: number,
  reason: string
) {

  if (!reason?.trim()) {
    throw new AppError(
      "Cancel reason is required",
      400
    );
  }

  const appointment =
    await pool.query(
      `
      SELECT

        appointment_id,
        status

      FROM appointments

      WHERE appointment_id = $1;
      `,
      [appointmentId]
    );

  if (appointment.rowCount === 0) {
    throw new AppError(
      "Appointment not found",
      404
    );
  }

  const current =
    appointment.rows[0];

  if (current.status === "cancelled") {
    throw new AppError(
      "Appointment already cancelled",
      409
    );
  }

  const result =
    await pool.query(
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
        reason,
        appointmentId
      ]
    );

  return result.rows[0];

}

async listVaccinations(
    filter: VaccinationFilter
) {
const page = filter.page || 1;

const limit = filter.limit || 10;

const offset = (page - 1) * limit;

if (page < 1) {

    throw new AppError(
        "Page must be greater than 0",
        400
    );

}

if (limit < 1 || limit > 100) {

    throw new AppError(
        "Limit must be between 1 and 100",
        400
    );

}
let query = `

SELECT

pv.vaccination_id,

pv.date_administered,

pv.next_due_date,

pv.batch_number,

pv.reminder_sent,

p.pet_id,

p.name AS pet_name,

u.user_id AS owner_id,

u.full_name AS owner_name,

vt.vaccine_type_id,

vt.name AS vaccine_type,

d.user_id AS doctor_id,

d.full_name AS doctor_name

FROM pet_vaccinations pv

INNER JOIN pets p

ON pv.pet_id = p.pet_id

INNER JOIN users u

ON p.owner_id = u.user_id

INNER JOIN vaccine_types vt

ON pv.vaccine_type_id = vt.vaccine_type_id

LEFT JOIN users d

ON pv.administered_by = d.user_id

WHERE 1 = 1

`;
let countQuery = `

SELECT COUNT(*) AS total

FROM pet_vaccinations pv

INNER JOIN pets p

ON pv.pet_id = p.pet_id

INNER JOIN users u

ON p.owner_id = u.user_id

INNER JOIN vaccine_types vt

ON pv.vaccine_type_id = vt.vaccine_type_id

LEFT JOIN users d

ON pv.administered_by = d.user_id

WHERE 1 = 1

`;
const values: any[] = [];

let index = 1;
if (filter.search) {

  const condition = `
    AND (
      LOWER(p.name) LIKE LOWER($${index})
      OR
      LOWER(u.full_name) LIKE LOWER($${index})
    )
  `;

  query += condition;
  countQuery += condition;

  values.push(`%${filter.search}%`);

  index++;
}
if (filter.vaccineType) {

  const condition = `
    AND vt.vaccine_type_id = $${index}
  `;

  query += condition;
  countQuery += condition;

  values.push(filter.vaccineType);

  index++;
}
if (filter.dueStatus === "overdue") {

  const condition = `
    AND pv.next_due_date < CURRENT_DATE
  `;

  query += condition;
  countQuery += condition;

}

if (filter.dueStatus === "upcoming") {

  const condition = `
    AND
      pv.next_due_date >= CURRENT_DATE
      AND
      pv.next_due_date <= CURRENT_DATE + INTERVAL '7 day'
  `;

  query += condition;
  countQuery += condition;

}

if (filter.dueStatus === "valid") {

  const condition = `
    AND
      pv.next_due_date >
      CURRENT_DATE + INTERVAL '7 day'
  `;

  query += condition;
  countQuery += condition;

}
query += `
ORDER BY
  pv.next_due_date ASC,
  pv.vaccination_id DESC
LIMIT $${index}
OFFSET $${index + 1};
`;

values.push(limit);
values.push(offset);
const result = await pool.query(
  query,
  values
);

const countResult = await pool.query(
  countQuery,
  values.slice(0, values.length - 2)
);

const total = Number(countResult.rows[0].total);

return {
  items: result.rows,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
};
}

}

export default new AdminService();