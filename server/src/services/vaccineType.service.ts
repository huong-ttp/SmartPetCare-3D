import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface CreateVaccineTypeData {
  name: string;
  description?: string;
  recommended_interval_days: number;
}

interface UpdateVaccineTypeData {
  name: string;
  description?: string;
  recommended_interval_days: number;
}
class VaccineTypeService {

  async getAllVaccineTypes() {

    const result = await pool.query(
      `
      SELECT
        vaccine_type_id,
        name,
        description,
        recommended_interval_days
      FROM vaccine_types
      ORDER BY name ASC;
      `
    );

    return result.rows;
  }
async listVaccineTypes() {

  const result = await pool.query(
    `
    SELECT
      vaccine_type_id,
      name,
      description,
      recommended_interval_days
    FROM vaccine_types
    ORDER BY name ASC;
    `
  );

  return result.rows;
}
async createVaccineType(
  data: CreateVaccineTypeData
) {

  data.name = data.name.trim();

  if (!data.name) {
    throw new AppError(
      "Vaccine type name is required",
      400
    );
  }

  if (
    !data.recommended_interval_days ||
    data.recommended_interval_days <= 0
  ) {
    throw new AppError(
      "Recommended interval must be greater than 0",
      400
    );
  }

  const existed = await pool.query(
    `
    SELECT vaccine_type_id
    FROM vaccine_types
    WHERE LOWER(name)=LOWER($1);
    `,
    [data.name]
  );

  if (existed.rowCount! > 0) {
    throw new AppError(
      "Vaccine type already exists",
      409
    );
  }

  const result = await pool.query(
    `
    INSERT INTO vaccine_types
    (
      name,
      description,
      recommended_interval_days
    )
    VALUES
    (
      $1,
      $2,
      $3
    )
    RETURNING *;
    `,
    [
      data.name,
      data.description ?? null,
      data.recommended_interval_days
    ]
  );

  return result.rows[0];
}
async updateVaccineType(
  vaccineTypeId: number,
  data: UpdateVaccineTypeData
) {

  const existed = await pool.query(
    `
    SELECT vaccine_type_id
    FROM vaccine_types
    WHERE vaccine_type_id=$1;
    `,
    [vaccineTypeId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Vaccine type not found",
      404
    );
  }

  data.name = data.name.trim();

  if (!data.name) {
    throw new AppError(
      "Vaccine type name is required",
      400
    );
  }

  if (
    data.recommended_interval_days <= 0
  ) {
    throw new AppError(
      "Recommended interval must be greater than 0",
      400
    );
  }

  const duplicated = await pool.query(
    `
    SELECT vaccine_type_id
    FROM vaccine_types
    WHERE
      LOWER(name)=LOWER($1)
      AND vaccine_type_id <> $2;
    `,
    [
      data.name,
      vaccineTypeId
    ]
  );

  if (duplicated.rowCount! > 0) {
    throw new AppError(
      "Vaccine type already exists",
      409
    );
  }

  const result = await pool.query(
    `
    UPDATE vaccine_types
    SET
      name=$1,
      description=$2,
      recommended_interval_days=$3
    WHERE vaccine_type_id=$4
    RETURNING *;
    `,
    [
      data.name,
      data.description ?? null,
      data.recommended_interval_days,
      vaccineTypeId
    ]
  );

  return result.rows[0];
}
async deleteVaccineType(
  vaccineTypeId: number
) {

  const existed = await pool.query(
    `
    SELECT vaccine_type_id
    FROM vaccine_types
    WHERE vaccine_type_id=$1;
    `,
    [vaccineTypeId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Vaccine type not found",
      404
    );
  }

  const used = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM pet_vaccinations
    WHERE vaccine_type_id=$1;
    `,
    [vaccineTypeId]
  );

  if (
    Number(used.rows[0].total) > 0
  ) {
    throw new AppError(
      "Cannot delete vaccine type because vaccination records are linked.",
      409
    );
  }

  await pool.query(
    `
    DELETE
    FROM vaccine_types
    WHERE vaccine_type_id=$1;
    `,
    [vaccineTypeId]
  );

  return {
    message:
      "Vaccine type deleted successfully"
  };
}
}

export default new VaccineTypeService();