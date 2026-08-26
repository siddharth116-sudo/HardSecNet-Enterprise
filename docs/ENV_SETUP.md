# Environment Variable Setup Guide

## 1. Frontend (Dashboard) SETUP
The React frontend uses **Vite**, so variables must be prefixed with `VITE_`.

1. Go to `Dashboard/` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` to match your local backend URL:
   ```ini
   VITE_API_BASE_URL=http://localhost:5000
   ```
4. **Production**: Create `.env.production` for build time variables.

## 2. Backend (Flask) SETUP
The Python backend uses `python-dotenv`.

1. Go to `HardSecNet_Project/` (root) directory.
2. We have already installed `python-dotenv`.
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. **CRITICAL**: Change the `JWT_SECRET_KEY` in `.env` to a secure random string!
   ```ini
   JWT_SECRET_KEY=long-random-string-here
   MONOGO_URI=mongodb://localhost:27017/
   ```

## 3. Security Rules
- **NEVER** commit `.env` or `.env.production` to Git.
- **ALWAYS** add `.env` files to `.gitignore`.
- Use `.env.example` to share the *structure* of configuration with the team, but fill it with placeholder values only.
