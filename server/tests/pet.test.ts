import test from "node:test";
import assert from "node:assert";
import { createPetSchema, updatePetSchema } from "../src/validations/pet.validation";
import { createHealthLogSchema } from "../src/validations/healthLog.validation";

test("Pet Validations: createPetSchema", async (t) => {
  await t.test("hợp lệ khi truyền đủ tên và loài thú cưng", () => {
    const valid = {
      name: "Milo",
      species: "Dog",
      breed: "Golden Retriever",
      gender: "Male",
      weight_kg: 15.5,
      color: "Vàng kim",
      microchip_id: "MC-987654",
    };
    const result = createPetSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.name, "Milo");
      assert.strictEqual(result.data.species, "Dog");
      assert.strictEqual(result.data.weight_kg, 15.5);
    }
  });

  await t.test("tự động gán giới tính mặc định là unknown khi không cung cấp", () => {
    const minimal = {
      name: "Kitty",
      species: "Cat",
    };
    const result = createPetSchema.safeParse(minimal);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.gender, "unknown");
    }
  });

  await t.test("thất bại khi thiếu name hoặc name để trống", () => {
    const invalid = {
      name: "",
      species: "Dog",
    };
    const result = createPetSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("name")));
    }
  });

  await t.test("thất bại khi thiếu loài (species)", () => {
    const invalid = {
      name: "Lucky",
    };
    const result = createPetSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("species")));
    }
  });

  await t.test("hỗ trợ ép kiểu weight_kg từ chuỗi số sang number", () => {
    const stringWeight = {
      name: "Max",
      species: "Dog",
      weight_kg: "12.8",
    };
    const result = createPetSchema.safeParse(stringWeight);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.weight_kg, 12.8);
    }
  });

  await t.test("từ chối giới tính không thuộc danh mục cho phép", () => {
    const invalidGender = {
      name: "Bello",
      species: "Dog",
      gender: "Alien",
    };
    const result = createPetSchema.safeParse(invalidGender);
    assert.strictEqual(result.success, false);
  });
});

test("Pet Validations: updatePetSchema", async (t) => {
  await t.test("cho phép cập nhật từng phần thông tin (partial update)", () => {
    const update = {
      weight_kg: 18.2,
      special_notes: "Vừa phục hồi sau phẫu thuật, hạn chế vận động mạnh",
    };
    const result = updatePetSchema.safeParse(update);
    assert.strictEqual(result.success, true);
  });

  await t.test("từ chối cân nặng nhỏ hơn hoặc bằng 0", () => {
    const negativeWeight = {
      weight_kg: -5,
    };
    const result = updatePetSchema.safeParse(negativeWeight);
    assert.strictEqual(result.success, false);
  });
});

test("Health Log Validations: createHealthLogSchema", async (t) => {
  await t.test("hợp lệ khi gửi các chỉ số sức khỏe thường ngày theo đúng cấu trúc body", () => {
    const validPayload = {
      body: {
        pet_id: 1,
        weight_kg: 15.2,
        height_cm: 45,
        log_date: "2026-10-15",
      },
    };
    const result = createHealthLogSchema.safeParse(validPayload);
    assert.strictEqual(result.success, true);
  });

  await t.test("thất bại khi thiếu pet_id hoặc weight_kg không dương", () => {
    const invalidPayload = {
      body: {
        pet_id: 1,
        weight_kg: -2,
        log_date: "2026-10-15",
      },
    };
    const result = createHealthLogSchema.safeParse(invalidPayload);
    assert.strictEqual(result.success, false);
  });
});
