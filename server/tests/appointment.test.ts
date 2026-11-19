import test from "node:test";
import assert from "node:assert";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  availableSlotsQuerySchema,
  assignDoctorSchema,
} from "../src/validations/appointment.validation";

test("Appointment Validations: createAppointmentSchema", async (t) => {
  await t.test("hợp lệ khi truyền đủ thông tin đặt lịch với pet_id là số", () => {
    const valid = {
      pet_id: 1,
      service_id: 2,
      appointment_date: "2026-11-25",
      start_time: "09:30",
      reason: "Khám tổng quát định kỳ cho cún",
      notes: "Cún có tiền sử dị ứng thời tiết",
    };
    const result = createAppointmentSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.pet_id, 1);
      assert.strictEqual(result.data.appointment_date, "2026-11-25");
      assert.strictEqual(result.data.start_time, "09:30");
    }
  });

  await t.test("tự động chuyển đổi pet_id từ chuỗi số sang số nguyên dương", () => {
    const validStringId = {
      pet_id: "5",
      appointment_date: "2026-11-25",
      start_time: "14:00",
    };
    const result = createAppointmentSchema.safeParse(validStringId);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.pet_id, 5);
    }
  });

  await t.test("thất bại khi ngày hẹn sai định dạng (không phải YYYY-MM-DD)", () => {
    const invalidDate = {
      pet_id: 1,
      appointment_date: "25/11/2026",
      start_time: "09:00",
    };
    const result = createAppointmentSchema.safeParse(invalidDate);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("appointment_date")));
    }
  });

  await t.test("thất bại khi giờ hẹn sai định dạng (không phải HH:MM)", () => {
    const invalidTime = {
      pet_id: 1,
      appointment_date: "2026-11-25",
      start_time: "25:70",
    };
    const result = createAppointmentSchema.safeParse(invalidTime);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("start_time")));
    }
  });

  await t.test("thất bại khi lý do khám quá dài (> 500 ký tự)", () => {
    const invalidReason = {
      pet_id: 1,
      appointment_date: "2026-11-25",
      start_time: "10:00",
      reason: "a".repeat(501),
    };
    const result = createAppointmentSchema.safeParse(invalidReason);
    assert.strictEqual(result.success, false);
  });
});

test("Appointment Validations: cancelAppointmentSchema", async (t) => {
  await t.test("hợp lệ khi lý do hủy có ít nhất 2 ký tự", () => {
    const valid = {
      cancel_reason: "Bận đột xuất không thể đưa cún đi khám",
    };
    const result = cancelAppointmentSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
  });

  await t.test("thất bại khi lý do hủy rỗng hoặc dưới 2 ký tự", () => {
    const invalid = {
      cancel_reason: "A",
    };
    const result = cancelAppointmentSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("cancel_reason")));
    }
  });
});

test("Appointment Validations: availableSlotsQuerySchema", async (t) => {
  await t.test("hợp lệ khi truyền pet_id và date định dạng YYYY-MM-DD", () => {
    const valid = {
      pet_id: "3",
      date: "2026-11-26",
    };
    const result = availableSlotsQuerySchema.safeParse(valid);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.pet_id, 3);
      assert.strictEqual(result.data.date, "2026-11-26");
    }
  });

  await t.test("thất bại khi pet_id <= 0 hoặc không phải số", () => {
    const invalid = {
      pet_id: -1,
      date: "2026-11-26",
    };
    const result = availableSlotsQuerySchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
  });
});

test("Appointment Validations: assignDoctorSchema", async (t) => {
  await t.test("hợp lệ khi doctor_id là số nguyên dương", () => {
    const valid = { doctor_id: 12 };
    const result = assignDoctorSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
  });

  await t.test("thất bại khi doctor_id không hợp lệ (chuỗi không phải số)", () => {
    const invalid = { doctor_id: "abc" };
    const result = assignDoctorSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
  });
});
