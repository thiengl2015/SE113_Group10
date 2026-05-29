# 📋 TÀI LIỆU TEST CASE CHI TIẾT — CLMS

> **Dự án:** Computer Lab Management System (CLMS-2026)
> **Phiên bản TCS:** 2.0 | **Phiên bản Test Plan:** 3.0
> **Nhóm thực hiện:** Tran Anh Tuan · Nguyen Bao Trung · Pham Nguyen Gia Thien
> **Người review:** Nguyen Thi Thanh Truc
> **Ngày:** 18-May-2026

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Phạm vi kiểm thử](#2-phạm-vi-kiểm-thử)
3. [Môi trường & Dữ liệu test](#3-môi-trường--dữ-liệu-test)
4. [TCS-G01 — Xác thực & Quản lý hồ sơ](#4-tcs-g01--xác-thực--quản-lý-hồ-sơ)
5. [TCS-G02 — Quản lý phòng lab & thiết bị](#5-tcs-g02--quản-lý-phòng-lab--thiết-bị)
6. [TCS-G03 — Quản lý đặt phòng/máy](#6-tcs-g03--quản-lý-đặt-phòngmáy)
7. [TCS-G04 — Quản lý sự cố kỹ thuật](#7-tcs-g04--quản-lý-sự-cố-kỹ-thuật)
8. [TCS-G05 — Bảo mật & Phân quyền (RBAC)](#8-tcs-g05--bảo-mật--phân-quyền-rbac)
9. [TCS-G06 — Yêu cầu phi chức năng](#9-tcs-g06--yêu-cầu-phi-chức-năng)
10. [Ma trận truy xuất yêu cầu](#10-ma-trận-truy-xuất-yêu-cầu)
11. [Tiêu chí Pass/Fail](#11-tiêu-chí-passfail)
12. [Rủi ro & Ràng buộc](#12-rủi-ro--ràng-buộc)

---

## 1. Tổng quan hệ thống

CLMS là ứng dụng web quản lý phòng máy tính với **3 nhóm người dùng chính**:

| Vai trò | Mô tả quyền hạn |
|---|---|
| **Customer** | Đặt phòng/máy, xem lịch sử, gửi báo cáo sự cố |
| **Lab Staff** | Xử lý hàng đợi đặt phòng, cập nhật trạng thái sự cố, thay đổi trạng thái máy |
| **System Admin** | Quản lý toàn bộ phòng/máy, quản lý tài khoản, xem báo cáo thống kê |

**Công nghệ:** ExpressJS (Node.js) + PostgreSQL + JWT Auth + Playwright (E2E automation)

---

## 2. Phạm vi kiểm thử

### ✅ Trong phạm vi

- Xác thực & quản lý hồ sơ (UC-01 → UC-06, UC-29, UC-30)
- Quản lý phòng lab & máy trạm (UC-19 → UC-27)
- Quản lý đặt phòng/máy (UC-07 → UC-12, UC-14 → UC-16)
- Quản lý sự cố kỹ thuật (UC-13, UC-17, UC-18)
- Bảo mật: JWT, RBAC, rate limiting, khóa tài khoản
- Hiệu năng: thời gian phản hồi, xử lý đồng thời

### ❌ Ngoài phạm vi

- Unit testing / White-box testing
- Gửi email SMTP (kiểm tra hành vi quan sát được, không kiểm tra giao nhận thực)
- Dashboard, thống kê, báo cáo (ngoài phạm vi midterm)

---

## 3. Môi trường & Dữ liệu test

### Cấu hình môi trường

| Thành phần | Chi tiết |
|---|---|
| **DB Server** | PostgreSQL — CLMS-DB-01 (4 Cores, 8GB RAM, Windows 10/11) |
| **App Server** | Node.js + ExpressJS — CLMS-APP-01 (4 Cores, 8GB RAM) |
| **Trình duyệt** | Chrome & Edge phiên bản mới nhất |
| **Automation** | Playwright (JavaScript) |
| **Bảo mật** | JWT Access/Refresh Token, HTTP-only Secure Cookie (SameSite=Strict) |

### Dữ liệu test yêu cầu (Seed Data)

| Tập dữ liệu | Trạng thái yêu cầu tối thiểu | Mục đích |
|---|---|---|
| **Tài khoản người dùng** | Customer (active), Customer (blocked), Lab Staff (active), System Admin (active) | Test RBAC, khóa/mở khóa tài khoản |
| **Phòng lab** | 1 phòng trống, 1 phòng có máy, 1 phòng có lịch đặt đang active | Test CRUD phòng, ràng buộc xóa |
| **Máy trạm** | Available, Maintenance, có reservation đang active, có thông số HW/NET | Test đặt máy, toggle trạng thái |
| **Reservations** | Pending, Approved, Rejected, Cancelled, có conflict thời gian | Test hàng đợi, huỷ, đồng thời |
| **Sự cố** | Open, Under Review, Resolved — liên kết phòng/máy hợp lệ | Test vòng đời ticket |
| **Token** | Valid access token, expired token, valid/revoked refresh token, expired reset token | Test xác thực & phiên làm việc |

---

## 4. TCS-G01 — Xác thực & Quản lý hồ sơ

> **Use Cases:** UC-01 đến UC-06, UC-29, UC-30
> **Rủi ro chính:** Truy cập trái phép, xử lý thông tin đăng nhập yếu, lạm dụng token, trạng thái tài khoản không nhất quán

---

### UC-01: Đăng ký tài khoản (Sign Up)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G01-001 | Đăng ký thành công với email hợp lệ | Email mới chưa tồn tại, mật khẩu đúng độ phức tạp, đủ các trường | Tài khoản tạo thành công, gửi link xác minh | Positive | Critical |
| TC-G01-002 | Đăng ký với email đã tồn tại | Email đã có trong hệ thống | Hệ thống từ chối, báo lỗi email trùng | Negative | Critical |
| TC-G01-003 | Đăng ký thiếu trường bắt buộc | Bỏ trống email hoặc mật khẩu | Lỗi validation hiển thị tại trường tương ứng | Negative | Major |
| TC-G01-004 | Đăng ký mật khẩu quá ngắn (boundary) | Mật khẩu ít hơn độ dài tối thiểu 1 ký tự | Hệ thống từ chối với thông báo lỗi rõ ràng | Boundary | Major |
| TC-G01-005 | Đăng ký mật khẩu đúng độ dài tối thiểu | Mật khẩu đúng số ký tự tối thiểu quy định | Đăng ký thành công | Boundary | Major |
| TC-G01-006 | Mật khẩu không đủ độ phức tạp | Chỉ dùng chữ thường, không có số/ký tự đặc biệt | Hệ thống từ chối, thông báo yêu cầu độ phức tạp | Negative | Major |
| TC-G01-038 | Đăng ký với username đã tồn tại | Username đã có trong hệ thống | Hệ thống từ chối, báo lỗi username trùng | Negative | Critical |
| TC-G01-039 | Đăng ký với username quá ngắn | Username < 3 ký tự | Validation lỗi, thông báo username phải 3-50 ký tự | Boundary | Major |
| TC-G01-040 | Đăng ký với username quá dài | Username > 50 ký tự | Validation lỗi, thông báo username phải 3-50 ký tự | Boundary | Major |
| TC-G01-041 | Đăng ký với username chứa ký tự đặc biệt | Username: "admin@#$%" | Validation lỗi, thông báo username chỉ chứa a-z, A-Z, 0-9, _ | Negative | Major |
| TC-G01-042 | Đăng ký với email sai định dạng | Email: "not-an-email" | Validation lỗi, thông báo email không hợp lệ | Negative | Major |
| TC-G01-043 | Đăng ký với OTP brute-force | Nhập sai OTP vượt ngưỡng (5 lần) | Tài khoản bị khóa tạm thời hoặc yêu cầu đợi | Security | Critical |
| TC-G01-044 | Gửi lại OTP quá nhanh (Rate limit resend) | Gọi resend-verification liên tục trong vài giây | Bị giới hạn, trả về lỗi 429 | Security | Major |
| TC-G01-045 | Resend OTP khi chưa hết hạn | Yêu cầu OTP mới trước khi OTP cũ hết hạn | Trả về OTP cũ hoặc thông báo OTP còn hiệu lực | Edge Case | Minor |
| TC-G01-046 | Xác minh OTP đã hết hạn | OTP hết hạn (>5 phút) | Từ chối, thông báo OTP đã hết hạn | Boundary | Critical |
| TC-G01-047 | Xác minh OTP đã được sử dụng | Dùng lại OTP đã xác minh thành công | Từ chối, thông báo OTP không hợp lệ | State | Critical |

---

### UC-02: Đăng nhập (Sign In)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G01-007 | Đăng nhập thành công (Customer) | Email và mật khẩu đúng, tài khoản active | Nhận Access Token + Refresh Token, chuyển đến dashboard Customer | Positive | Critical |
| TC-G01-008 | Đăng nhập thành công (Lab Staff) | Tài khoản Staff hợp lệ | Dashboard Staff hiển thị đúng | Positive | Critical |
| TC-G01-009 | Đăng nhập thành công (Admin) | Tài khoản Admin hợp lệ | Dashboard Admin hiển thị đúng | Positive | Critical |
| TC-G01-010 | Đăng nhập sai mật khẩu | Email đúng, mật khẩu sai | Xác thực thất bại, không cấp token | Negative | Critical |
| TC-G01-011 | Đăng nhập tài khoản không tồn tại | Email chưa đăng ký | Phản hồi an toàn (không tiết lộ email có tồn tại hay không) | Negative | Major |
| TC-G01-012 | Đăng nhập tài khoản bị khóa | Tài khoản ở trạng thái Blocked | Từ chối đăng nhập, thông báo tài khoản bị khóa | State | Critical |
| TC-G01-013 | Kích hoạt khóa tài khoản sau nhiều lần sai (Rate Limit) | Sai mật khẩu vượt ngưỡng quy định | Tài khoản bị khóa tạm thời hoặc rate limit được áp dụng | Boundary | Critical |

---

### UC-03: Đăng xuất (Sign Out)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G01-014 | Đăng xuất thành công | Người dùng đang đăng nhập, refresh token hợp lệ | Refresh token bị thu hồi trong DB, token cục bộ bị xóa | Positive | Critical |
| TC-G01-015 | Dùng Access Token cũ sau đăng xuất | Dùng access token trước khi đăng xuất | Token hết hạn hoặc bị từ chối (tùy cấu hình TTL) | State | Major |
| TC-G01-016 | Dùng Refresh Token sau đăng xuất | Gọi endpoint refresh sau khi sign out | 401 Unauthorized — token đã bị thu hồi | Security | Critical |

---

### UC-04: Đặt lại mật khẩu (Reset Password)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G01-017 | Yêu cầu reset với email đúng | Email đã đăng ký | Link reset gửi về (hoặc trạng thái queued), không tiết lộ thông tin | Positive | Major |
| TC-G01-018 | Yêu cầu reset với email không tồn tại | Email chưa đăng ký | Phản hồi giống thành công (enumeration-safe) | Security | Major |
| TC-G01-019 | Đặt lại mật khẩu với token hợp lệ trong TTL | Token reset hợp lệ, mật khẩu mới đúng quy tắc | Mật khẩu cập nhật, token reset bị vô hiệu hóa | Positive | Critical |
| TC-G01-020 | Đặt lại mật khẩu với token hết hạn (>15 phút) | Token quá hạn 15 phút | Từ chối, thông báo token hết hạn | Boundary | Critical |
| TC-G01-021 | Dùng lại token reset đã sử dụng | Token đã dùng một lần | Từ chối, token không còn hiệu lực | State | Critical |
| TC-G01-022 | Reset với mật khẩu mới vi phạm quy tắc | Mật khẩu mới quá ngắn hoặc thiếu độ phức tạp | Validation lỗi, mật khẩu không được thay đổi | Negative | Major |

---

### UC-05: Cập nhật hồ sơ cá nhân

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G01-023 | Cập nhật tên hiển thị hợp lệ | Tên hợp lệ, đang đăng nhập | Dữ liệu cập nhật trong DB, giao diện hiển thị thông tin mới | Positive | Major |
| TC-G01-024 | Cập nhật số điện thoại định dạng sai | Số điện thoại có chữ cái hoặc sai định dạng | Validation lỗi tại trường phone | Negative | Minor |
| TC-G01-025 | Bỏ trống trường bắt buộc khi cập nhật | Xóa tên hiển thị | Hệ thống từ chối, thông báo trường bắt buộc | Negative | Minor |
| TC-G01-025b | Cập nhật username hợp lệ | Username mới hợp lệ | Username được cập nhật thành công | Positive | Major |
| TC-G01-025c | Cập nhật username trùng với người khác | Username đã tồn tại | Validation lỗi, thông báo username đã tồn tại | Negative | Major |
| TC-G01-025d | Cập nhật email trùng với người khác | Email đã tồn tại trong hệ thống | Validation lỗi, thông báo email đã tồn tại | Negative | Major |
| TC-G01-026 | Cập nhật hồ sơ khi chưa đăng nhập | Gọi API không có token | 401 Unauthorized | Security | Critical |

---

### UC-06: Đổi mật khẩu (Change Password)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G01-027 | Đổi mật khẩu thành công | Mật khẩu hiện tại đúng, mật khẩu mới đúng quy tắc, khác mật khẩu cũ | Mật khẩu cập nhật, refresh token thu hồi, yêu cầu đăng nhập lại | Positive | Critical |
| TC-G01-028 | Đổi mật khẩu với mật khẩu hiện tại sai | Nhập sai mật khẩu hiện tại | Từ chối, không thay đổi mật khẩu | Negative | Critical |
| TC-G01-029 | Đặt mật khẩu mới trùng mật khẩu cũ | Mật khẩu mới = mật khẩu cũ | Từ chối, thông báo không được dùng lại mật khẩu | Negative | Major |
| TC-G01-030 | Mật khẩu mới không đủ độ phức tạp | Mật khẩu đơn giản | Validation lỗi | Negative | Major |

---

### UC-28, UC-29, UC-30: Quản lý tài khoản người dùng (Admin)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G01-031 | Admin xem danh sách người dùng | Admin đăng nhập, gọi user directory API | Danh sách hiển thị, không bao gồm mật khẩu/key nhạy cảm | Positive | Major |
| TC-G01-032 | Non-admin truy cập user directory | Customer/Staff gọi API | 403 Forbidden | Security | Critical |
| TC-G01-033 | Admin khóa tài khoản người dùng | Tài khoản đang active, Admin nhập lý do | Tài khoản chuyển sang Blocked, tất cả refresh token bị xóa khỏi DB | Positive | Critical |
| TC-G01-034 | Admin khóa tài khoản thiếu lý do | Không nhập lý do (trường bắt buộc) | Từ chối, validation lỗi | Negative | Major |
| TC-G01-035 | Admin tự khóa tài khoản của mình | Admin thực hiện block chính mình | Hệ thống từ chối (self-block protection) | Edge Case | Critical |
| TC-G01-036 | Admin mở khóa tài khoản bị khóa | Tài khoản ở trạng thái Blocked | Chuyển sang Active, người dùng có thể đăng nhập lại | Positive | Critical |
| TC-G01-037 | Đăng nhập sau khi bị khóa (session eviction) | Tài khoản vừa bị khóa, dùng refresh token cũ | Refresh token không còn hợp lệ, 401 | State | Critical |

---

## 5. TCS-G02 — Quản lý phòng lab & thiết bị

> **Use Cases:** UC-19 đến UC-27
> **Rủi ro chính:** Trạng thái kho không hợp lệ, vi phạm ràng buộc quan hệ, thông tin sẵn có không chính xác

---

### UC-20 đến UC-23: CRUD Phòng lab (Admin)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G02-001 | Tạo phòng lab mới hợp lệ | Mã phòng & tên phòng duy nhất, sức chứa > 0 | Phòng được tạo, lưu DB, phản hồi thành công | Positive | Critical |
| TC-G02-002 | Tạo phòng với mã phòng trùng | Mã phòng đã tồn tại | Từ chối, lỗi duplicate | Negative | Critical |
| TC-G02-003 | Tạo phòng với sức chứa = 0 | capacity = 0 | Validation lỗi | Boundary | Major |
| TC-G02-004 | Tạo phòng với sức chứa âm | capacity = -1 | Validation lỗi | Boundary | Major |
| TC-G02-004b | Giảm sức chứa phòng xuống dưới số máy hiện có | capacity mới < số workstation đang liên kết | Từ chối, lỗi ràng buộc capacity | Negative | Critical |
| TC-G02-004c | Cập nhật mã phòng thành mã đã tồn tại | Mã phòng mới trùng với phòng khác | Từ chối, lỗi duplicate | Negative | Major |
| TC-G02-005 | Xem chi tiết phòng lab | Admin, phòng tồn tại | Hiển thị thông tin phòng + danh sách máy trạm liên kết | Positive | Major |
| TC-G02-006 | Cập nhật thông tin phòng hợp lệ | Dữ liệu cập nhật hợp lệ | Thông tin lưu vào DB, phản hồi thành công | Positive | Major |
| TC-G02-007 | Giảm sức chứa phòng xuống dưới số máy hiện có | capacity mới < số workstation đang liên kết | Từ chối, lỗi ràng buộc capacity | Negative | Critical |
| TC-G02-008 | Xóa phòng trống (không có máy, không có lịch đặt) | Phòng không có workstation/reservation | Xóa thành công | Positive | Major |
| TC-G02-009 | Xóa phòng có máy trạm con | Phòng còn workstation liên kết | Từ chối, lỗi ràng buộc quan hệ | Negative | Critical |
| TC-G02-010 | Xóa phòng có lịch đặt đang active | Phòng có reservation Approved/Pending | Từ chối, lỗi ràng buộc | Negative | Critical |
| TC-G02-011 | Non-admin tạo/xóa phòng | Customer hoặc Staff gọi API | 403 Forbidden | Security | Critical |

---

### UC-24 đến UC-27: CRUD Máy trạm (Admin)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G02-012 | Thêm máy trạm vào phòng hợp lệ | Mã máy duy nhất, IP/MAC hợp lệ, phòng chưa đầy | Máy được tạo, lưu DB | Positive | Critical |
| TC-G02-013 | Thêm máy vượt sức chứa phòng | Số máy hiện tại = capacity phòng | Từ chối, lỗi capacity exceeded | Negative | Critical |
| TC-G02-014 | Thêm máy với IP address sai định dạng | IP = "999.999.0.1" hoặc chuỗi ngẫu nhiên | Validation lỗi | Negative | Major |
| TC-G02-015 | Thêm máy với MAC address sai định dạng | MAC sai format (ví dụ: "abc123" hoặc "00:11:22:33") | Validation lỗi | Negative | Major |
| TC-G02-015b | Thêm máy với MAC address đúng định dạng | MAC: "00:1A:2B:3C:4D:5E" | Máy được tạo thành công | Positive | Major |
| TC-G02-015c | Thêm máy với MAC address trùng | MAC đã tồn tại trong hệ thống | Từ chối, lỗi duplicate MAC | Negative | Major |
| TC-G02-016 | Thêm máy với mã máy trùng trong cùng phòng | Mã máy đã tồn tại | Từ chối, lỗi duplicate | Negative | Major |
| TC-G02-017 | Xem thông số máy trạm | Admin, máy tồn tại | Hiển thị đủ thông số HW/NET (RAM, storage, OS, IP, MAC) | Positive | Minor |
| TC-G02-018 | Cập nhật cấu hình máy hợp lệ | Thông số mới hợp lệ | Cập nhật lưu vào DB | Positive | Major |
| TC-G02-019 | Cập nhật RAM = 0 hoặc âm | RAM = 0 | Validation lỗi | Boundary | Minor |
| TC-G02-020 | Xóa máy không có reservation | Máy không có reservation đang active | Xóa thành công | Positive | Major |
| TC-G02-021 | Xóa máy có reservation đang active | Máy có reservation Pending/Approved | Từ chối, ràng buộc reservation | Negative | Critical |

---

### UC-19: Thay đổi trạng thái vận hành máy (Lab Staff)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G02-022 | Chuyển máy sang Maintenance | Máy đang Available, Staff đăng nhập | Trạng thái = Maintenance, không nhận đặt phòng mới | Positive | Critical |
| TC-G02-023 | Chuyển máy từ Maintenance về Available | Máy đang Maintenance | Trạng thái = Available, có thể đặt phòng lại | Positive | Critical |
| TC-G02-024 | Customer cố đặt máy đang Maintenance | Máy ở trạng thái Maintenance | Từ chối đặt phòng, thông báo rõ lý do | State | Critical |
| TC-G02-025 | Non-staff cố thay đổi trạng thái máy | Customer gọi API toggle trạng thái | 403 Forbidden | Security | Critical |

---

## 6. TCS-G03 — Quản lý đặt phòng/máy

> **Use Cases:** UC-07 đến UC-12, UC-14 đến UC-16
> **Rủi ro chính:** Double-booking, hành động trên reservation cũ, sai ownership, khung giờ không hợp lệ

---

### UC-07, UC-08: Duyệt lịch sẵn có

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G03-001 | Tìm phòng khả dụng với ngày hợp lệ | Ngày trong tương lai, lọc hợp lệ | Hiển thị danh sách phòng available | Positive | Major |
| TC-G03-002 | Tìm phòng với ngày trong quá khứ | Ngày đã qua | Kết quả rỗng hoặc báo lỗi | Negative | Major |
| TC-G03-003 | Máy Maintenance không xuất hiện trong kết quả tìm | Máy ở trạng thái Maintenance | Không hiển thị trong danh sách available | State | Critical |
| TC-G03-004 | Máy đã có reservation Approved không xuất hiện | Máy đã được book khung giờ đang tìm | Không hiển thị trong danh sách available | State | Critical |
| TC-G03-005 | Lọc máy theo thông số phần cứng | Lọc theo RAM tối thiểu, OS | Chỉ hiển thị máy thỏa mãn điều kiện lọc | Positive | Minor |

---

### UC-09, UC-10: Tạo đặt phòng/máy (Customer)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G03-006 | Đặt phòng lab thành công | Ngày tương lai, khung giờ hợp lệ, phòng trống, đủ trường bắt buộc | Tạo reservation ở trạng thái Pending | Positive | Critical |
| TC-G03-007 | Đặt máy trạm thành công | Máy Available, không overlap | Tạo reservation ở trạng thái Pending | Positive | Critical |
| TC-G03-008 | Đặt với giờ kết thúc trước giờ bắt đầu | end_time < start_time | Validation lỗi | Negative | Critical |
| TC-G03-008b | Đặt với end_time = start_time (boundary) | end_time = start_time | Validation lỗi, thông báo end_time phải sau start_time | Boundary | Critical |
| TC-G03-009 | Đặt với thời gian trong quá khứ | Ngày đã qua | Từ chối, không tạo reservation | Negative | Critical |
| TC-G03-010 | Đặt phòng/máy đã có lịch Approved trùng giờ | Overlap với reservation đã Approved | Từ chối, lỗi conflict | Negative | Critical |
| TC-G03-011 | Đặt thiếu trường mục đích sử dụng | Bỏ trống trường purpose | Validation lỗi | Negative | Major |
| TC-G03-012 | Mid-air collision — hai user đặt cùng tài nguyên cùng lúc | Hai request đồng thời đến cùng slot | Chỉ một thành công, cái còn lại nhận conflict response | Concurrency | Critical |

---

### UC-11: Xem lịch sử đặt phòng

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G03-013 | Customer xem lịch sử của chính mình | Đang đăng nhập, có dữ liệu | Hiển thị đúng danh sách với đủ trạng thái (Pending/Approved/Rejected/Cancelled) | Positive | Major |
| TC-G03-014 | Customer xem lịch sử của người khác | Thay user_id trong request | 403 Forbidden — chỉ được xem reservation của mình | Security | Critical |
| TC-G03-015 | Lịch sử trống | Customer chưa có reservation nào | Hiển thị trạng thái empty state thân thiện | Positive | Minor |

---

### UC-12: Huỷ đặt phòng (Customer)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G03-016 | Huỷ reservation Pending thành công | Reservation đang Pending, đúng chủ sở hữu | Trạng thái = Cancelled, tài nguyên được giải phóng | Positive | Critical |
| TC-G03-017 | Huỷ reservation đã Approved | Reservation ở trạng thái Approved | Từ chối — chỉ Pending mới được huỷ | State | Critical |
| TC-G03-018 | Customer huỷ reservation của người khác | reservation_id thuộc user khác | 403 Forbidden | Security | Critical |
| TC-G03-019 | Race condition: Staff approve & Customer cancel cùng lúc | Staff đang approve, Customer đang cancel | Hệ thống xử lý atomic, không có inconsistent state | Concurrency | Critical |

---

### UC-14, UC-15, UC-16: Xử lý hàng đợi (Lab Staff)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G03-020 | Staff xem hàng đợi Pending | Có reservation Pending trong DB | Hiển thị đúng danh sách, sắp xếp theo FIFO | Positive | Major |
| TC-G03-021 | Hàng đợi trống | Không có reservation Pending | Empty state thân thiện | Positive | Minor |
| TC-G03-022 | Customer cố xem hàng đợi | Customer gọi API queue | 403 Forbidden | Security | Critical |
| TC-G03-023 | Approve reservation hợp lệ | Reservation Pending, tài nguyên còn available | Trạng thái = Approved, tài nguyên khóa vĩnh viễn cho khung giờ đó | Positive | Critical |
| TC-G03-024 | Approve reservation đã có Approved khác overlap | Conflict với reservation đã Approved | Từ chối, atomic check thất bại | Concurrency | Critical |
| TC-G03-025 | Reject reservation với lý do bắt buộc | Lý do không trống | Trạng thái = Rejected, lý do lưu vào DB, giải phóng tài nguyên | Positive | Critical |
| TC-G03-026 | Reject reservation thiếu lý do | Bỏ trống lý do | Validation lỗi — lý do là bắt buộc | Negative | Major |
| TC-G03-027 | Approve reservation đã bị Cancel trước đó | Reservation ở trạng thái Cancelled | Từ chối, không thể xử lý reservation đã kết thúc | State | Major |
| TC-G03-027b | Đặt phòng với số người vượt sức chứa | expected_users > capacity phòng | Từ chối, thông báo vượt sức chứa | Negative | Major |
| TC-G03-027c | Đặt phòng với expected_users = 0 | expected_users = 0 | Validation lỗi, expected_users phải >= 1 | Boundary | Minor |
| TC-G03-027d | Đặt phòng với expected_users = 1 (boundary) | expected_users = 1 | Đặt thành công | Boundary | Minor |
| TC-G03-027e | Đặt với khung giờ quá dài (>8 giờ) | start_time đến end_time > 8 giờ | Có thể từ chối hoặc cảnh báo (tùy business rule) | Edge Case | Minor |

---

## 7. TCS-G04 — Quản lý sự cố kỹ thuật

> **Use Cases:** UC-13, UC-17, UC-18
> **Rủi ro chính:** Mất báo cáo sự cố, chuyển trạng thái không hợp lệ, Customer truy cập tính năng Staff

---

### UC-13: Gửi báo cáo sự cố kỹ thuật (Customer)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G04-001 | Gửi sự cố thành công | Phòng/máy tồn tại, danh mục đã chọn, mô tả không trống | Ticket tạo ở trạng thái Open, lưu vào DB | Positive | Critical |
| TC-G04-002 | Gửi sự cố thiếu mô tả | Để trống trường description | Validation lỗi | Negative | Major |
| TC-G04-003 | Gửi sự cố không chọn danh mục | Không chọn category | Validation lỗi | Negative | Major |
| TC-G04-004 | Gửi sự cố với mã máy không tồn tại | workstation_id không hợp lệ | Từ chối, lỗi asset không tìm thấy | Negative | Major |
| TC-G04-005 | Retry gửi sự cố (idempotency) | Gửi lại cùng yêu cầu do lỗi mạng | Không tạo trùng ticket; hoặc response thành công an toàn | Edge Case | Minor |
| TC-G04-005b | Gửi sự cố với category không hợp lệ | Category: "invalid_category" | Validation lỗi, chỉ chấp nhận hardware/network/os/software | Negative | Major |
| TC-G04-005c | Gửi sự cố không có workstation_id và lab_room_id | Cả hai trường đều null | Validation lỗi, phải chọn ít nhất một phòng hoặc máy | Negative | Critical |
| TC-G04-005d | Gửi sự cố khi không đăng nhập | Không có token | 401 Unauthorized | Security | Critical |

---

### UC-17, UC-18: Dashboard & Cập nhật sự cố (Lab Staff)

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G04-006 | Staff xem danh sách sự cố | Có ticket trong DB | Hiển thị danh sách, ưu tiên chưa giải quyết | Positive | Major |
| TC-G04-007 | Customer cố xem dashboard sự cố | Customer gọi API staff incident list | 403 Forbidden | Security | Critical |
| TC-G04-008 | Cập nhật sự cố Open → Under Review | Ticket ở trạng thái Open | Trạng thái = Under Review, lưu ghi chú nếu có | Positive | Critical |
| TC-G04-009 | Cập nhật sự cố Under Review → Resolved | Ticket ở trạng thái Under Review, có resolution note | Trạng thái = Resolved, ghi chú lưu vào DB | Positive | Critical |
| TC-G04-010 | Chuyển trạng thái không hợp lệ (Open → Resolved) | Bỏ qua bước Under Review | Từ chối, transition không hợp lệ | State | Major |
| TC-G04-011 | Cập nhật sự cố đã Resolved | Ticket đã Resolved | Từ chối hoặc trả thông báo không thể cập nhật thêm | State | Minor |
| TC-G04-012 | Cập nhật sự cố gặp lỗi DB | Lỗi commit DB khi cập nhật | Rollback, trạng thái cũ vẫn giữ nguyên | Error Handling | Critical |

---

## 8. TCS-G05 — Bảo mật & Phân quyền (RBAC)

> **Use Cases:** Tất cả use case nhạy cảm với vai trò
> **Rủi ro chính:** Leo thang đặc quyền, giả mạo token/user ID, brute force, đánh cắp token

---

### Kiểm tra phân quyền tổng quát

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G05-001 | Gọi API có bảo vệ mà không có token | Không có Authorization header | 401 Unauthorized | Security | Critical |
| TC-G05-002 | Gọi API với Access Token hết hạn | Token TTL đã qua | 401 Unauthorized | Security | Critical |
| TC-G05-003 | Gọi API với token bị giả mạo (sai chữ ký) | Chỉnh sửa payload JWT | 401 Unauthorized | Security | Critical |
| TC-G05-004 | Customer gọi API dành riêng cho Staff | Đúng token Customer, endpoint Staff-only | 403 Forbidden | Security | Critical |
| TC-G05-005 | Staff gọi API dành riêng cho Admin | Đúng token Staff, endpoint Admin-only | 403 Forbidden | Security | Critical |
| TC-G05-006 | Truy cập resource của người dùng khác | Thay user_id/reservation_id trong payload | 403 Forbidden | Security | Critical |

---

### Kiểm tra JWT & Session

| # | Tên Test Case | Điều kiện đầu vào | Kết quả kỳ vọng | Loại | Mức độ |
|---|---|---|---|---|---|
| TC-G05-007 | Làm mới Access Token với Refresh Token hợp lệ | Refresh token hợp lệ trong cookie | Nhận Access Token mới | Positive | Critical |
| TC-G05-008 | Làm mới với Refresh Token đã thu hồi | Token đã đăng xuất hoặc bị xóa | 401 Unauthorized | Security | Critical |
| TC-G05-009 | Kiểm tra Refresh Token cookie attributes | Phân tích HTTP response header | Cookie có Secure, HttpOnly, SameSite=Strict | Security | Major |
| TC-G05-010 | Rate limiting — vượt 100 req/phút | Gửi >100 request trong 1 phút | Response 429 Too Many Requests | Boundary | Major |

---

## 9. TCS-G06 — Yêu cầu phi chức năng

> **Use Cases liên quan:** UC-07, UC-08, UC-09, UC-12, UC-15, UC-16, UC-26, UC-27, UC-31
> **Rủi ro chính:** Phản hồi chậm, trình duyệt đứng, lỗi transaction, feedback validation không rõ

---

### Hiệu năng (Performance)

| # | Tên Test Case | Mục tiêu | Kết quả kỳ vọng | Mức độ |
|---|---|---|---|---|
| TC-G06-001 | Thời gian phản hồi API đọc (read) | Các API GET chính (phòng, máy, lịch sử) | Hoàn thành < **1.0 giây** | Major |
| TC-G06-002 | Thời gian phản hồi API ghi (write) | Tạo/cập nhật/xóa reservation, room, workstation | Hoàn thành < **2.0 giây** | Major |
| TC-G06-003 | Render grid lịch sẵn có | Hiển thị danh sách lớn (50+ máy) | Render hoàn tất < **500 ms** | Major |
| TC-G06-004 | Nhiều user đồng thời đặt cùng tài nguyên | Mô phỏng concurrent booking | Không deadlock; chỉ 1 thành công; các request còn lại nhận lỗi conflict rõ ràng | Critical |

---

### Tính toàn vẹn dữ liệu & Xử lý lỗi

| # | Tên Test Case | Điều kiện | Kết quả kỳ vọng | Mức độ |
|---|---|---|---|---|
| TC-G06-005 | Rollback khi lỗi giữa chừng transaction | Lỗi DB sau bước 1 trong chuỗi 2 bước | Trạng thái hệ thống không thay đổi, không có partial update | Critical |
| TC-G06-006 | Lỗi hệ thống không lộ thông tin nhạy cảm | Trigger lỗi DB hoặc exception | Response không chứa SQL query, stack trace, hoặc thông tin schema | Security | Critical |
| TC-G06-007 | Validation feedback rõ ràng trên UI | Submit form thiếu hoặc sai dữ liệu | Trường bị lỗi được highlight, thông báo cụ thể (không phải generic) | Minor |
| TC-G06-008 | Cấu trúc response API nhất quán | Nhiều endpoint khác nhau | Tất cả response theo cùng JSON envelope format | Minor |

---

## 10. Ma trận truy xuất yêu cầu

| Requirement | Nhóm TCS | Test Cases chính |
|---|---|---|
| UC-01 Sign Up | G01, G05 | TC-G01-001 → TC-G01-006, TC-G01-038 → TC-G01-047 |
| UC-02 Sign In | G01, G05 | TC-G01-007 → TC-G01-013 |
| UC-03 Sign Out | G01, G05 | TC-G01-014 → TC-G01-016 |
| UC-04 Reset Password | G01, G05 | TC-G01-017 → TC-G01-022 |
| UC-05 Update Profile | G01 | TC-G01-023 → TC-G01-026 |
| UC-06 Change Password | G01, G05 | TC-G01-027 → TC-G01-030 |
| UC-07 Browse Room Availability | G03, G06 | TC-G03-001 → TC-G03-005 |
| UC-08 Browse Workstation Availability | G02, G03, G06 | TC-G03-001 → TC-G03-005 |
| UC-09 Reserve Lab Room | G03, G06 | TC-G03-006 → TC-G03-012 |
| UC-10 Reserve Workstation | G03, G06 | TC-G03-006 → TC-G03-012 |
| UC-11 View Reservation History | G03, G05 | TC-G03-013 → TC-G03-015 |
| UC-12 Cancel Pending Reservation | G03, G05, G06 | TC-G03-016 → TC-G03-019 |
| UC-13 Submit Incident Report | G04 | TC-G04-001 → TC-G04-005 |
| UC-14 View Request Queue | G03, G05 | TC-G03-020 → TC-G03-022 |
| UC-15 Approve Reservation | G03, G05, G06 | TC-G03-023 → TC-G03-024 |
| UC-16 Reject Reservation | G03, G05, G06 | TC-G03-025 → TC-G03-027 |
| UC-17 View Incident Tickets | G04, G05 | TC-G04-006 → TC-G04-007 |
| UC-18 Update Incident Progress | G04, G05 | TC-G04-008 → TC-G04-012 |
| UC-19 Set Workstation State | G02, G03, G05 | TC-G02-022 → TC-G02-025 |
| UC-20 Create Lab Room | G02, G05 | TC-G02-001 → TC-G02-004 |
| UC-21 View Lab Room Details | G02, G05 | TC-G02-005 |
| UC-22 Update Lab Room | G02, G05 | TC-G02-006 → TC-G02-007 |
| UC-23 Delete Lab Room | G02, G05, G06 | TC-G02-008 → TC-G02-011 |
| UC-24 Add Workstation | G02, G05 | TC-G02-012 → TC-G02-016 |
| UC-25 View Workstation Specs | G02, G05 | TC-G02-017 |
| UC-26 Update Workstation | G02, G05, G06 | TC-G02-018 → TC-G02-019 |
| UC-27 Remove Workstation | G02, G05, G06 | TC-G02-020 → TC-G02-021 |
| UC-28 View User Directory | G01, G05 | TC-G01-031 → TC-G01-032 |
| UC-29 Block User | G01, G05 | TC-G01-033 → TC-G01-035 |
| UC-30 Unblock User | G01, G05 | TC-G01-036 → TC-G01-037 |
| NFR — Security/JWT | G05 | TC-G05-001 → TC-G05-010 |
| NFR — Performance | G06 | TC-G06-001 → TC-G06-004 |
| NFR — Data Integrity | G06 | TC-G06-005 → TC-G06-008 |

---

## 11. Tiêu chí Pass/Fail

| Kết quả | Định nghĩa |
|---|---|
| ✅ **Pass** | Kết quả thực tế khớp với kết quả kỳ vọng; trạng thái DB/hệ thống thay đổi đúng; không có side effect trái phép |
| ❌ **Fail** | Kết quả thực tế trái với kỳ vọng; cho phép dữ liệu sai; sai trạng thái; vi phạm phân quyền; vượt ngưỡng hiệu năng |
| 🚫 **Blocked** | Không thể thực thi do: thiếu build, môi trường không sẵn sàng, thiếu dữ liệu tiên quyết |
| ⏸ **Not Run** | Test case chưa được thực thi |
| N/A | Tính năng chưa triển khai hoặc ngoài phạm vi đã duyệt (cần ghi rõ lý do) |

---

## 12. Rủi ro & Ràng buộc

### Các rủi ro chính

| Rủi ro | Tác động | Biện pháp giảm thiểu |
|---|---|---|
| SRS và Test Plan không nhất quán về dashboard/reporting | Nhầm lẫn về phạm vi UC-31 | Coi reporting là limited scope, ghi N/A nếu chưa triển khai |
| JWT storage khác giữa SRS và implementation | Test bảo mật có thể thất bại | Dùng SRS làm chuẩn; ghi nhận sai lệch là defect |
| Hành vi concurrency khó tái hiện thủ công | Bỏ sót lỗi double-booking | Dùng Playwright/API để gửi concurrent request có kiểm soát |
| Email service không khả dụng | Không test đầy đủ reset/signup | Dùng sandbox mailbox hoặc mock token retrieval |
| Seed data không ổn định giữa các lần chạy | Lỗi giả do dirty data | Reset DB về baseline trước mỗi chu kỳ test |

### Ràng buộc quan trọng

- Testing là **Black-box / System-level** — không truy cập source code
- Kết quả hiệu năng chỉ hợp lệ trong môi trường và khối lượng dữ liệu đã khai báo
- Không lưu trữ mật khẩu thực, signing key, hoặc production credential trong tài liệu
- Dữ liệu destructive (xóa phòng, khóa user) phải có thể reset về baseline

---

*Tổng số test case đã định nghĩa: **~125 test cases** trải dài 6 nhóm chức năng*
