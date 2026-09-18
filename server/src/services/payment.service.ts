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

class PaymentService {
    async createPayment(
  ownerId: number,
  data: CreatePaymentData
) {
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
[
    data.invoice_id,
    ownerId
]
);

if (invoiceResult.rowCount === 0) {
    throw new AppError(
        "Invoice not found",
        404
    );
}
const invoice = invoiceResult.rows[0];
if (
    Number(invoice.total_amount) !==
    Number(data.amount)
) {
    throw new AppError(
        "Invalid payment amount",
        400
    );
}
if (
    invoice.status === "paid"
) {
    throw new AppError(
        "Invoice already paid",
        400
    );
}
if (
    invoice.status === "cancelled"
) {
    throw new AppError(
        "Cancelled invoice cannot be paid",
        400
    );
}
if (
    data.payment_method === "bank_transfer" &&
    !data.transaction_ref
) {
    throw new AppError(
        "Transaction reference is required",
        400
    );
}
if (
    !["cash","bank_transfer"].includes(
        data.payment_method
    )
) {
    throw new AppError(
        "Invalid payment method",
        400
    );
}
const existed = await pool.query(
`
SELECT *
FROM payments
WHERE
invoice_id=$1
AND status='pending';
`,
[
    data.invoice_id
]
);

if (existed.rowCount! > 0) {
    throw new AppError(
        "Payment is already pending",
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
    transaction_ref,
    status
)
VALUES(
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
    data.invoice_id,
    data.amount,
    data.payment_method,
    data.transaction_ref ?? null
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
}
export default new PaymentService();