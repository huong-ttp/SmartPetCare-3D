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
    const gender = (data.gender || "unknown").toLowerCase();

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

    // Sanitize optional fields to avoid empty string database crashes
    const microchip_id = data.microchip_id && data.microchip_id.trim() !== "" ? data.microchip_id.trim() : null;
    const date_of_birth = data.date_of_birth && data.date_of_birth.trim() !== "" ? data.date_of_birth.trim() : null;
    const weight_kg = data.weight_kg !== undefined && data.weight_kg !== null && String(data.weight_kg).trim() !== "" ? Number(data.weight_kg) : null;
    const breed = data.breed?.trim() || null;
    const color = data.color?.trim() || null;
    const avatar_url = data.avatar_url && data.avatar_url.trim() !== "" ? data.avatar_url.trim() : null;
    const allergies = data.allergies?.trim() || null;
    const chronic_conditions = data.chronic_conditions?.trim() || null;
    const special_notes = data.special_notes?.trim() || null;

    // Kiểm tra Microchip ID đã tồn tại chưa nếu có nhập
    if (microchip_id) {
      const existingChip = await pool.query(
        `SELECT pet_id FROM pets WHERE LOWER(microchip_id) = LOWER($1)`,
        [microchip_id]
      );
      if (existingChip.rows.length > 0) {
        throw new AppError("Mã Microchip ID này đã được đăng ký cho thú cưng khác", 400);
      }
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
        data.name ? data.name.trim() : "",
        data.species ? data.species.trim() : "",
        breed,
        gender,
        date_of_birth,
        weight_kg,
        color,
        microchip_id,
        avatar_url,
        allergies,
        chronic_conditions,
        special_notes,
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
    ownerId: number,
    userRole?: string
  ) {
    const result = await pool.query(
      `
      SELECT
        p.*,
        u.full_name AS owner_name,
        u.phone AS owner_phone,
        u.email AS owner_email
      FROM pets p
      LEFT JOIN users u ON p.owner_id = u.user_id
      WHERE p.pet_id = $1
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

    // Cho phép doctor và admin xem thông tin pet, owner chỉ xem được thú cưng của mình
    const normalizedRole = userRole?.toLowerCase();
    if (normalizedRole !== "doctor" && normalizedRole !== "admin" && pet.owner_id !== ownerId) {
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
    data: UpdatePetData,
    userRole?: string
  ) {
    const pet = await this.getPetById(
      petId,
      ownerId,
      userRole
    );

    const microchip_id = data.microchip_id !== undefined
      ? (data.microchip_id && data.microchip_id.trim() !== "" ? data.microchip_id.trim() : null)
      : pet.microchip_id;

    // Kiểm tra Microchip ID đã tồn tại chưa nếu có nhập và khác với giá trị hiện tại
    if (microchip_id && microchip_id !== pet.microchip_id) {
      const existingChip = await pool.query(
        `SELECT pet_id FROM pets WHERE LOWER(microchip_id) = LOWER($1) AND pet_id != $2`,
        [microchip_id, petId]
      );
      if (existingChip.rows.length > 0) {
        throw new AppError("Mã Microchip ID này đã được đăng ký cho thú cưng khác", 400);
      }
    }

    const gender = data.gender ? data.gender.toLowerCase() : pet.gender;
    const date_of_birth = data.date_of_birth !== undefined
      ? (data.date_of_birth && data.date_of_birth.trim() !== "" ? data.date_of_birth.trim() : null)
      : pet.date_of_birth;
    const weight_kg = data.weight_kg !== undefined
      ? (data.weight_kg !== null && String(data.weight_kg).trim() !== "" ? Number(data.weight_kg) : null)
      : pet.weight_kg;
    const breed = data.breed !== undefined ? (data.breed?.trim() || null) : pet.breed;
    const color = data.color !== undefined ? (data.color?.trim() || null) : pet.color;
    const avatar_url = data.avatar_url !== undefined
      ? (data.avatar_url && data.avatar_url.trim() !== "" ? data.avatar_url.trim() : null)
      : pet.avatar_url;
    const allergies = data.allergies !== undefined ? (data.allergies?.trim() || null) : pet.allergies;
    const chronic_conditions = data.chronic_conditions !== undefined
      ? (data.chronic_conditions?.trim() || null)
      : pet.chronic_conditions;
    const special_notes = data.special_notes !== undefined
      ? (data.special_notes?.trim() || null)
      : pet.special_notes;

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
        data.name ? data.name.trim() : pet.name,
        data.species ? data.species.trim() : pet.species,
        breed,
        gender,
        date_of_birth,
        weight_kg,
        color,
        microchip_id,
        avatar_url,
        allergies,
        chronic_conditions,
        special_notes,
        petId,
      ]
    );

    return result.rows[0];
  }

  async deletePet(
    petId: number,
    ownerId: number,
    userRole?: string
  ) {
    await this.getPetById(
      petId,
      ownerId,
      userRole
    );

    await pool.query(
      `
      DELETE FROM pets
      WHERE pet_id = $1
      `,
      [petId]
    );

    return {
      message: "Pet deleted successfully",
    };
  }
}

export default new PetService();