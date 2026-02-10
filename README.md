# 📅 AI Scheduling Calendar - IT3150 Project 1

**Đề tài:** Xây dựng ứng dụng Calendar với tính năng AI Scheduling  
**Sinh viên:** Đỗ Ngọc Hoàng Hải - 20230026  
**Giảng viên hướng dẫn:** ThS. Nguyễn Thanh Hùng  
**Mã học phần:** IT3150 - Project 1  

---

## 📖 Giới thiệu (Introduction)

**AI Scheduling Calendar** là ứng dụng quản lý thời gian cá nhân Full-stack, lấy cảm hứng từ Google Calendar nhưng được bổ sung tính năng **AI Scheduling**.

Hệ thống tập trung giải quyết bài toán quen thuộc của sinh viên: cân bằng giữa **lịch học cố định**, **deadline bài tập**, và **thời gian cá nhân**.

Thay vì chỉ ghi nhận sự kiện một cách thụ động, ứng dụng sử dụng **Google Gemini AI** để:
- Phân tích các khoảng thời gian trống
- Xem xét deadline, mức độ ưu tiên và thói quen người dùng
- Chủ động đề xuất lịch làm việc tối ưu

🔗 **Mã nguồn:**  
https://github.com/HaiDNH20230026/Project1

---

## 🚀 Tính năng nổi bật (Key Features)

### 1. 🤖 AI Scheduling (Lên lịch thông minh)

Đây là tính năng cốt lõi của hệ thống:

- **Tự động đề xuất lịch:**  
  Hệ thống quét các slot trống trong ngày (08:00 – 23:00) và sử dụng AI để sắp xếp các Task có deadline.

- **Explainable AI (AI có giải thích):**  
  Mỗi đề xuất đều đi kèm lý do bằng tiếng Việt  
  *(ví dụ: “Buổi sáng tập trung cao”, “Tránh giờ ăn trưa”)* giúp người dùng dễ hiểu và tin tưởng.

- **Multi-model Fallback:**  
  Cơ chế đảm bảo hệ thống luôn hoạt động ổn định với 4 tầng AI + 1 tầng thuật toán truyền thống:
  1. `gemini-2.5-flash`
  2. `gemini-2.5-flash-lite`
  3. `gemini-2.0-flash`
  4. `gemma-3-27b-it`
  5. **Heuristic Algorithm** (fallback khi mất mạng hoặc hết quota)

---

### 2. 🗓️ Quản lý Lịch (Calendar Management)

- CRUD sự kiện (Tạo / Xem / Sửa / Xóa)
- Hỗ trợ sự kiện lặp lại (Daily, Weekly, Monthly…)
- Nhiều chế độ xem: Day, Week, Month, Year
- Giao diện hỗ trợ **Dark / Light theme**
- Mini calendar sidebar tiện lợi

---

### 3. ✅ Quản lý Công việc (Task Management)

- Gán mức độ ưu tiên: **HIGH / MEDIUM / LOW**
- Quản lý trạng thái và deadline
- Liên kết chặt chẽ giữa **Task** và **AI-generated Events**

---

### 4. 🔐 Bảo mật (Security)

- Đăng nhập / Đăng ký bằng Email & Password
- Đăng nhập nhanh với **Google OAuth2**
- **JWT Authentication** (Stateless – không lưu session)

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ | Vai trò |
|----------|----------|--------|
| **Backend** | Spring Boot 3.4 (Java 17+) | Core Backend Framework |
| | Spring Security + JWT | Authentication & Authorization |
| | Spring Data JPA | ORM / Database Access |
| | Google Gemini SDK 1.0 | AI Scheduling Engine |
| **Frontend** | React 19 + TypeScript | SPA Framework |
| | Material UI (MUI) 7 | UI Component Library |
| | Axios | HTTP Client |
| | React Router DOM 7 | Client-side Routing |
| **Database** | MySQL | Relational Database |
| **Build Tool** | Gradle | Backend Build Tool |

---

## 🏗️ Kiến trúc hệ thống (Architecture)

Hệ thống tuân theo mô hình **Client – Server 3 tầng**:

1. **Controller Layer**  
   Xử lý REST API requests

2. **Service Layer**  
   Chứa business logic (AI Scheduling, Task logic)

3. **Repository Layer**  
   Giao tiếp với MySQL thông qua Spring Data JPA

---

## ⚙️ Hướng dẫn cài đặt (Installation Guide)

### 1. Yêu cầu tiên quyết (Prerequisites)

- JDK 17 trở lên
- Node.js v18+ & npm/yarn
- MySQL Server
- Google Cloud Project (OAuth2 Client ID & Gemini API Key)

---

### 2. Thiết lập Database

CREATE DATABASE calendar_app;

### 3. Cài đặt Backend (Spring Boot)

- Clone repository và di chuyển vào thư mục backend.

- Cấu hình file src/main/resources/application.properties:
#### Database Config
spring.datasource.url=jdbc:mysql://localhost:3306/calendar_app
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

#### JWT Secret
application.security.jwt.secret-key=YOUR_VERY_LONG_SECRET_KEY

#### Google Gemini AI
gemini.api.key=YOUR_GEMINI_API_KEY

#### Google OAuth2
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET

- Chạy Backend:
./gradlew bootRun
- Backend chạy tại: http://localhost:8080

### 4. Cài đặt Frontend (React)

cd frontend
npm install
hoặc
yarn install

- Chạy Frontend:
npm start
hoặc
yarn start

- Frontend chạy tại: http://localhost:3000
