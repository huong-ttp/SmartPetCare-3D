import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface CreatePetData {
  owner_id: number;

  name: string;

  species: string;

  breed?: string;

  gender: string;

  date_of_birth?: string;

  weight_kg?: number;

  color?: string;

  microchip_id?: string;

  avatar_url?: string;

  allergies?: string;

  chronic_conditions?: string;

  special_notes?: string;
}

class PetService {
  async createPet(data: CreatePetData) {

  // Chuẩn hóa gender
  const gender = data.gender.toLowerCase();

  // Kiểm tra gender hợp lệ
  const allowedGender = [
    "male",
    "female",
    "unknown",
  ];

  if (!allowedGender.includes(gender)) {
    throw new AppError(
      "Gender must be male, female or unknown",
      400
    );
  }

  // Kiểm tra owner có tồn tại
  const ownerResult = await pool.query(
    `
    SELECT user_id
    FROM users
    WHERE user_id = $1
    `,
    [data.owner_id]
  );

  if (ownerResult.rows.length === 0) {
    throw new AppError(
      "Owner not found",
      404
    );
  }

  // Thêm thú cưng
  const result = await pool.query(
    `
    INSERT INTO pets(
      owner_id,
      name,
      species,
      breed,
      gender,
      date_of_birth,
      weight_kg,
      color,
      microchip_id,
      avatar_url,
      allergies,
      chronic_conditions,
      special_notes
    )
    VALUES(
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
    )
    RETURNING *;
    `,
    [
      data.owner_id,
      data.name,
      data.species,
      data.breed ?? null,
      gender,
      data.date_of_birth ?? null,
      data.weight_kg ?? null,
      data.color ?? null,
      data.microchip_id ?? null,
      data.avatar_url ?? null,
      data.allergies ?? null,
      data.chronic_conditions ?? null,
      data.special_notes ?? null,
    ]
  );

  return result.rows[0];
}
}

export default new PetService();