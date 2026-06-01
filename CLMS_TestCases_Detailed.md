# CLMS Detailed Test Cases

> Project: Computer Lab Management System (CLMS-2026)
> TCS Version: 2.0 | Test Plan Version: 3.0
> Team: Tran Anh Tuan, Nguyen Bao Trung, Pham Nguyen Gia Thien
> Reviewer: Nguyen Thi Thanh Truc
> Date: 18-May-2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Test Scope](#2-test-scope)
3. [Environment and Test Data](#3-environment-and-test-data)
4. [TCS-G01 - Authentication and Profile Management](#4-tcs-g01---authentication-and-profile-management)
5. [TCS-G02 - Lab Room and Workstation Management](#5-tcs-g02---lab-room-and-workstation-management)
6. [TCS-G03 - Reservation Management](#6-tcs-g03---reservation-management)
7. [TCS-G04 - Incident Management](#7-tcs-g04---incident-management)
8. [TCS-G05 - Security and RBAC](#8-tcs-g05---security-and-rbac)
9. [TCS-G06 - Non-Functional Requirements](#9-tcs-g06---non-functional-requirements)
10. [Requirements Traceability Matrix](#10-requirements-traceability-matrix)
11. [Pass/Fail Criteria](#11-passfail-criteria)
12. [Risks and Constraints](#12-risks-and-constraints)

---

## 1. System Overview

CLMS is a web application for managing computer labs with three primary user groups:

| Role | Description |
|---|---|
| Customer | Reserve lab rooms or workstations, view history, submit incident reports |
| Lab Staff | Process reservation queue, update incident status, change workstation state |
| System Admin | Manage labs/workstations, manage accounts, view usage reports |

Technology: ExpressJS (Node.js) + MySQL + JWT Auth + Cypress (E2E automation)

---

## 2. Test Scope

### In Scope

- Authentication and profile management (UC-01 to UC-06, UC-29, UC-30)
- Lab room and workstation management (UC-19 to UC-27)
- Reservation management (UC-07 to UC-12, UC-14 to UC-16)
- Incident management (UC-13, UC-17, UC-18)
- Security: JWT, RBAC, rate limiting, account lock
- Performance: response time, concurrency handling

### Out of Scope

- Unit testing / white-box testing
- SMTP delivery validation (verify observable behavior only)
- Dashboard, statistics, reporting (out of scope for midterm)

---

## 3. Environment and Test Data

### Environment Configuration

| Component | Details |
|---|---|
| DB Server | MySQL - CLMS-DB-01 (4 cores, 8GB RAM, Windows 10/11) |
| App Server | Node.js + ExpressJS - CLMS-APP-01 (4 cores, 8GB RAM) |
| Browsers | Latest Chrome and Edge |
| Automation | Cypress (JavaScript) |
| Security | JWT access/refresh tokens, HttpOnly Secure cookie (SameSite=Strict) |

### Required Test Data (Seed Data)

| Data Set | Minimum Required State | Purpose |
|---|---|---|
| User accounts | Customer (active), Customer (blocked), Lab Staff (active), System Admin (active) | Test RBAC and account lock/unlock |
| Lab rooms | 1 empty room, 1 room with workstations, 1 room with active reservation | Test CRUD and delete constraints |
| Workstations | Available, Maintenance, active reservation, HW/NET specs | Test reservation and state changes |
| Reservations | Pending, Approved, Rejected, Cancelled, time conflict | Test queue and concurrency |
| Incidents | Open, Under Review, Resolved with valid room/workstation links | Test ticket lifecycle |
| Tokens | Valid access token, expired token, valid/revoked refresh token, expired reset token | Test auth and sessions |

---

## 4. TCS-G01 - Authentication and Profile Management

> Use Cases: UC-01 to UC-06, UC-29, UC-30
> Key risks: unauthorized access, weak credential handling, token abuse, inconsistent account state

---

### UC-01: Sign Up

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G01-001 | Sign up with valid email | New email, password meets complexity, all required fields | Account created, verification code sent | Positive | Critical |
| TC-G01-002 | Sign up with existing email | Email already exists | Rejected with duplicate email error | Negative | Critical |
| TC-G01-003 | Sign up missing required fields | Email or password empty | Validation error shown on field | Negative | Major |
| TC-G01-004 | Password too short (boundary) | Password length below minimum by 1 | Rejected with clear message | Boundary | Major |
| TC-G01-005 | Password at minimum length | Password equals minimum length | Sign up succeeds | Boundary | Major |
| TC-G01-006 | Password lacks complexity | Only lowercase letters, no digits/specials | Rejected with complexity message | Negative | Major |
| TC-G01-038 | Sign up with existing username | Username already exists | Rejected with duplicate username error | Negative | Critical |
| TC-G01-039 | Username too short | Username < 3 characters | Validation error, 3-50 chars required | Boundary | Major |
| TC-G01-040 | Username too long | Username > 50 characters | Validation error, 3-50 chars required | Boundary | Major |
| TC-G01-041 | Username with special characters | Username: "admin@#$%" | Validation error, only a-z, A-Z, 0-9, _ | Negative | Major |
| TC-G01-042 | Invalid email format | Email: "not-an-email" | Validation error, invalid email format | Negative | Major |
| TC-G01-043 | OTP brute-force attempt | Wrong OTP above threshold (5 attempts) | Account temporarily locked or forced wait | Security | Critical |
| TC-G01-044 | Resend OTP too quickly | Repeated resend requests in seconds | Rate limited, HTTP 429 | Security | Major |
| TC-G01-045 | Resend OTP before expiry | Request new OTP before old expires | Old OTP reused or message that OTP is still valid | Edge Case | Minor |
| TC-G01-046 | Verify expired OTP | OTP expired (>5 minutes) | Rejected with expired message | Boundary | Critical |
| TC-G01-047 | Reuse verified OTP | Re-submit OTP after successful verify | Rejected, OTP invalid | State | Critical |

---

### UC-02: Sign In

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G01-007 | Sign in success (Customer) | Valid email/password, active account | Access token and refresh token issued, customer dashboard shown | Positive | Critical |
| TC-G01-008 | Sign in success (Lab Staff) | Valid staff account | Staff dashboard shown | Positive | Critical |
| TC-G01-009 | Sign in success (System Admin) | Valid admin account | Admin dashboard shown | Positive | Critical |
| TC-G01-010 | Sign in with wrong password | Correct email, wrong password | Auth fails, no token issued | Negative | Critical |
| TC-G01-011 | Sign in with non-existing account | Email not registered | Safe response, no user enumeration | Negative | Major |
| TC-G01-012 | Sign in with blocked account | Account state = Blocked | Rejected with blocked message | State | Critical |
| TC-G01-013 | Lockout after repeated failures | Wrong password above threshold | Temporary lockout or rate limit applied | Boundary | Critical |

---

### UC-03: Sign Out

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G01-014 | Sign out success | Logged in, refresh token valid | Refresh token revoked in DB, local token cleared | Positive | Critical |
| TC-G01-015 | Use old access token after sign out | Reuse access token after logout | Token rejected or expired (per TTL) | State | Major |
| TC-G01-016 | Use refresh token after sign out | Call refresh after sign out | 401 Unauthorized, token revoked | Security | Critical |

---

### UC-04: Reset Password

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G01-017 | Request reset with valid email | Registered email | Reset code sent or queued, no data leakage | Positive | Major |
| TC-G01-018 | Request reset with non-existing email | Email not registered | Same response as success (enumeration-safe) | Security | Major |
| TC-G01-019 | Reset password with valid token | Token valid within TTL, new password valid | Password updated, reset token invalidated | Positive | Critical |
| TC-G01-020 | Reset with expired token (>15 minutes) | Token expired | Rejected, expired token message | Boundary | Critical |
| TC-G01-021 | Reuse reset token | Token already used | Rejected, token invalid | State | Critical |
| TC-G01-022 | New password violates rules | Too short or weak password | Validation error, password unchanged | Negative | Major |

---

### UC-05: Update Profile

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G01-023 | Update display name | Valid name, authenticated | DB updated, UI shows new data | Positive | Major |
| TC-G01-024 | Invalid phone format | Phone contains letters or invalid format | Validation error on phone field | Negative | Minor |
| TC-G01-025 | Missing required field on update | Clear display name | Rejected, required field message | Negative | Minor |
| TC-G01-025b | Update username (valid) | New username valid | Username updated successfully | Positive | Major |
| TC-G01-025c | Update username duplicate | Username already exists | Validation error, username exists | Negative | Major |
| TC-G01-025d | Update email duplicate | Email already exists | Validation error, email exists | Negative | Major |
| TC-G01-026 | Update profile without auth | No token | 401 Unauthorized | Security | Critical |

---

### UC-06: Change Password

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G01-027 | Change password success | Correct current password, new password valid and different | Password updated, refresh token revoked, re-login required | Positive | Critical |
| TC-G01-028 | Current password incorrect | Wrong current password | Rejected, password unchanged | Negative | Critical |
| TC-G01-029 | New password equals old | New password = old password | Rejected, reuse not allowed | Negative | Major |
| TC-G01-030 | New password lacks complexity | Weak password | Validation error | Negative | Major |

---

### UC-28, UC-29, UC-30: Admin User Management

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G01-031 | Admin views user list | Admin authenticated, call directory API | List returned without sensitive fields | Positive | Major |
| TC-G01-032 | Non-admin accesses user directory | Customer or Lab Staff calls API | 403 Forbidden | Security | Critical |
| TC-G01-033 | Admin blocks user account | Target active, admin provides reason | Account blocked, all refresh tokens revoked | Positive | Critical |
| TC-G01-034 | Admin blocks without reason | Reason empty | Validation error | Negative | Major |
| TC-G01-035 | Admin attempts self-block | Admin blocks own account | Rejected (self-block protection) | Edge Case | Critical |
| TC-G01-036 | Admin unblocks account | Account state = Blocked | Account active, user can log in | Positive | Critical |
| TC-G01-037 | Login after block (session eviction) | Account blocked, reuse old refresh token | Refresh token invalid, 401 | State | Critical |

---

## 5. TCS-G02 - Lab Room and Workstation Management

> Use Cases: UC-19 to UC-27
> Key risks: invalid inventory state, relationship constraints, incorrect availability

---

### UC-20 to UC-23: Lab Room CRUD (System Admin)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G02-001 | Create lab room (valid) | Unique room code/name, capacity > 0 | Room created, DB saved | Positive | Critical |
| TC-G02-002 | Create room with duplicate code | Room code exists | Rejected, duplicate error | Negative | Critical |
| TC-G02-003 | Create room with capacity = 0 | capacity = 0 | Validation error | Boundary | Major |
| TC-G02-004 | Create room with negative capacity | capacity = -1 | Validation error | Boundary | Major |
| TC-G02-004b | Reduce capacity below workstation count | New capacity < current workstation count | Rejected, capacity constraint error | Negative | Critical |
| TC-G02-004c | Update room code to existing code | New code already exists | Rejected, duplicate error | Negative | Major |
| TC-G02-005 | View lab room details | Admin, room exists | Details shown with linked workstations | Positive | Major |
| TC-G02-006 | Update lab room (valid) | Valid update data | DB updated successfully | Positive | Major |
| TC-G02-007 | Reduce capacity below workstation count | New capacity < current workstation count | Rejected, capacity constraint error | Negative | Critical |
| TC-G02-008 | Delete empty lab room | No workstations or active reservations | Deleted successfully | Positive | Major |
| TC-G02-009 | Delete room with workstations | Workstations still linked | Rejected, relationship constraint | Negative | Critical |
| TC-G02-010 | Delete room with active reservations | Reservation status Approved/Pending | Rejected, reservation constraint | Negative | Critical |
| TC-G02-011 | Non-admin creates/deletes room | Customer or Lab Staff calls API | 403 Forbidden | Security | Critical |

---

### UC-24 to UC-27: Workstation CRUD (System Admin)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G02-012 | Add workstation (valid) | Unique code, valid IP/MAC, room not full | Workstation created, DB saved | Positive | Critical |
| TC-G02-013 | Add workstation beyond capacity | Current count = room capacity | Rejected, capacity exceeded | Negative | Critical |
| TC-G02-014 | Add workstation with invalid IP | IP = "999.999.0.1" or random | Validation error | Negative | Major |
| TC-G02-015 | Add workstation with invalid MAC | MAC invalid (e.g., "abc123" or "00:11:22:33") | Validation error | Negative | Major |
| TC-G02-015b | Add workstation with valid MAC | MAC: "00:1A:2B:3C:4D:5E" | Workstation created | Positive | Major |
| TC-G02-015c | Add workstation with duplicate MAC | MAC already exists | Rejected, duplicate MAC error | Negative | Major |
| TC-G02-016 | Add duplicate workstation code in room | Workstation code already exists | Rejected, duplicate error | Negative | Major |
| TC-G02-017 | View workstation specs | Admin, workstation exists | HW/NET specs shown (RAM, storage, OS, IP, MAC) | Positive | Minor |
| TC-G02-018 | Update workstation (valid) | Valid updates | DB updated successfully | Positive | Major |
| TC-G02-019 | Update RAM to 0 or negative | RAM = 0 or negative | Validation error | Boundary | Minor |
| TC-G02-020 | Delete workstation without reservation | No active reservations | Deleted successfully | Positive | Major |
| TC-G02-021 | Delete workstation with active reservation | Reservation status Pending/Approved | Rejected, reservation constraint | Negative | Critical |

---

### UC-19: Change Workstation Operational State (Lab Staff)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G02-022 | Set workstation to Maintenance | Workstation Available, staff authenticated | State = Maintenance, no new reservations | Positive | Critical |
| TC-G02-023 | Set workstation to Available | Workstation Maintenance | State = Available, reservations allowed | Positive | Critical |
| TC-G02-024 | Customer reserves maintenance workstation | Workstation state = Maintenance | Reservation rejected with clear reason | State | Critical |
| TC-G02-025 | Non-staff changes workstation state | Customer calls state toggle API | 403 Forbidden | Security | Critical |

---

## 6. TCS-G03 - Reservation Management

> Use Cases: UC-07 to UC-12, UC-14 to UC-16
> Key risks: double-booking, stale reservations, incorrect ownership, invalid time windows

---

### UC-07, UC-08: Browse Availability

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G03-001 | Find available rooms with valid date | Future date, valid filters | Available rooms listed | Positive | Major |
| TC-G03-002 | Find rooms with past date | Date in the past | Empty result or validation error | Negative | Major |
| TC-G03-003 | Maintenance workstation excluded | Workstation state = Maintenance | Not listed in availability | State | Critical |
| TC-G03-004 | Workstation with approved reservation excluded | Approved reservation overlaps time | Not listed in availability | State | Critical |
| TC-G03-005 | Filter by hardware specs | Filter by minimum RAM or OS | Only matching workstations listed | Positive | Minor |

---

### UC-09, UC-10: Create Reservation (Customer)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G03-006 | Reserve lab room (success) | Future date, valid time, room available, required fields | Reservation created with Pending status | Positive | Critical |
| TC-G03-007 | Reserve workstation (success) | Workstation Available, no overlap | Reservation created with Pending status | Positive | Critical |
| TC-G03-008 | End time before start time | end_time < start_time | Validation error | Negative | Critical |
| TC-G03-008b | End time equals start time | end_time = start_time | Validation error, end_time must be after start_time | Boundary | Critical |
| TC-G03-009 | Reserve in the past | Date in the past | Rejected, reservation not created | Negative | Critical |
| TC-G03-010 | Overlap with approved reservation | Overlaps approved reservation | Rejected, conflict error | Negative | Critical |
| TC-G03-011 | Missing purpose field | purpose empty | Validation error | Negative | Major |
| TC-G03-012 | Concurrent booking collision | Two requests for same slot | Only one succeeds, other gets conflict | Concurrency | Critical |

---

### UC-11: View Reservation History

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G03-013 | Customer views own history | Authenticated, data exists | List shows all statuses (Pending/Approved/Rejected/Cancelled) | Positive | Major |
| TC-G03-014 | Customer views other user history | Replace user_id in request | 403 Forbidden, only own reservations allowed | Security | Critical |
| TC-G03-015 | Empty history | No reservations | Friendly empty state shown | Positive | Minor |

---

### UC-12: Cancel Reservation (Customer)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G03-016 | Cancel pending reservation | Status = Pending, owner matches | Status = Cancelled, resource released | Positive | Critical |
| TC-G03-017 | Cancel approved reservation | Status = Approved | Rejected, only Pending can be cancelled | State | Critical |
| TC-G03-018 | Cancel another user's reservation | reservation_id belongs to another user | 403 Forbidden | Security | Critical |
| TC-G03-019 | Race: staff approve and customer cancel | Approve and cancel at same time | Atomic handling, no inconsistent state | Concurrency | Critical |

---

### UC-14, UC-15, UC-16: Queue Handling (Lab Staff)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G03-020 | Staff views pending queue | Pending reservations exist | Sorted list shown (FIFO) | Positive | Major |
| TC-G03-021 | Empty queue | No pending reservations | Friendly empty state shown | Positive | Minor |
| TC-G03-022 | Customer views queue | Customer calls queue API | 403 Forbidden | Security | Critical |
| TC-G03-023 | Approve reservation (valid) | Pending reservation, resource available | Status = Approved, slot locked | Positive | Critical |
| TC-G03-024 | Approve overlapping reservation | Conflicts with approved reservation | Rejected, atomic check fails | Concurrency | Critical |
| TC-G03-025 | Reject reservation with reason | Reason provided | Status = Rejected, reason saved, resource freed | Positive | Critical |
| TC-G03-026 | Reject reservation without reason | Reason empty | Validation error, reason required | Negative | Major |
| TC-G03-027 | Approve cancelled reservation | Status = Cancelled | Rejected, cannot process ended reservation | State | Major |
| TC-G03-027b | expected_users exceeds room capacity | expected_users > room capacity | Rejected, capacity exceeded | Negative | Major |
| TC-G03-027c | expected_users = 0 | expected_users = 0 | Validation error, expected_users >= 1 | Boundary | Minor |
| TC-G03-027d | expected_users = 1 (boundary) | expected_users = 1 | Reservation succeeds | Boundary | Minor |
| TC-G03-027e | Reservation duration too long (>8 hours) | Duration > 8 hours | Rejected or warning (per business rule) | Edge Case | Minor |

---

## 7. TCS-G04 - Incident Management

> Use Cases: UC-13, UC-17, UC-18
> Key risks: lost incident reports, invalid status transitions, customer access to staff features

---

### UC-13: Submit Incident Report (Customer)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G04-001 | Submit incident (success) | Valid room/workstation, category selected, description not empty | Ticket created with Open status | Positive | Critical |
| TC-G04-002 | Submit incident missing description | description empty | Validation error | Negative | Major |
| TC-G04-003 | Submit incident without category | category empty | Validation error | Negative | Major |
| TC-G04-004 | Submit incident with invalid workstation_id | workstation_id not found | Rejected, asset not found | Negative | Major |
| TC-G04-005 | Retry submit (idempotency) | Repeat request after network error | No duplicate ticket, safe success response | Edge Case | Minor |
| TC-G04-005b | Submit incident with invalid category | category = "invalid_category" | Validation error, allowed hardware/network/os/software | Negative | Major |
| TC-G04-005c | Missing both workstation_id and lab_room_id | Both fields null | Validation error, at least one required | Negative | Critical |
| TC-G04-005d | Submit incident without auth | No token | 401 Unauthorized | Security | Critical |

---

### UC-17, UC-18: Incident Dashboard and Updates (Lab Staff)

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G04-006 | Staff views incident list | Tickets exist | List shown, unresolved prioritized | Positive | Major |
| TC-G04-007 | Customer views staff incident list | Customer calls staff list API | 403 Forbidden | Security | Critical |
| TC-G04-008 | Update incident Open -> Under Review | Status = Open | Status = Under Review, notes saved | Positive | Critical |
| TC-G04-009 | Update incident Under Review -> Resolved | Status = Under Review, resolution note provided | Status = Resolved, note saved | Positive | Critical |
| TC-G04-010 | Invalid status transition (Open -> Resolved) | Skip Under Review step | Rejected, invalid transition | State | Major |
| TC-G04-011 | Update already resolved incident | Status = Resolved | Rejected or no further updates allowed | State | Minor |
| TC-G04-012 | Update incident with DB error | DB commit fails | Rollback, previous state preserved | Error Handling | Critical |

---

## 8. TCS-G05 - Security and RBAC

> Use Cases: all role-sensitive use cases
> Key risks: privilege escalation, token spoofing, brute force, token theft

---

### General Authorization Checks

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G05-001 | Call protected API without token | No Authorization header | 401 Unauthorized | Security | Critical |
| TC-G05-002 | Call API with expired access token | Token TTL expired | 401 Unauthorized | Security | Critical |
| TC-G05-003 | Call API with forged token | JWT signature invalid | 401 Unauthorized | Security | Critical |
| TC-G05-004 | Customer calls staff-only API | Valid customer token, staff endpoint | 403 Forbidden | Security | Critical |
| TC-G05-005 | Lab Staff calls admin-only API | Valid staff token, admin endpoint | 403 Forbidden | Security | Critical |
| TC-G05-006 | Access another user's resource | Change user_id/reservation_id | 403 Forbidden | Security | Critical |

---

### JWT and Session Checks

| # | Test Case | Preconditions | Expected Result | Type | Severity |
|---|---|---|---|---|---|
| TC-G05-007 | Refresh access token with valid refresh token | Valid refresh token in cookie | New access token issued | Positive | Critical |
| TC-G05-008 | Refresh with revoked refresh token | Token revoked or logged out | 401 Unauthorized | Security | Critical |
| TC-G05-009 | Verify refresh token cookie attributes | Inspect response headers | Cookie has Secure, HttpOnly, SameSite=Strict | Security | Major |
| TC-G05-010 | Rate limiting over 100 req/min | Send >100 requests in 1 minute | HTTP 429 Too Many Requests | Boundary | Major |

---

## 9. TCS-G06 - Non-Functional Requirements

> Related use cases: UC-07, UC-08, UC-09, UC-12, UC-15, UC-16, UC-26, UC-27, UC-31
> Key risks: slow responses, UI stalls, transaction errors, unclear validation feedback

---

### Performance

| # | Test Case | Target | Expected Result | Severity |
|---|---|---|---|---|
| TC-G06-001 | Read API response time | Key GET APIs (rooms, workstations, history) | Completes in < 1.0 s | Major |
| TC-G06-002 | Write API response time | Create/update/delete reservation, room, workstation | Completes in < 2.0 s | Major |
| TC-G06-003 | Availability grid render time | Large list (50+ workstations) | Render completes in < 500 ms | Major |
| TC-G06-004 | Concurrent booking load | Simulated concurrent booking | No deadlock; 1 success, others get clear conflict | Critical |

---

### Data Integrity and Error Handling

| # | Test Case | Condition | Expected Result | Severity |
|---|---|---|---|---|
| TC-G06-005 | Rollback on partial transaction failure | DB error after step 1 of 2 | No partial update, state unchanged | Critical |
| TC-G06-006 | Error responses do not leak sensitive data | Trigger DB error or exception | Response excludes SQL, stack trace, schema details | Security | Critical |
| TC-G06-007 | Clear validation feedback on UI | Submit invalid/missing fields | Field highlighted, specific message shown | Minor |
| TC-G06-008 | API response format consistency | Multiple endpoints | All responses use same JSON envelope | Minor |

---

## 10. Requirements Traceability Matrix

| Requirement | TCS Group | Primary Test Cases |
|---|---|---|
| UC-01 Sign Up | G01, G05 | TC-G01-001 to TC-G01-006, TC-G01-038 to TC-G01-047 |
| UC-02 Sign In | G01, G05 | TC-G01-007 to TC-G01-013 |
| UC-03 Sign Out | G01, G05 | TC-G01-014 to TC-G01-016 |
| UC-04 Reset Password | G01, G05 | TC-G01-017 to TC-G01-022 |
| UC-05 Update Profile | G01 | TC-G01-023 to TC-G01-026 |
| UC-06 Change Password | G01, G05 | TC-G01-027 to TC-G01-030 |
| UC-07 Browse Room Availability | G03, G06 | TC-G03-001 to TC-G03-005 |
| UC-08 Browse Workstation Availability | G02, G03, G06 | TC-G03-001 to TC-G03-005 |
| UC-09 Reserve Lab Room | G03, G06 | TC-G03-006 to TC-G03-012 |
| UC-10 Reserve Workstation | G03, G06 | TC-G03-006 to TC-G03-012 |
| UC-11 View Reservation History | G03, G05 | TC-G03-013 to TC-G03-015 |
| UC-12 Cancel Pending Reservation | G03, G05, G06 | TC-G03-016 to TC-G03-019 |
| UC-13 Submit Incident Report | G04 | TC-G04-001 to TC-G04-005 |
| UC-14 View Request Queue | G03, G05 | TC-G03-020 to TC-G03-022 |
| UC-15 Approve Reservation | G03, G05, G06 | TC-G03-023 to TC-G03-024 |
| UC-16 Reject Reservation | G03, G05, G06 | TC-G03-025 to TC-G03-027 |
| UC-17 View Incident Tickets | G04, G05 | TC-G04-006 to TC-G04-007 |
| UC-18 Update Incident Progress | G04, G05 | TC-G04-008 to TC-G04-012 |
| UC-19 Set Workstation State | G02, G03, G05 | TC-G02-022 to TC-G02-025 |
| UC-20 Create Lab Room | G02, G05 | TC-G02-001 to TC-G02-004 |
| UC-21 View Lab Room Details | G02, G05 | TC-G02-005 |
| UC-22 Update Lab Room | G02, G05 | TC-G02-006 to TC-G02-007 |
| UC-23 Delete Lab Room | G02, G05, G06 | TC-G02-008 to TC-G02-011 |
| UC-24 Add Workstation | G02, G05 | TC-G02-012 to TC-G02-016 |
| UC-25 View Workstation Specs | G02, G05 | TC-G02-017 |
| UC-26 Update Workstation | G02, G05, G06 | TC-G02-018 to TC-G02-019 |
| UC-27 Remove Workstation | G02, G05, G06 | TC-G02-020 to TC-G02-021 |
| UC-28 View User Directory | G01, G05 | TC-G01-031 to TC-G01-032 |
| UC-29 Block User | G01, G05 | TC-G01-033 to TC-G01-035 |
| UC-30 Unblock User | G01, G05 | TC-G01-036 to TC-G01-037 |
| NFR - Security/JWT | G05 | TC-G05-001 to TC-G05-010 |
| NFR - Performance | G06 | TC-G06-001 to TC-G06-004 |
| NFR - Data Integrity | G06 | TC-G06-005 to TC-G06-008 |

---

## 11. Pass/Fail Criteria

| Result | Definition |
|---|---|
| Pass | Actual result matches expected result; DB/system state updated correctly; no unauthorized side effects |
| Fail | Actual result deviates; invalid data allowed; wrong state; access control violation; performance threshold exceeded |
| Blocked | Cannot execute due to build, environment, or missing prerequisites |
| Not Run | Test case not executed |
| N/A | Feature not implemented or out of approved scope (state reason) |

---

## 12. Risks and Constraints

### Key Risks

| Risk | Impact | Mitigation |
|---|---|---|
| SRS and Test Plan disagree on dashboard/reporting | Confusion about UC-31 scope | Treat reporting as limited scope, mark N/A if not implemented |
| JWT storage differs between SRS and implementation | Security tests may fail | Use SRS as baseline; log deviations as defects |
| Concurrency behavior is hard to reproduce manually | Double-booking bugs missed | Use Cypress or API concurrency scripts |
| Email service unavailable | Reset/sign-up tests incomplete | Use sandbox mailbox or mock token retrieval |
| Seed data inconsistent across runs | False failures due to dirty data | Reset DB to baseline before each test cycle |

### Constraints

- Testing is black-box/system-level only (no source access)
- Performance results valid only for the stated environment and dataset size
- Do not store real passwords, signing keys, or production credentials
- Destructive data actions must be resettable to baseline

---

Total defined test cases: ~125 across 6 functional groups
