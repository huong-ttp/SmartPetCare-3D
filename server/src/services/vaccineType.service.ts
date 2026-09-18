import pool from "../config/database.config";

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

}

export default new VaccineTypeService();