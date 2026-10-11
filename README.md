# SmartPetCare 3D 🐾🏥

> **SmartPetCare-3D** là nền tảng quản lý chăm sóc y tế thú cưng toàn diện (Veterinary Healthcare Management Platform) kết hợp đồ họa không gian 3D tương tác trực quan (Three.js & React Three Fiber).

---

## 👥 Nhóm phát triển (Members)
- **Huong**
- **Long**

---

## 📌 Các tính năng chính (Core Features)

1. **Giao diện 3D Trực quan (Interactive 3D):**
   - Mô hình thú cưng 3D hiển thị thể trạng sức khỏe.
   - 3D Hospital Clinic Floor Plan và Doctor Medical Badges.

2. **Quản lý Ca trực Bác sĩ (Doctor Shifts):**
   - **Admin:** Phân ca làm việc linh hoạt theo ngày/tuần (`Ca sáng: 08:00 - 12:00`, `Ca chiều: 13:00 - 17:00`), giới hạn công suất bệnh nhân (`max_patients`), phân bổ phòng khám (`room`), đánh dấu nghỉ phép (`is_off`).
   - **Doctor:** Theo dõi lịch trực tuần, lộ trình bệnh nhân trong ngày, nhận diện ca trực đang hoạt động (`active`) và thống kê công suất lấp đầy.
   - **Ràng buộc nghiệp vụ:** Admin chỉ được gán bác sĩ cho lịch hẹn khi bác sĩ có ca trực hợp lệ, không nghỉ phép và chưa vượt quá công suất tối đa. Tự động bảo vệ dữ liệu, ngăn xóa ca trực khi đã có lịch hẹn xác nhận.

3. **Trung tâm Thông báo Hợp nhất (Unified Notification Center):**
   - Hợp nhất thông báo nhắc hẹn, lịch tiêm phòng, kiểm tra định kỳ và cập nhật hệ thống tại `/notifications`.
   - Lọc nhanh theo danh mục (`Tất cả`, `Chưa đọc`, `Nhắc lịch`, `Lịch hẹn`, `Tiêm chủng`, `Khám định kỳ`, `Thanh toán`, `Hệ thống`).
   - Tự động gửi thông báo đến bác sĩ khi được phân ca mới, điều chỉnh/hủy ca hoặc khi được gán lịch hẹn khám.

4. **Quản lý Thú cưng & Bệnh án Điện tử:**
   - Hồ sơ bệnh án điện tử (Medical Records), nhật ký sức khỏe (Health Logs).
   - Sổ tiêm chủng vắc-xin theo dõi theo liều (Vaccinations & Vaccine Types).

5. **Lịch hẹn & Quy trình Khám chữa bệnh:**
   - Chủ nuôi đặt lịch theo dịch vụ khám.
   - Admin duyệt và phân công bác sĩ phụ trách.
   - Bác sĩ tiếp nhận ca khám, chẩn đoán, ghi chép bệnh án và chỉ định tiêm chủng.

6. **Hóa đơn & Thanh toán (Billing & Invoices):**
   - Xuất hóa đơn chi tiết dịch vụ, theo dõi trạng thái thanh toán.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ chính |
|---|---|
| **Client** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Three.js, React Three Fiber (`@react-three/fiber`), Framer Motion, Axios, Lucide Icons |
| **Server** | Node.js, Express.js (v5), TypeScript, PostgreSQL Client (`pg`), Zod, JWT, Nodemailer |
| **Database** | PostgreSQL (Neon Database Serverless / Docker PostgreSQL) |
| **Dịch vụ ngoài** | Cloudinary (Lưu trữ ảnh tải lên) |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node 20 LTS).
- **npm**: Đi kèm với Node.js.
- **PostgreSQL**: Cơ sở dữ liệu Neon Cloud hoặc PostgreSQL cài đặt cục bộ.

---

### 2. Cài đặt Backend (Server)

```bash
# 1. Di chuyển vào thư mục server
cd server

# 2. Cài đặt dependencies
npm install

# 3. Tạo file cấu hình môi trường từ mẫu
cp .env.example .env
# (Chỉnh sửa chuỗi DATABASE_URL, JWT_SECRET, và các biến tương ứng trong .env)

# 4. Chạy migration để đồng bộ cấu trúc Database
npm run migrate

# 5. Khởi chạy dev server (cổng 8000)
npm run dev
```

---

### 3. Cài đặt Frontend (Client)

```bash
# 1. Di chuyển vào thư mục client
cd client

# 2. Cài đặt dependencies
npm install

# 3. Tạo file cấu hình môi trường từ mẫu
cp .env.example .env.local
# (Mặc định NEXT_PUBLIC_API_URL=http://localhost:8000/api)

# 4. Khởi chạy dev server (cổng 3000)
npm run dev

# 5. Build kiểm tra production
npm run build
```

Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000).

---

## 🗄 Cấu trúc Cơ sở dữ liệu & Migrations

Dự án quản lý database schema bằng các file SQL thuần trong thư mục `server/migrations/`:

```
server/migrations/
├── 001_initial_schema.sql             # Tạo toàn bộ các bảng cơ sở ban đầu
├── 002_drop_doctor_id_from_appointments.sql # Tách việc gán bác sĩ cho admin
├── 003_create_doctor_shifts.sql       # Bảng doctor_shifts quản lý ca trực bác sĩ
└── schema.sql                         # Bản hợp nhất toàn bộ schema mới nhất
```

Lệnh chạy migration:
```bash
cd server
npm run migrate
```
Script `server/src/scripts/migrate.ts` sẽ tự động quét các file migration theo thứ tự, thực thi và lưu vết vào bảng `_migrations`.

---

## 🔐 Phân quyền Người dùng (Roles & Access)

Hệ thống hỗ trợ 3 nhóm vai trò với thanh điều hướng riêng:

| Vai trò | Phạm vi truy cập chính |
|---|---|
| **Owner** (Chủ nuôi) | `/dashboard`, `/pets`, `/appointments`, `/services`, `/invoices`, `/notifications` |
| **Doctor** (Bác sĩ thú y) | `/doctor/dashboard`, `/doctor/appointments`, `/doctor/schedule`, `/doctor/patients`, `/doctor/medical-records`, `/doctor/health-logs`, `/notifications` |
| **Admin** (Quản trị viên) | `/admin/dashboard`, `/admin/shifts`, `/admin/users`, `/admin/appointments`, `/admin/services`, `/admin/medical-records`, `/admin/invoices`, `/admin/notifications` |

---

## 📝 Giấy phép (License)
Dự án phục vụ mục đích học tập và thực tập kỹ thuật tại SmartPetCare.
