import pool from "../config/database.config";
import AppError from "../utils/AppError";

interface CreatePaymentData {
  invoice_id: number;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  transaction_ref?: string;
}

interface UpdatePaymentStatusData {
  status: "success" | "failed";
}

interface PaymentFilter {
  search?: string;
  status?: string;
  method?: string;
  page?: number;
  limit?: number;
}

interface CreateCashPaymentData {
  invoice_id: number;
  amount: number;
}

class PaymentService {
    async createPayment(
  ownerId: number,
  data: CreatePaymentData
) {
    const invoiceId = Number(data.invoice_id);
    const amount = Number(data.amount);

    const invoiceResult = await pool.query(
      `
      SELECT
        i.*,
        p.owner_id
      FROM invoices i
      JOIN appointments a
        ON i.appointment_id = a.appointment_id
      JOIN pets p
        ON a.pet_id = p.pet_id
      WHERE
        i.invoice_id = $1
        AND p.owner_id = $2;
      `,
      [invoiceId, ownerId]
    );

    if (invoiceResult.rowCount === 0) {
      throw new AppError("Invoice not found", 404);
    }

    const invoice = invoiceResult.rows[0];

    if (Number(invoice.total_amount) !== amount) {
      throw new AppError("Invalid payment amount", 400);
    }

    if (invoice.status === "paid") {
      throw new AppError("Invoice already paid", 400);
    }

    if (invoice.status === "cancelled") {
      throw new AppError("Cancelled invoice cannot be paid", 400);
    }

    if (data.payment_method === "bank_transfer" && !data.transaction_ref?.trim()) {
      throw new AppError("Transaction reference is required", 400);
    }

    if (!["cash", "bank_transfer"].includes(data.payment_method)) {
      throw new AppError("Invalid payment method", 400);
    }

    const existed = await pool.query(
      `
      SELECT *
      FROM payments
      WHERE
        invoice_id = $1
        AND status = 'pending';
      `,
      [invoiceId]
    );

    if (existed.rowCount! > 0) {
      throw new AppError("Payment is already pending", 409);
    }

    const result = await pool.query(
      `
      INSERT INTO payments (
        invoice_id,
        amount,
        payment_method,
        payment_date,
        transaction_ref,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        NOW(),
        $4,
        'pending'
      )
      RETURNING *;
      `,
      [
        invoiceId,
        amount,
        data.payment_method,
        data.transaction_ref?.trim() ?? null,
      ]
    );

    return result.rows[0];

}



async getPaymentByInvoice(
  ownerId: number,
  invoiceId: number
) {
    const invoiceResult = await pool.query(
`
SELECT
    i.invoice_id
FROM invoices i

JOIN appointments a
ON i.appointment_id = a.appointment_id

JOIN pets p
ON a.pet_id = p.pet_id

WHERE
    i.invoice_id = $1
AND p.owner_id = $2;
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
const result = await pool.query(
`
SELECT *
FROM payments
WHERE invoice_id = $1
ORDER BY payment_date DESC
LIMIT 1;
`,
[
    invoiceId
]
);
if (result.rowCount === 0) {
    return null;
}
return result.rows[0];

}
async getPaymentById(
  ownerId: number,
  paymentId: number
) {

  const result = await pool.query(
    `
    SELECT
      pay.*,
      i.invoice_id,
      p.name AS pet_name
    FROM payments pay

    JOIN invoices i
      ON pay.invoice_id = i.invoice_id

    JOIN appointments a
      ON i.appointment_id = a.appointment_id

    JOIN pets p
      ON a.pet_id = p.pet_id

    WHERE
      pay.payment_id = $1
      AND p.owner_id = $2;
    `,
    [
      paymentId,
      ownerId
    ]
  );

  if (result.rowCount === 0) {
    throw new AppError(
      "Payment not found",
      404
    );
  }

  return result.rows[0];
}

async getPaymentsByOwner(
  ownerId: number
) {

  const result = await pool.query(
    `
    SELECT
      pay.*,
      i.invoice_id,
      p.name AS pet_name

    FROM payments pay

    JOIN invoices i
      ON pay.invoice_id = i.invoice_id

    JOIN appointments a
      ON i.appointment_id = a.appointment_id

    JOIN pets p
      ON a.pet_id = p.pet_id

    WHERE
      p.owner_id = $1

    ORDER BY
      pay.payment_date DESC;
    `,
    [ownerId]
  );

  return result.rows;
}

async updatePaymentStatus(
  paymentId: number,
  data: UpdatePaymentStatusData
) {

  const paymentResult = await pool.query(
    `
    SELECT *
    FROM payments
    WHERE payment_id = $1;
    `,
    [paymentId]
  );

  if (paymentResult.rowCount === 0) {
    throw new AppError(
      "Payment not found",
      404
    );
  }
  if (
  !["success", "failed"].includes(data.status)
) {
  throw new AppError(
    "Invalid payment status",
    400
  );
}

  const payment = paymentResult.rows[0];

  if (payment.status !== "pending") {
    throw new AppError(
      "Payment has already been processed",
      400
    );
  }

  const updatedPayment = await pool.query(
    `
    UPDATE payments
    SET status = $1
    WHERE payment_id = $2
    RETURNING *;
    `,
    [
      data.status,
      paymentId
    ]
  );

  if (data.status === "success") {

    await pool.query(
      `
      UPDATE invoices
      SET status = 'paid'
      WHERE invoice_id = $1;
      `,
      [payment.invoice_id]
    );

  }

  return updatedPayment.rows[0];

}

async listPayments(
  filter: PaymentFilter
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
      p.payment_id,
      p.invoice_id,
      p.amount,
      p.payment_method,
      p.payment_date,
      p.transaction_ref,
      p.status,

      i.total_amount,
      i.issued_date,

      u.user_id,
      u.full_name AS owner_name,

      pet.pet_id,
      pet.name AS pet_name

    FROM payments p

    JOIN invoices i
      ON p.invoice_id = i.invoice_id

    JOIN users u
      ON i.owner_id = u.user_id

    JOIN appointments a
      ON i.appointment_id = a.appointment_id

    JOIN pets pet
      ON a.pet_id = pet.pet_id

    WHERE 1 = 1
  `;

  let countQuery = `
    SELECT COUNT(*) AS total

    FROM payments p

    JOIN invoices i
      ON p.invoice_id = i.invoice_id

    JOIN users u
      ON i.owner_id = u.user_id

    JOIN appointments a
      ON i.appointment_id = a.appointment_id

    JOIN pets pet
      ON a.pet_id = pet.pet_id

    WHERE 1 = 1
  `;

  const values: any[] = [];
  let index = 1;
    if (filter.search) {

    const condition = `
      AND (
        LOWER(u.full_name)
          LIKE LOWER($${index})

        OR LOWER(pet.name)
          LIKE LOWER($${index})
      )
    `;

    query += condition;
    countQuery += condition;

    values.push(`%${filter.search}%`);

    index++;
  }
    if (filter.status) {

    const condition = `
      AND p.status = $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.status);

    index++;
  }
    if (filter.method) {

    const condition = `
      AND p.payment_method = $${index}
    `;

    query += condition;
    countQuery += condition;

    values.push(filter.method);

    index++;
  }
    query += `
    ORDER BY
      p.payment_date DESC

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

async getPaymentByIdAdmin(
  paymentId: number
) {

  const paymentResult = await pool.query(
`
SELECT
    p.payment_id,
    p.invoice_id,
    p.amount,
    p.payment_method,
    p.payment_date,
    p.transaction_ref,
    p.status,
    p.reject_reason,

    i.total_amount,
    i.issued_date,
    i.status AS invoice_status,

    u.user_id,
    u.full_name AS owner_name,

    pet.pet_id,
    pet.name AS pet_name,

    a.appointment_id,
    a.appointment_date,
    a.start_time,
    a.status AS appointment_status

FROM payments p

JOIN invoices i
ON p.invoice_id = i.invoice_id

JOIN users u
ON i.owner_id = u.user_id

JOIN appointments a
ON i.appointment_id = a.appointment_id

JOIN pets pet
ON a.pet_id = pet.pet_id

WHERE p.payment_id = $1;
`,
[
    paymentId
]
);

  if (paymentResult.rowCount === 0) {
    throw new AppError(
      "Payment not found",
      404
    );
  }

  const payment = paymentResult.rows[0];

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
    payment.invoice_id
]
);

  return {

    ...payment,

    items: itemResult.rows

  };

}

async confirmPayment(
  paymentId: number
) {

  const paymentResult = await pool.query(
`
SELECT
    payment_id,
    invoice_id,
    status
FROM payments
WHERE payment_id = $1;
`,
[
    paymentId
]
);

  if (paymentResult.rowCount === 0) {
    throw new AppError(
      "Payment not found",
      404
    );
  }

  const payment = paymentResult.rows[0];

  if (payment.status !== "pending") {
    throw new AppError(
      "Only pending payment can be confirmed",
      400
    );
  }

  await pool.query("BEGIN");

  try {

    const updatePayment =
      await pool.query(
`
UPDATE payments
SET
    status = 'success'
WHERE payment_id = $1
RETURNING *;
`,
[
    paymentId
]
);

    await pool.query(
`
UPDATE invoices
SET
    status = 'paid'
WHERE invoice_id = $1;
`,
[
    payment.invoice_id
]
);

    await pool.query("COMMIT");

    return updatePayment.rows[0];

  } catch (error) {

    await pool.query("ROLLBACK");

    throw error;

  }

}

async rejectPayment(
  paymentId: number,
  reason: string
) {

  const paymentResult = await pool.query(
`
SELECT
    payment_id,
    invoice_id,
    status
FROM payments
WHERE payment_id = $1;
`,
[
    paymentId
]
  );

  if (paymentResult.rowCount === 0) {
    throw new AppError(
      "Payment not found",
      404
    );
  }

  const payment = paymentResult.rows[0];

  if (payment.status !== "pending") {
    throw new AppError(
      "Only pending payment can be rejected",
      400
    );
  }

  const result = await pool.query(
`
UPDATE payments
SET
    status = 'failed',
    reject_reason = $2
WHERE payment_id = $1
RETURNING *;
`,
[
    paymentId,
    reason ?? null
]
  );

  return result.rows[0];

}

async createCashPayment(
  data: CreateCashPaymentData
) {

  const invoiceResult = await pool.query(
`
SELECT *
FROM invoices
WHERE invoice_id = $1;
`,
[
  data.invoice_id
]
  );

  if (invoiceResult.rowCount === 0) {
    throw new AppError(
      "Invoice not found",
      404
    );
  }

  const invoice = invoiceResult.rows[0];

  if (invoice.status === "paid") {
    throw new AppError(
      "Invoice already paid",
      400
    );
  }

  if (invoice.status === "cancelled") {
    throw new AppError(
      "Cancelled invoice cannot be paid",
      400
    );
  }

  if (
    Number(invoice.total_amount) !==
    Number(data.amount)
  ) {
    throw new AppError(
      "Invalid payment amount",
      400
    );
  }

  const existed = await pool.query(
`
SELECT *
FROM payments
WHERE
invoice_id = $1
AND status = 'pending';
`,
[
  data.invoice_id
]
  );

  if (existed.rowCount! > 0) {
    throw new AppError(
      "Invoice already has a pending payment",
      409
    );
  }

  const result = await pool.query(
`
INSERT INTO payments(
    invoice_id,
    amount,
    payment_method,
    payment_date,
    status
)
VALUES(
    $1,
    $2,
    'cash',
    NOW(),
    'success'
)
RETURNING *;
`,
[
    data.invoice_id,
    data.amount
]
  );

  await pool.query(
`
UPDATE invoices
SET status='paid'
WHERE invoice_id=$1;
`,
[
    data.invoice_id
]
  );

  return result.rows[0];

}


}
export default new PaymentService();