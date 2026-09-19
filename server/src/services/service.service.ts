import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface ServiceFilter {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface CreateServiceData {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  category:
    | "examination"
    | "vaccination"
    | "surgery"
    | "grooming"
    | "other";
  is_active?: boolean;
}

interface UpdateServiceData {
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  category:
    | "examination"
    | "vaccination"
    | "surgery"
    | "grooming"
    | "other";
}

class ServiceService {

  async getActiveServices() {

    const result = await pool.query(
      `
      SELECT
        service_id,
        name,
        description,
        duration_minutes,
        price
      FROM services
      WHERE is_active = true
      ORDER BY name;
      `
    );

    return result.rows;
  }
  async listServices(
  filter: ServiceFilter
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
      service_id,
      name,
      description,
      price,
      duration_minutes,
      category,
      is_active
    FROM services
    WHERE 1 = 1
  `;

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM services
    WHERE 1 = 1
  `;

  const values: any[] = [];
  let index = 1;

  if (filter.search) {

    const condition = `
      AND LOWER(name)
      LIKE LOWER($${index})
    `;

    query += condition;
    countQuery += condition;

    values.push(`%${filter.search}%`);

    index++;
  }

  if (filter.category) {

    const condition = `
      AND category = $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.category);

    index++;
  }

  if (filter.status) {

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
    ORDER BY name ASC
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

  const total = Number(
    countResult.rows[0].total
  );

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
async createService(
  data: CreateServiceData
) {

  if (!data.name?.trim()) {
    throw new AppError(
      "Service name is required",
      400
    );
  }

  if (data.price <= 0) {
    throw new AppError(
      "Price must be greater than 0",
      400
    );
  }

  if (
    data.duration_minutes &&
    data.duration_minutes <= 0
  ) {
    throw new AppError(
      "Duration must be greater than 0",
      400
    );
  }

  const existed = await pool.query(
    `
    SELECT service_id
    FROM services
    WHERE LOWER(name)=LOWER($1)
    `,
    [data.name]
  );

  if (existed.rowCount! > 0) {
    throw new AppError(
      "Service already exists",
      409
    );
  }

  const result = await pool.query(
    `
    INSERT INTO services
    (
      name,
      description,
      price,
      duration_minutes,
      category,
      is_active
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      COALESCE($6,true)
    )
    RETURNING *;
    `,
    [
      data.name,
      data.description ?? null,
      data.price,
      data.duration_minutes ?? null,
      data.category,
      data.is_active ?? true
    ]
  );

  return result.rows[0];

}

async updateService(
  serviceId: number,
  data: UpdateServiceData
) {

  const existed = await pool.query(
    `
    SELECT service_id
    FROM services
    WHERE service_id=$1
    `,
    [serviceId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Service not found",
      404
    );
  }

  if (!data.name.trim()) {
    throw new AppError(
      "Service name is required",
      400
    );
  }

  if (data.price <= 0) {
    throw new AppError(
      "Price must be greater than 0",
      400
    );
  }

  const result = await pool.query(
    `
    UPDATE services
    SET
      name=$1,
      description=$2,
      price=$3,
      duration_minutes=$4,
      category=$5
    WHERE service_id=$6
    RETURNING *;
    `,
    [
      data.name,
      data.description ?? null,
      data.price,
      data.duration_minutes ?? null,
      data.category,
      serviceId
    ]
  );

  return result.rows[0];

}

async toggleServiceActive(
  serviceId: number
) {

  const existed = await pool.query(
    `
    SELECT
      service_id,
      is_active
    FROM services
    WHERE service_id=$1
    `,
    [serviceId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Service not found",
      404
    );
  }

  const current = existed.rows[0];

  const result = await pool.query(
    `
    UPDATE services
    SET
      is_active=$1
    WHERE service_id=$2
    RETURNING *;
    `,
    [
      !current.is_active,
      serviceId
    ]
  );

  return result.rows[0];

}

async deleteService(
  serviceId: number
) {

  const existed = await pool.query(
    `
    SELECT service_id
    FROM services
    WHERE service_id=$1
    `,
    [serviceId]
  );

  if (existed.rowCount === 0) {
    throw new AppError(
      "Service not found",
      404
    );
  }

  const appointmentResult =
    await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE service_id=$1
      `,
      [serviceId]
    );

  if (
    Number(
      appointmentResult.rows[0].total
    ) > 0
  ) {
    throw new AppError(
      "Cannot delete service because appointments are linked.",
      409
    );
  }

  const invoiceResult =
    await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM invoice_items
      WHERE service_id=$1
      `,
      [serviceId]
    );

  if (
    Number(
      invoiceResult.rows[0].total
    ) > 0
  ) {
    throw new AppError(
      "Cannot delete service because invoice items are linked.",
      409
    );
  }

  await pool.query(
    `
    DELETE FROM services
    WHERE service_id=$1
    `,
    [serviceId]
  );

  return {
    message:
      "Service deleted successfully"
  };

}
}

export default new ServiceService();