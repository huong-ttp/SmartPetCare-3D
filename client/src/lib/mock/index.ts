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
  // Examination
  {
    id: "sv1",
    name: "Khám sức khỏe tổng quát",
    description: "Kiểm tra lâm sàng mắt, tai, mũi, họng, tim phổi, cân nặng và tư vấn chế độ dinh dưỡng, vận động tối ưu cho thú cưng.",
    price: 150_000,
    duration_minutes: 30,
    category: "Examination",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sv4",
    name: "Siêu âm màu Doppler 4D",
    description: "Chẩn đoán hình ảnh ổ bụng, phát hiện dị vật, khối u sớm, kiểm tra thai kỳ và các bệnh lý nội tạng với độ chính xác cao.",
    price: 300_000,
    duration_minutes: 30,
    category: "Examination",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sv6",
    name: "Xét nghiệm máu & sinh hóa toàn diện",
    description: "Đánh giá chức năng gan, thận, đường huyết, điện giải và sàng lọc ký sinh trùng đường máu bằng máy sinh hóa tự động.",
    price: 350_000,
    duration_minutes: 25,
    category: "Examination",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },

  // Vaccination
  {
    id: "sv2",
    name: "Tiêm phòng Dại định kỳ (Rabisin)",
    description: "Vaccine phòng ngừa bệnh dại đạt chuẩn quốc tế, kích hoạt miễn dịch nhanh, cấp chứng nhận tiêm chủng hợp lệ.",
    price: 80_000,
    duration_minutes: 15,
    category: "Vaccination",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sv7",
    name: "Tiêm phòng Vaccine 7 bệnh cho Chó",
    description: "Bảo vệ chó cưng khỏi 7 bệnh nguy hiểm: Care, Parvovirus, Viêm gan truyền nhiễm, Ho cũi chó, Phó cúm và 2 chủng Leptospira.",
    price: 220_000,
    duration_minutes: 20,
    category: "Vaccination",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sv8",
    name: "Tiêm phòng Vaccine 4 bệnh cho Mèo",
    description: "Phòng bệnh giảm bạch cầu (FPV), viêm mũi khí quản truyền nhiễm (FHV-1), Calicivirus (FCV) và Chlamydia psittaci ở mèo.",
    price: 250_000,
    duration_minutes: 20,
    category: "Vaccination",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },

  // Surgery
  {
    id: "sv3",
    name: "Phẫu thuật triệt sản chó mèo an toàn",
    description: "Áp dụng kỹ thuật gây mê khí dung an toàn, đường mổ thẩm mỹ nhỏ mau lành, bao gồm trọn gói thuốc kháng viêm, giảm đau hậu phẫu.",
    price: 1_200_000,
    duration_minutes: 90,
    category: "Surgery",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sv9",
    name: "Cạo vôi răng & Đánh bóng men răng",
    description: "Làm sạch mảng bám vôi răng bằng sóng siêu âm, điều trị viêm nướu, ngăn ngừa rụng răng sớm và khử mùi hôi miệng dưới tiền mê nhẹ.",
    price: 450_000,
    duration_minutes: 45,
    category: "Surgery",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },

  // Grooming
  {
    id: "sv5",
    name: "Combo Tắm Spa & Cắt tỉa tạo kiểu",
    description: "Tắm sạch dưỡng lông mềm mượt, vắt tuyến hôi, sấy đánh bông lông và cắt tỉa tạo kiểu theo yêu cầu bởi chuyên viên grooming.",
    price: 250_000,
    duration_minutes: 60,
    category: "Grooming",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sv10",
    name: "Vệ sinh toàn diện (Móng - Tai - Đệm bàn chân)",
    description: "Cắt và dũa móng an toàn, nhổ lông tai & vệ sinh sạch dịch tai, cạo lông đệm chân chống trơn trượt và cạo lông vệ sinh hậu môn.",
    price: 120_000,
    duration_minutes: 30,
    category: "Grooming",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },

  // Other
  {
    id: "sv11",
    name: "Khách sạn thú cưng VIP (Lưu trú 24h)",
    description: "Phòng nghỉ riêng biệt có điều hòa 24/7, camera theo dõi trực tuyến cho phụ huynh, thực đơn hạt cao cấp và chế độ vui chơi hàng ngày.",
    price: 200_000,
    duration_minutes: 1440,
    category: "Other",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "sv12",
    name: "Dịch vụ đưa đón thú cưng tận nơi",
    description: "Xe chuyên dụng đưa đón an toàn, thoải mái cho bé trong bán kính 10km, tài xế kinh nghiệm và hỗ trợ giữ bé chu đáo.",
    price: 100_000,
    duration_minutes: 45,
    category: "Other",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
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
    record_id: 1,
    appointment_id: "a3",
    pet_id: "p1",
    doctor_id: "u2",
    doctor_name: "BS. Trần Thị Hoa",
    pet_name: "Mochi",
    weight_at_visit: 4.5,
    temperature: 38.5,
    record_date: "2025-07-10T10:30:00Z",
    diagnosis: "Sức khỏe tốt, cần tiêm nhắc vaccine dại hàng năm. Da lông sạch sẽ, không phát hiện ve rận hay nấm.",
    treatment: "Khám lâm sàng toàn diện, kiểm tra tai mắt mũi họng và thực hiện tiêm phòng vaccine dại định kỳ.",
    prescription: "Không cần kê đơn thuốc kháng sinh. Bổ sung vitamin tổng hợp cho lông và tăng đề kháng 1 viên/ngày trong 2 tuần.",
    notes: "Theo dõi phản ứng sau tiêm trong 24 giờ đầu. Giữ ấm cho bé và tránh tắm 3 ngày tới.",
    service_name: "Khám tổng quát & Tiêm phòng",
    appointment_date: "2025-07-10",
    appointment_start_time: "10:00",
    vaccinations: [
      {
        vaccination_id: 1,
        id: "pv1",
        pet_id: "p1",
        vaccine_type_id: 1,
        medical_record_id: "mr1",
        vaccine_name: "Vaccine Dại (Rabies Vaccine)",
        vaccine_description: "Phòng bệnh dại cho chó mèo",
        batch_number: "RAB-2025-089A",
        date_administered: "2025-07-10",
        next_due_date: "2026-07-10",
      },
    ],
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
