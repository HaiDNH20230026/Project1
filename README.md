# 📅 AI Scheduling Calendar - IT3150 Project 1

> [cite_start]**Đề tài:** Xây dựng ứng dụng Calendar với tính năng AI Scheduling [cite: 7]  
> [cite_start]**Sinh viên:** Đỗ Ngọc Hoàng Hải - 20230026 [cite: 11]  
> [cite_start]**Giảng viên hướng dẫn:** Thầy Nguyễn Thanh Hùng [cite: 10]  
> [cite_start]**Mã học phần:** IT3150 - Project 1 [cite: 9]

---

## 📖 Giới thiệu (Introduction)

**AI Scheduling Calendar** là ứng dụng quản lý thời gian cá nhân Full-stack, lấy cảm hứng từ Google Calendar nhưng được bổ sung tính năng **AI Scheduling**. [cite_start]Hệ thống giải quyết bài toán khó khăn của sinh viên trong việc cân bằng giữa lịch học cố định và các deadline bài tập lớn[cite: 19, 31].

[cite_start]Thay vì chỉ ghi nhận sự kiện một cách thụ động, ứng dụng sử dụng **Google Gemini AI** để chủ động phân tích khoảng thời gian trống và đề xuất lịch làm việc tối ưu dựa trên mức độ ưu tiên và thói quen của người dùng[cite: 20, 36].

[cite_start]🔗 **Mã nguồn:** [https://github.com/HaiDNH20230026/Project1](https://github.com/HaiDNH20230026/Project1) [cite: 26]

---

## 🚀 Tính năng nổi bật (Key Features)

### 1. 🤖 AI Scheduling (Lên lịch thông minh)
[cite_start]Đây là tính năng cốt lõi của hệ thống[cite: 123]:
* [cite_start]**Tự động đề xuất:** Hệ thống quét các slot trống (8:00 - 23:00) và dùng AI để sắp xếp lịch cho các Task có deadline[cite: 129].
* [cite_start]**Explainable AI (AI giải thích):** Mỗi đề xuất đều đi kèm lý do bằng tiếng Việt (VD: "Buổi sáng tập trung cao", "Tránh giờ ăn trưa") giúp người dùng tin tưởng[cite: 163, 164].
* [cite_start]**Multi-model Fallback:** Cơ chế đảm bảo hệ thống luôn hoạt động với 4 tầng models + 1 tầng thuật toán thường[cite: 137, 138]:
    1.  `gemini-2.5-flash`
    2.  `gemini-2.5-flash-lite`
    3.  `gemini-2.0-flash`
    4.  `gemma-3-27b-it`
    5.  [cite_start]*Heuristic Algorithm* (Fallback khi mất mạng/hết quota)[cite: 153].

### 2. 🗓️ Quản lý Lịch (Calendar Management)
* [cite_start]**CRUD Sự kiện:** Tạo, xem, sửa, xóa sự kiện[cite: 22].
* [cite_start]**Recurring Events:** Hỗ trợ lặp lại (Hàng ngày, hàng tuần, hàng tháng...)[cite: 22].
* [cite_start]**Chế độ xem:** Ngày (Day), Tuần (Week), Tháng (Month), Năm (Year)[cite: 23].
* [cite_start]**Giao diện:** Tương thích Dark/Light theme, Mini calendar sidebar[cite: 172].

### 3. ✅ Quản lý Công việc (Task Management)
* [cite_start]Đặt mức độ ưu tiên (Priority): HIGH, MEDIUM, LOW[cite: 125].
* [cite_start]Quản lý trạng thái (Status) và Deadline[cite: 22].
* [cite_start]Liên kết chặt chẽ: Task -> AI Events[cite: 107].

### 4. 🔐 Bảo mật (Security)
* Đăng nhập/Đăng ký qua Email & Password.
* [cite_start]**Google OAuth2:** Đăng nhập nhanh bằng tài khoản Google[cite: 40].
* [cite_start]**JWT Authentication:** Cơ chế xác thực không lưu session (stateless)[cite: 119].

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ | Vai trò |
| :--- | :--- | :--- |
| **Backend** | **Spring Boot 3.4** (Java 17+) | [cite_start]Core Framework [cite: 48] |
| | Spring Security + JWT | [cite_start]Authentication & Authorization [cite: 48] |
| | Spring Data JPA | [cite_start]ORM / Database Access [cite: 48] |
| | **Google Gemini SDK 1.0** | [cite_start]AI Scheduling Engine [cite: 48] |
| **Frontend** | **React 19** + TypeScript | [cite_start]SPA Framework [cite: 48] |
| | **Material UI (MUI) 7** | [cite_start]Component Library [cite: 48] |
| | Axios | [cite_start]HTTP Client [cite: 48] |
| | React Router DOM 7 | [cite_start]Client-side Routing [cite: 48] |
| **Database** | **MySQL** | [cite_start]Relational Database [cite: 48] |
| **Build Tool** | Gradle | [cite_start]Backend Build Tool [cite: 48] |

---

## 🏗️ Kiến trúc hệ thống (Architecture)

[cite_start]Hệ thống tuân theo mô hình **Client-Server** 3 tầng tiêu chuẩn[cite: 51]:
1.  **Controller Layer:** Xử lý REST API request.
2.  **Service Layer:** Chứa business logic (AI logic, Scheduling logic).
3.  [cite_start]**Repository Layer:** Giao tiếp với MySQL qua JPA[cite: 66].

---

## ⚙️ Hướng dẫn cài đặt (Installation Guide)

### 1. Yêu cầu tiên quyết (Prerequisites)
* Java Development Kit (JDK) 17 trở lên.
* Node.js (v18+) & npm/yarn.
* MySQL Server.
* Google Cloud Console Project (để lấy OAuth2 Client ID và Gemini API Key).

### 2. Thiết lập Database
Tạo cơ sở dữ liệu MySQL:
```sql
CREATE DATABASE calendar_app;

### 3. Cài đặt Backend (Spring Boot)
Clone repository và di chuyển vào thư mục backend.

Mở file src/main/resources/application.properties và cấu hình:

Properties
# Database Config
spring.datasource.url=jdbc:mysql://localhost:3306/calendar_app
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

# JWT Secret (Chuỗi ngẫu nhiên bất kỳ)
application.security.jwt.secret-key=YOUR_VERY_LONG_SECRET_KEY

# Google Gemini AI Key
gemini.api.key=YOUR_GEMINI_API_KEY

# Google OAuth2 Config
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
Chạy ứng dụng:

Bash
./gradlew bootRun
Backend sẽ khởi chạy tại cổng mặc định 8080.

4. Cài đặt Frontend (React)
Di chuyển vào thư mục frontend:

Bash
cd frontend
Cài đặt các thư viện phụ thuộc:

Bash
npm install
# hoặc
yarn install
Khởi chạy ứng dụng:

Bash
npm start
# hoặc
yarn start
Frontend sẽ khởi chạy tại http://localhost:3000.

🤝 Đóng góp & Liên hệ
Dự án được thực hiện trong khuôn khổ môn học Project 1 tại Đại học Bách Khoa Hà Nội. Mọi ý kiến đóng góp xin gửi về:

Email: hai.dnh230026@sis.hust.edu.vn

GitHub: HaiDNH20230026
