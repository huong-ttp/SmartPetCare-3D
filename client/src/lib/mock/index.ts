/**
 * lib/mock/index.ts
 * Mock data cho toàn bộ các entity — dùng khi backend chưa sẵn sàng.
 */

import type { User } from "@/types/user.type";
import type { Pet } from "@/types/pet.type";
import type { Service } from "@/types/service.type";
import type { Appointment } from "@/types/appointment.type";
import type { Invoice, InvoiceItem } from "@/types/invoice.type";
import type { Payment } from "@/types/payment.type";
import type { VaccineType, PetVaccination } from "@/types/vaccination.type";
import type { PetHealthLog } from "@/types/health-log.type";
import type { MedicalRecord } from "@/types/medical-record.type";
import type { Notification } from "@/types/notification.type";

// ─── USERS ───────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    full_name: "Nguyễn Văn An",
    email: "owner@example.com",
    phone: "0901234567",
    role: "owner",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "u2",
    full_name: "BS. Trần Thị Hoa",
    email: "doctor@example.com",
    phone: "0912345678",
    role: "doctor",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "u3",
    full_name: "Admin SmartPetCare",
    email: "admin@example.com",
    role: "admin",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

// ─── PETS ─────────────────────────────────────────────────────────────────────

export const MOCK_PETS: Pet[] = [
  {
    id: "p1",
    owner_id: "u1",
    name: "Mochi",
    species: "dog",
    breed: "Poodle",
    gender: "male",
    date_of_birth: "2022-03-15",
    color: "Trắng kem",
    microchip_number: "985141004826542",
    weight_kg: 4.5,
    is_neutered: true,
    allergies: ["Phấn hoa", "Thức ăn chứa gluten"],
    chronic_conditions: [],
    notes: "Mochi rất năng động, thích chạy nhảy. Cần kết hợp vủng với chế độ ăn nhẹ nhàng.",
    created_at: "2025-01-05T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
  },
  {
    id: "p2",
    owner_id: "u1",
    name: "Kitty",
    species: "cat",
    breed: "British Shorthair",
    gender: "female",
    date_of_birth: "2021-07-20",
    color: "Xám xanh",
    microchip_number: "985141004826543",
    weight_kg: 3.8,
    is_neutered: true,
    allergies: [],
    chronic_conditions: ["Viêm đường tiết niệu mãn tính (FIC)"],
    notes: "Kitty cần uống nhiều nước. Kiểm tra đường niệu định kỳ 6 tháng/lần.",
    created_at: "2025-01-10T00:00:00Z",
    updated_at: "2025-07-01T00:00:00Z",
  },
  {
    id: "p3",
    owner_id: "u1",
    name: "Bunny",
    species: "rabbit",
    breed: "Holland Lop",
    gender: "female",
    date_of_birth: "2024-01-05",
    color: "Trắng và nâu",
    weight_kg: 1.9,
    is_neutered: false,
    allergies: [],
    chronic_conditions: [],
    notes: "",
    created_at: "2025-03-15T00:00:00Z",
    updated_at: "2025-08-01T00:00:00Z",
  },
];

// ─── SERVICES ────────────────────────────────────────────────────────────────

export const MOCK_SERVICES: Service[] = [
  { id: "sv1", name: "Khám tổng quát", price: 150_000, duration_minutes: 30, is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "sv2", name: "Tiêm phòng", price: 200_000, duration_minutes: 20, is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "sv3", name: "Triệt sản", price: 1_500_000, duration_minutes: 90, is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "sv4", name: "Siêu âm", price: 300_000, duration_minutes: 30, is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "sv5", name: "Cắt móng + tắm grooming", price: 250_000, duration_minutes: 60, is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
];

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    pet_id: "p1",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    scheduled_at: "2025-08-15T09:00:00Z",
    status: "confirmed",
    created_at: "2025-08-10T00:00:00Z",
    updated_at: "2025-08-10T00:00:00Z",
  },
  {
    id: "a2",
    pet_id: "p2",
    owner_id: "u1",
    service_id: "sv2",
    doctor_id: null, // chưa gán bác sĩ
    scheduled_at: "2025-09-01T14:00:00Z",
    status: "confirmed",
    created_at: "2025-08-25T00:00:00Z",
    updated_at: "2025-08-25T00:00:00Z",
  },
  {
    id: "a3",
    pet_id: "p1",
    owner_id: "u1",
    service_id: "sv1",
    doctor_id: "u2",
    scheduled_at: "2025-07-10T10:00:00Z",
    status: "completed",
    created_at: "2025-07-05T00:00:00Z",
    updated_at: "2025-07-10T11:00:00Z",
  },
];

// ─── MEDICAL RECORDS ──────────────────────────────────────────────────────────

export const MOCK_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: "mr1",
    appointment_id: "a3",
    pet_id: "p1",
    doctor_id: "u2",
    weight_at_visit: 4.5,
    temperature: 38.5,
    diagnosis: "Sức khỏe tốt, cần tiêm nhắc vaccine dại tháng tới",
    treatment: "Không cần điều trị",
    created_at: "2025-07-10T10:30:00Z",
    updated_at: "2025-07-10T10:30:00Z",
  },
];

// ─── VACCINE TYPES ────────────────────────────────────────────────────────────

export const MOCK_VACCINE_TYPES: VaccineType[] = [
  {
    id: "vt1",
    name: "Vaccine Dại",
    description: "Phòng bệnh dại cho chó mèo",
    recommended_interval_days: 365,
    applicable_species: ["dog", "cat"],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "vt2",
    name: "Vaccine 7 bệnh (chó)",
    description: "Phòng Parvovirus, Distemper, Hepatitis, ...",
    recommended_interval_days: 365,
    applicable_species: ["dog"],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "vt3",
    name: "Vaccine 4 bệnh (mèo)",
    description: "Phòng Herpesvirus, Calicivirus, Panleukopenia, Chlamydophila",
    recommended_interval_days: 365,
    applicable_species: ["cat"],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

// ─── PET VACCINATIONS ─────────────────────────────────────────────────────────

export const MOCK_PET_VACCINATIONS: PetVaccination[] = [
  {
    id: "pv1",
    pet_id: "p1",
    vaccine_type_id: "vt1",
    doctor_id: "u2",
    appointment_id: "a3",
    date_administered: "2025-07-10",
    next_due_date: "2026-07-10", // = date_administered + 365 ngày
    lot_number: "LOT2025071",
    created_at: "2025-07-10T10:30:00Z",
    updated_at: "2025-07-10T10:30:00Z",
  },
];

// ─── HEALTH LOGS ──────────────────────────────────────────────────────────────

export const MOCK_HEALTH_LOGS: PetHealthLog[] = [
  {
    id: "hl1",
    pet_id: "p1",
    logged_by: "u1",
    log_date: "2025-08-20",
    weight_kg: 4.6,
    appetite: "normal",
    activity_level: "normal",
    vomiting: false,
    notes: "Ăn uống bình thường, vui vẻ",
    created_at: "2025-08-20T08:00:00Z",
    updated_at: "2025-08-20T08:00:00Z",
  },
];

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1",
    appointment_id: "a3",
    owner_id: "u1",
    status: "paid",
    total_amount: 350_000,
    issued_at: "2025-07-10T11:00:00Z",
    created_at: "2025-07-10T11:00:00Z",
    updated_at: "2025-07-10T11:30:00Z",
  },
];

export const MOCK_INVOICE_ITEMS: InvoiceItem[] = [
  {
    id: "ii1",
    invoice_id: "inv1",
    service_id: "sv1",
    description: "Khám tổng quát",
    quantity: 1,
    unit_price: 150_000,
    subtotal: 150_000,
  },
  {
    id: "ii2",
    invoice_id: "inv1",
    service_id: "vt1",
    description: "Vaccine Dại",
    quantity: 1,
    unit_price: 200_000,
    subtotal: 200_000,
  },
];

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay1",
    invoice_id: "inv1",
    owner_id: "u1",
    amount: 350_000,
    payment_method: "cash",
    status: "success",
    paid_at: "2025-07-10T11:30:00Z",
    created_at: "2025-07-10T11:30:00Z",
    updated_at: "2025-07-10T11:30:00Z",
  },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    user_id: "u1",
    type: "appointment_confirmed",
    title: "Lịch hẹn đã được xác nhận",
    message: "Lịch khám cho Mochi lúc 9:00 ngày 15/08 đã được xác nhận.",
    is_read: true,
    reference_id: "a1",
    reference_type: "appointment",
    created_at: "2025-08-10T08:00:00Z",
  },
  {
    id: "n2",
    user_id: "u1",
    type: "vaccination_reminder",
    title: "Nhắc nhở tiêm phòng",
    message: "Mochi cần tiêm Vaccine Dại trước ngày 10/07/2026.",
    is_read: false,
    created_at: "2025-08-25T07:00:00Z",
  },
];
