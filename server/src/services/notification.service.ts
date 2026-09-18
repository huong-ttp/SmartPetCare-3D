import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface NotificationFilter {
  unread?: boolean;
  type?: string | string[];
  limit?: number;
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
      p.species AS pet_species,
      p.avatar_url AS pet_avatar,
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
    if (Array.isArray(filter.type)) {
      query += `
        AND n.type = ANY($${index})
      `;
      values.push(filter.type);
      index++;
    } else {
      query += `
        AND n.type = $${index}
      `;
      values.push(filter.type);
      index++;
    }
  }

  if (filter.unread) {
    query += `
      AND n.is_read = false
    `;
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
}

export default new notificationService();