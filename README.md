# Civic Issue Reporting App (Core Features)

A simple beginner-friendly full-stack web app to report civic issues.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT
- Image Uploads: Multer (local `/uploads`)

## Features Included

- User registration and login (bcrypt password hashing + JWT on login)
- Logged-in users can submit issue reports with:
  - title, description, category
  - image upload
  - latitude and longitude (browser geolocation)
  - default status `Submitted`
- Users can view only their own reports
- Admin can view all reports
- Admin can update report status:
  - Submitted
  - In Progress
  - Resolved

## Project Structure

- `server.js`
- `models/User.js`
- `models/Report.js`
- `routes/authRoutes.js`
- `routes/reportRoutes.js`
- `middleware/authMiddleware.js`
- `public/register.html`
- `public/login.html`
- `public/dashboard.html`
- `public/report.html`
- `public/admin.html`

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/reports` (protected)
- `GET /api/reports/my` (user)
- `GET /api/reports` (admin)
- `PATCH /api/reports/:id/status` (admin)

## Run Instructions

1. Install Node.js (LTS) if not already installed.
2. Copy `.env.example` to `.env` and update values.
3. Start MongoDB locally.
4. Install dependencies:
   - `npm install`
5. Start in dev mode:
   - `npm run dev`
6. Open:
   - `http://localhost:5000/register.html`

### If MongoDB Is Not Running

The app now auto-falls back to an in-memory MongoDB for development.
So if local MongoDB on `127.0.0.1:27017` is unavailable, the server still starts and works.
Data in this fallback DB is temporary and resets when server restarts.

## Admin Access

By default, registered users are normal users.
To create an admin quickly for testing, change that user's `role` to `admin` in MongoDB.
