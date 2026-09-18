import pool from "../config/database.config";

class ServiceService {

  async getActiveServices() {

    const result = await pool.query(
      `
      SELECT
        service_id,
        name,
        description,
        duration_minutes,
        price,
        category,
        is_active
      FROM services
      WHERE is_active = true
      ORDER BY name;
      `
    );

    return result.rows;
  }

}

export default new ServiceService();