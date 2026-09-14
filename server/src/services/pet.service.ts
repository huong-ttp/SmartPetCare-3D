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

interface UpdatePetData {
  name?: string;
  species?: string;
  breed?: string;
  gender?: string;
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

async getPetsByOwner(ownerId: number) {
  const result = await pool.query(
    `
    SELECT *
    FROM pets
    WHERE owner_id = $1
    ORDER BY created_at DESC;
    `,
    [ownerId]
  );

  return result.rows;
}

async getPetById(
  petId: number,
  ownerId: number
) {
  const result = await pool.query(
    `
    SELECT *
    FROM pets
    WHERE pet_id = $1
    `,
    [petId]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Pet not found",
      404
    );
  }

  const pet = result.rows[0];

  if (pet.owner_id !== ownerId) {
    throw new AppError(
      "You do not have permission to access this pet",
      403
    );
  }

  return pet;
}

async updatePet(
  petId: number,
  ownerId: number,
  data: UpdatePetData
) {
  const pet = await this.getPetById(
    petId,
    ownerId
  );

  const result = await pool.query(
    `
    UPDATE pets
    SET
      name=$1,
      species=$2,
      breed=$3,
      gender=$4,
      date_of_birth=$5,
      weight_kg=$6,
      color=$7,
      microchip_id=$8,
      avatar_url=$9,
      allergies=$10,
      chronic_conditions=$11,
      special_notes=$12,
      updated_at=NOW()
    WHERE pet_id=$13
    RETURNING *;
    `,
    [
      data.name ?? pet.name,
      data.species ?? pet.species,
      data.breed ?? pet.breed,
      data.gender ?? pet.gender,
      data.date_of_birth ?? pet.date_of_birth,
      data.weight_kg ?? pet.weight_kg,
      data.color ?? pet.color,
      data.microchip_id ?? pet.microchip_id,
      data.avatar_url ?? pet.avatar_url,
      data.allergies ?? pet.allergies,
      data.chronic_conditions ?? pet.chronic_conditions,
      data.special_notes ?? pet.special_notes,
      petId,
    ]
  );

  return result.rows[0];
}
}

export default new PetService();