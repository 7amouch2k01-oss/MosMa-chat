# NexChat Security Architecture

This document outlines the security measures implemented in the NexChat platform to ensure user data protection and system integrity.

## 🛡️ Core Security Layers

### 1. Request Security & Headers
*   **Helmet.js**: Implemented to set secure HTTP headers (XSS protection, Clickjacking prevention, etc.).
*   **CORS**: Strict Cross-Origin Resource Sharing policies to only allow authorized domains.
*   **HPP (HTTP Parameter Pollution)**: Protection against parameter pollution attacks.
*   **Rate Limiting**: API rate limits enforced to prevent Brute Force and DDoS attacks.

### 2. Data Protection
*   **Password Hashing**: Uses `bcryptjs` with a salt factor of 10. Passwords are never stored in plain text.
*   **JWT (JSON Web Tokens)**: Secure stateless authentication using `HS256` algorithm.
*   **Env Security**: Sensitive keys (JWT Secret, MongoDB URI) are stored in `.env` and never committed to version control.

### 3. Input Validation & Sanitization
*   **Manual Validation**: Comprehensive validation in `authController.js` and `userController.js` to ensure data integrity.
*   **Frontend Validation**: Strong password policies (8+ chars, Uppercase, Numbers) implemented in `Register.jsx`.
*   **NoSQL Injection**: 
    > [!NOTE]
    > `express-mongo-sanitize` was intentionally removed because it is currently incompatible with Express 5 and causes 500 Internal Server Errors. Protection against NoSQL injection is handled via Mongoose's strict schema enforcement and manual input sanitization.

### 4. Admin & Access Control
*   **Banning System**: Administrative capability to instantly revoke user access.
*   **Unique Tags**: 4-digit unique identifiers to prevent account impersonation and simplify discovery.

## ⚠️ Recommendations for Production
1.  **SSL/TLS**: Always serve the application over HTTPS.
2.  **Secret Rotation**: Periodically rotate the `JWT_SECRET`.
3.  **Audit Logs**: Review `Log` models for suspicious activity.

---
*NexChat Security Team*
