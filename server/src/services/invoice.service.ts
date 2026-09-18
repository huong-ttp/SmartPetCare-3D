import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface InvoiceFilter {
  status?: string;
}

class InvoiceService {
    async getInvoicesByOwner(
  ownerId: number,
  filter: InvoiceFilter
) {

    let query = `
      SELECT
        i.invoice_id,
        i.appointment_id,
        i.issued_date,
        i.total_amount,
        i.status,
        i.created_at,
        p.pet_id,
        p.name AS pet_name,
        p.species AS pet_species,
        a.appointment_date,
        a.start_time,
        s.name AS service_name
      FROM invoices i
      JOIN appointments a
        ON i.appointment_id = a.appointment_id
      JOIN pets p
        ON a.pet_id = p.pet_id
      LEFT JOIN services s
        ON a.service_id = s.service_id
      WHERE p.owner_id = $1
    `;

    const values: any[] = [ownerId];
    let index = 2;

    if (filter.status && filter.status !== "all") {
      query += `
        AND i.status = $${index}
      `;
      values.push(filter.status);
      index++;
    }

    query += `
      ORDER BY
        i.issued_date DESC, i.invoice_id DESC;
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getInvoiceById(
    ownerId: number,
    invoiceId: number
  ) {
    const invoiceResult = await pool.query(
      `
      SELECT
        i.invoice_id,
        i.appointment_id,
        i.issued_date,
        i.total_amount,
        i.status,
        i.created_at,

        p.pet_id,
        p.name AS pet_name,
        p.species AS pet_species,
        p.breed AS pet_breed,
        p.weight_kg AS pet_weight,

        a.appointment_date,
        a.start_time,
        a.end_time,
        a.reason,

        u.full_name AS owner_name,
        u.phone AS owner_phone,
        u.email AS owner_email
      FROM invoices i
      JOIN appointments a
        ON i.appointment_id = a.appointment_id
      JOIN pets p
        ON a.pet_id = p.pet_id
      JOIN users u
        ON p.owner_id = u.user_id
      WHERE
        i.invoice_id = $1
        AND p.owner_id = $2;
      `,
      [invoiceId, ownerId]
    );

    if (invoiceResult.rowCount === 0) {
      throw new AppError("Hóa đơn không tồn tại hoặc bạn không có quyền truy cập.", 404);
    }

    const itemResult = await pool.query(
      `
      SELECT
        ii.item_id,
        ii.quantity,
        ii.unit_price,
        ii.subtotal,
        s.service_id,
        COALESCE(s.name, 'Dịch vụ y tế') AS service_name,
        s.description AS service_description
      FROM invoice_items ii
      LEFT JOIN services s
        ON ii.service_id = s.service_id
      WHERE ii.invoice_id = $1;
      `,
      [invoiceId]
    );

    const paymentResult = await pool.query(
      `
      SELECT
        payment_id,
        invoice_id,
        amount,
        payment_method,
        payment_date,
        transaction_ref,
        status
      FROM payments
      WHERE invoice_id = $1
      ORDER BY payment_date DESC
      LIMIT 1;
      `,
      [invoiceId]
    );

    return {
      ...invoiceResult.rows[0],
      items: itemResult.rows,
      payment: paymentResult.rows[0] || null,
    };
  }
}

export default new InvoiceService();