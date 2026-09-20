import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface NotificationFilter {
  unread?: boolean;
  type?: string;
  limit?: number;
   search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
}

interface SendSystemNotificationData {
  target: "all" | "role" | "user";
  role?: string;
  user_id?: number;
  title: string;
  content: string;
}

class notificationService {
    async getReminderNotifications(
  userId: number,
  filter: NotificationFilter
) {

  let query = `
    SELECT
      n.notification_id,
      n.pet_id,
      p.name AS pet_name,
      n.type,
      n.title,
      n.content,
      n.is_read,
      n.scheduled_at,
      n.sent_at,
      n.created_at

    FROM notifications n

    LEFT JOIN pets p
      ON n.pet_id = p.pet_id

    WHERE
      n.user_id = $1
      AND n.type IN (
        'appointment_reminder',
        'vaccine_reminder',
        'checkup_reminder'
      )
  `;

  const values: any[] = [userId];
  let index = 2;

  if (filter.type) {

    query += `
      AND n.type = $${index}
    `;

    values.push(filter.type);
    index++;
  }

  query += `
    ORDER BY
      COALESCE(
        n.scheduled_at,
        n.sent_at,
        n.created_at
      ) DESC;
  `;

  const result = await pool.query(
    query,
    values
  );

  return result.rows;
}

async markAsRead(
  ownerId: number,
  notificationId: number
) {

  const result = await pool.query(
    `
    UPDATE notifications
    SET
      is_read = true
    WHERE
      notification_id = $1
      AND user_id = $2
    RETURNING *;
    `,
    [
      notificationId,
      ownerId
    ]
  );

  if (result.rowCount === 0) {
    throw new AppError(
      "Notification not found",
      404
    );
  }

  return result.rows[0];
}

async getNotifications(
    userId: number,
    filter: NotificationFilter
) {

    let query = `
    SELECT
        n.notification_id,
        n.pet_id,
        p.name AS pet_name,
        n.type,
        n.title,
        n.content,
        n.is_read,
        n.scheduled_at,
        n.sent_at,
        n.created_at

    FROM notifications n

    LEFT JOIN pets p
    ON n.pet_id = p.pet_id

    WHERE
        n.user_id = $1
    `;

    const values: any[] = [userId];
    let index = 2;

    if (filter.unread) {

        query += `
        AND n.is_read = false
        `;

    }

    if (filter.type) {

        query += `
        AND n.type = $${index}
        `;

        values.push(filter.type);

        index++;

    }

    query += `
    ORDER BY
        n.created_at DESC
    `;

    if (filter.limit) {

        query += `
        LIMIT $${index}
        `;

        values.push(filter.limit);

    }

    const result = await pool.query(
        query,
        values
    );

    return result.rows;

}

async markAllAsRead(
  userId: number
) {

  await pool.query(
    `
    UPDATE notifications
    SET
      is_read = true
    WHERE
      user_id = $1
      AND is_read = false;
    `,
    [userId]
  );

  return {
    message: "All notifications marked as read"
  };

}

async listNotifications(
  filter: NotificationFilter
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
      n.notification_id,
      n.user_id,
      n.pet_id,
      n.type,
      n.title,
      n.content,
      n.is_read,
      n.scheduled_at,
      n.sent_at,
      n.created_at,

      u.full_name,

      p.name AS pet_name

    FROM notifications n

    JOIN users u
      ON n.user_id = u.user_id

    LEFT JOIN pets p
      ON n.pet_id = p.pet_id

    WHERE 1 = 1
  `;

  let countQuery = `
    SELECT COUNT(*) AS total

    FROM notifications n

    JOIN users u
      ON n.user_id = u.user_id

    LEFT JOIN pets p
      ON n.pet_id = p.pet_id

    WHERE 1 = 1
  `;

  const values: any[] = [];
  let index = 1;

  if (filter.search) {

    const condition = `
      AND LOWER(u.full_name)
      LIKE LOWER($${index})
    `;

    query += condition;
    countQuery += condition;

    values.push(`%${filter.search}%`);

    index++;
  }

  if (filter.type) {

    const condition = `
      AND n.type = $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.type);

    index++;
  }

  if (filter.fromDate) {

    const condition = `
      AND n.created_at >= $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.fromDate);

    index++;
  }

  if (filter.toDate) {

    const condition = `
      AND n.created_at <= $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.toDate);

    index++;
  }

  query += `
    ORDER BY
      n.created_at DESC

    LIMIT $${index}
    OFFSET $${index + 1};
  `;

  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    query,
    values
  );

  const countResult =
    await pool.query(
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

async sendSystemNotification(
  data: SendSystemNotificationData
) {

  let users: any[] = [];

  if (data.target === "all") {

    const result = await pool.query(
      `
      SELECT user_id
      FROM users
      WHERE is_active = true;
      `
    );

    users = result.rows;

  }

  else if (data.target === "role") {

    if (!data.role) {
      throw new AppError(
        "Role is required",
        400
      );
    }

    const result = await pool.query(
      `
      SELECT user_id
      FROM users
      WHERE
        role = $1
        AND is_active = true;
      `,
      [data.role]
    );

    users = result.rows;

  }

  else if (data.target === "user") {

    if (!data.user_id) {
      throw new AppError(
        "User is required",
        400
      );
    }

    const result = await pool.query(
      `
      SELECT user_id
      FROM users
      WHERE
        user_id = $1
        AND is_active = true;
      `,
      [data.user_id]
    );

    users = result.rows;

  }

  else {

    throw new AppError(
      "Invalid target",
      400
    );

  }

  if (users.length === 0) {

    throw new AppError(
      "No recipients found",
      404
    );

  }

  for (const user of users) {

    await pool.query(
      `
      INSERT INTO notifications
      (
        user_id,
        type,
        title,
        content,
        is_read,
        sent_at,
        created_at
      )
      VALUES
      (
        $1,
        'system',
        $2,
        $3,
        false,
        NOW(),
        NOW()
      );
      `,
      [
        user.user_id,
        data.title,
        data.content
      ]
    );

  }

  return {
    recipients: users.length
  };

}
}

export default new notificationService();