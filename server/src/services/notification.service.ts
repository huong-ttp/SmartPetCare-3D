import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface NotificationFilter {
  type?: string;
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


}

export default new notificationService();