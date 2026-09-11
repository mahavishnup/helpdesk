# 🚀 Quick Start Guide — Support Ticket Management System

This guide provides a rapid bootstrap sequence for developers and technical assessors evaluating this repository.

---

## ⚙️ Prerequisites

Ensure your development environment meets the following specifications:
- **PHP**: `>= 8.4` (with PDO MySQL, OpenSSL, Mbstring, BCMath, Tokenizer)
- **Composer**: `>= 2.x`
- **Node.js**: `>= 20.x` & **npm**: `>= 10.x`
- **MySQL**: `>= 8.0` / MariaDB (or Laravel Herd with MySQL enabled)

---

## 🏗️ 1. Rapid Setup Sequence

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd helpdesk
```

### Step 2: Install Dependencies
```bash
# Install PHP Composer dependencies
composer install

# Install Node.js frontend dependencies
npm install
```

### Step 3: Configure Environment
Copy `.env.example` to `.env` and generate the application encryption key:
```bash
cp .env.example .env
php artisan key:generate
```

Verify your MySQL connection credentials in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk
DB_USERNAME=root
DB_PASSWORD=password
```

### Step 4: Run Migrations & Seeders
Execute database migrations and seed realistic support tickets with audit timeline history:
```bash
php artisan migrate:fresh --seed
```

*Default Seeded Credentials:*
- **Email**: `test@example.com`
- **Password**: `password`

---

## 🏃 2. Launch Local Development Servers

In terminal 1 (Laravel backend server):
```bash
php artisan serve
```

In terminal 2 (Vite + Inertia React HMR):
```bash
npm run dev
```

Visit the application at `http://127.0.0.1:8000` (or `http://helpdesk.test` via Laravel Herd).

---

## 🧪 3. Running Automated Tests

Run the complete feature test suite via Pest:
```bash
# Run ticket management tests
php artisan test --filter=Ticket

# Run full application test suite
php artisan test --compact
```

---

## 🎨 4. Code Quality & Linting

```bash
# Format PHP files according to team PSR-12 rules (Pint)
vendor/bin/pint --format agent

# Validate TypeScript types without emit
npm run types:check

# Compile production frontend assets
npm run build
```

---

## 📚 5. Documentation Directory

- **Database Architecture & ERD**: [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)
- **System Architecture & Data Flow**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Conventional Commits & Git Guide**: [GIT_WORKFLOW_GUIDE.md](GIT_WORKFLOW_GUIDE.md)
- **Master Project Implementation Plan**: [PROJECT_PLAN.md](PROJECT_PLAN.md)
