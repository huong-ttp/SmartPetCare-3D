import test from "node:test";
import assert from "node:assert";
import {
  shiftRangeQuerySchema,
  createShiftSchema,
  updateShiftSchema,
} from "../src/validations/shift.validation";

test("Shift Validations: shiftRangeQuerySchema", async (t) => {
  await t.test("hợp lệ khi truyền khoảng thời gian hợp lệ trong vòng 92 ngày", () => {
    const valid = {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      doctor_id: 2,
    };
    const result = shiftRangeQuerySchema.safeParse(valid);
    assert.strictEqual(result.success, true);
  });

  await t.test("báo lỗi khi endDate nhỏ hơn startDate", () => {
    const invalid = {
      startDate: "2026-10-31",
      endDate: "2026-10-01",
    };
    const result = shiftRangeQuerySchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("endDate")));
    }
  });

  await t.test("báo lỗi khi khoảng thời gian vượt quá 92 ngày", () => {
    const invalid = {
      startDate: "2026-01-01",
      endDate: "2026-06-01", // ~150 ngày
    };
    const result = shiftRangeQuerySchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.message.includes("92 ngày")));
    }
  });
});

test("Shift Validations: createShiftSchema", async (t) => {
  await t.test("hợp lệ khi phân ca trực sáng và chiều cho bác sĩ", () => {
    const valid = {
      doctor_id: 12,
      dates: ["2026-11-20", "2026-11-21"],
      shift_types: ["morning", "afternoon"],
      room: "Phòng khám 101",
      max_patients: 8,
      is_off: false,
    };
    const result = createShiftSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.doctor_id, 12);
      assert.strictEqual(result.data.max_patients, 8);
    }
  });

  await t.test("từ chối khi danh sách ngày rỗng", () => {
    const invalid = {
      doctor_id: 12,
      dates: [],
      shift_types: ["morning"],
    };
    const result = createShiftSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("dates")));
    }
  });

  await t.test("từ chối ca trực không hợp lệ (ngoài morning, afternoon)", () => {
    const invalid = {
      doctor_id: 12,
      dates: ["2026-11-20"],
      shift_types: ["night"],
    };
    const result = createShiftSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
  });

  await t.test("từ chối max_patients vượt quá giới hạn 100", () => {
    const invalid = {
      doctor_id: 12,
      dates: ["2026-11-20"],
      shift_types: ["morning"],
      max_patients: 150,
    };
    const result = createShiftSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("max_patients")));
    }
  });
});

test("Shift Validations: updateShiftSchema", async (t) => {
  await t.test("cho phép cập nhật trạng thái nghỉ phép (is_off = true) và ghi chú", () => {
    const update = {
      is_off: true,
      note: "Bác sĩ bận công tác hội thảo chuyên môn",
      max_patients: 0,
    };
    const result = updateShiftSchema.safeParse(update);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.is_off, true);
    }
  });

  await t.test("từ chối định dạng giờ không đúng HH:mm", () => {
    const invalid = {
      start_time: "8:00 AM",
    };
    const result = updateShiftSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
  });
});
