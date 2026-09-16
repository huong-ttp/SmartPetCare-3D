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

      p.name AS pet_name

    FROM invoices i

    JOIN appointments a
      ON i.appointment_id = a.appointment_id

    JOIN pets p
      ON a.pet_id = p.pet_id

    WHERE p.owner_id = $1
  `;

  const values: any[] = [ownerId];
  let index = 2;

  if (filter.status) {
    query += `
      AND i.status = $${index}
    `;

    values.push(filter.status);
    index++;
  }

  query += `
    ORDER BY
      i.issued_date DESC;
  `;

  const result =
    await pool.query(query, values);

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

    p.pet_id,
    p.name AS pet_name,

    a.appointment_date,
    a.start_time

FROM invoices i

JOIN appointments a
    ON i.appointment_id = a.appointment_id

JOIN pets p
    ON a.pet_id = p.pet_id

WHERE
    i.invoice_id = $1
AND
    p.owner_id = $2;
`,
[
    invoiceId,
    ownerId
]
);
if (invoiceResult.rowCount === 0) {
    throw new AppError(
        "Invoice not found",
        404
    );
}
const itemResult = await pool.query(
`
SELECT
    ii.item_id,
    ii.quantity,
    ii.unit_price,
    ii.subtotal,

    s.service_id,
    s.name AS service_name

FROM invoice_items ii

JOIN services s
ON ii.service_id = s.service_id

WHERE ii.invoice_id = $1;
`,
[
    invoiceId
]
);
return {

    ...invoiceResult.rows[0],

    items: itemResult.rows

};

}

}

export default new InvoiceService();