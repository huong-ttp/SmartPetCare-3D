import pool from "../config/database.config";
import AppError from "../utils/AppError";


interface InvoiceFilter {
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
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
const paymentResult = await pool.query(
`
SELECT
    payment_id,
    amount,
    payment_method,
    payment_date,
    transaction_ref,
    status

FROM payments

WHERE invoice_id = $1

ORDER BY payment_date DESC;
`,
[
    invoiceId
]
);
return {

    ...invoiceResult.rows[0],

    items: itemResult.rows,
    
    payments: paymentResult.rows

};

}

async listInvoices(
  filter: InvoiceFilter
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
    i.invoice_id,
    i.issued_date,
    i.total_amount,
    i.status,

    u.user_id,
    u.full_name AS owner_name,

    p.pet_id,
    p.name AS pet_name,

    a.appointment_id,
    a.status AS appointment_status

FROM invoices i

JOIN users u
ON u.user_id = i.owner_id

JOIN appointments a
ON a.appointment_id = i.appointment_id

JOIN pets p
ON p.pet_id = a.pet_id

WHERE 1 = 1
`;
let countQuery = `
SELECT COUNT(*) AS total

FROM invoices i

JOIN users u
ON u.user_id = i.owner_id

JOIN appointments a
ON a.appointment_id = i.appointment_id

JOIN pets p
ON p.pet_id = a.pet_id

WHERE 1 = 1
`;
const values: any[] = [];
let index = 1;
if (filter.search) {

  const condition = `
    AND (
      LOWER(u.full_name) LIKE LOWER($${index})
      OR LOWER(p.name) LIKE LOWER($${index})
    )
  `;

  query += condition;
  countQuery += condition;

  values.push(`%${filter.search}%`);

  index++;
}
if (filter.status) {

  const condition = `
    AND i.status = $${index}
  `;

  query += condition;
  countQuery += condition;

  values.push(filter.status);

  index++;
}
if (filter.fromDate) {

  const condition = `
    AND i.issued_date >= $${index}
  `;

  query += condition;
  countQuery += condition;

  values.push(filter.fromDate);

  index++;
}
if (filter.toDate) {

  const condition = `
    AND i.issued_date <= $${index}
  `;

  query += condition;
  countQuery += condition;

  values.push(filter.toDate);

  index++;
}
query += `
  ORDER BY i.issued_date DESC

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

async getInvoiceByIdAdmin(
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

    u.user_id,
    u.full_name AS owner_name,

    p.pet_id,
    p.name AS pet_name,

    a.appointment_date,
    a.start_time,
    a.status AS appointment_status

FROM invoices i

JOIN users u
ON u.user_id = i.owner_id

JOIN appointments a
ON a.appointment_id = i.appointment_id

JOIN pets p
ON p.pet_id = a.pet_id

WHERE i.invoice_id = $1;
`,
[invoiceId]
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
ON s.service_id = ii.service_id

WHERE ii.invoice_id = $1;
`,
[invoiceId]
  );

  const paymentResult = await pool.query(
`
SELECT
    payment_id,
    amount,
    payment_method,
    payment_date,
    transaction_ref,
    status

FROM payments

WHERE invoice_id = $1

ORDER BY payment_date DESC;
`,
[invoiceId]
  );

  return {

    ...invoiceResult.rows[0],

    items: itemResult.rows,

    payments: paymentResult.rows

  };

}

async cancelInvoice(
  invoiceId: number,
  reason: string
) {
  const invoiceResult = await pool.query(
`
SELECT
    invoice_id,
    status
FROM invoices
WHERE invoice_id = $1;
`,
[
    invoiceId
]
);

if (invoiceResult.rowCount === 0) {
  throw new AppError(
    "Invoice not found",
    404
  );
}
if (
  invoiceResult.rows[0].status === "cancelled"
) {
  throw new AppError(
    "Invoice has already been cancelled",
    400
  );
}
if (
  invoiceResult.rows[0].status === "paid"
) {
  throw new AppError(
    "Paid invoice cannot be cancelled",
    400
  );
}
const result = await pool.query(
`
UPDATE invoices
SET
    status = 'cancelled',
    cancel_reason = $2
WHERE invoice_id = $1
RETURNING *;
`,
[
    invoiceId,
    reason
]
);
return result.rows[0];

}

}

export default new InvoiceService();