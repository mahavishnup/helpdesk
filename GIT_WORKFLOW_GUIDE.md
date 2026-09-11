# 🧭 Git Workflow & Conventional Commits Guide

This document serves as the team's standard reference for version control, branch conventions, commit formatting, and quality gating.

---

## 📌 Overview

All contributions must follow the **Conventional Commits** specification (`type(scope): description`) to ensure clean, readable, and machine-parsable history.

---

## 🏷️ Conventional Commits Standard

### Commit Format
```text
<type>(<scope>): <short description in imperative mood>

[optional detailed body describing the 'why' and architectural decisions]

[optional footer referencing issue numbers or breaking changes]
```

### Approved Types
* **`feat`**: A new user-facing feature, model, service, or API endpoint.
* **`fix`**: A bug fix (e.g. correcting a status transition rule, fixing an SLA calculation).
* **`docs`**: Documentation-only updates (e.g. README.md, ARCHITECTURE.md).
* **`style`**: Formatting adjustments that do not alter execution (Pint, whitespace).
* **`refactor`**: Code restructuring without changing external behavior.
* **`perf`**: Performance improvements (e.g. composite indexes, query optimization, streaming).
* **`test`**: Adding missing tests or correcting existing tests.
* **`chore`**: Maintenance, package dependencies, configuration, or tooling updates.

### Project Scopes
Common scopes to use:
- `tickets` — Ticket CRUD, business rules, and UI
- `database` — Migrations, seeders, factories, indexes
- `api` — Controllers, endpoints, routing
- `ui` — React components, layouts, pages
- `auth` — Authentication, Fortify, session guards
- `workflow` — CI/CD, guides, linting configs

### Examples of Good Commit Messages
- `feat(tickets): add SLA health computation and breach detection engine`
- `fix(tickets): prevent status transition from closed tickets`
- `test(tickets): add feature test verifying urgent priority requires due date`
- `perf(database): add composite index on status, priority, and created_at`
- `style(tickets): format PHP code with Laravel Pint`
- `docs(readme): add local setup and test run instructions`

---

## 🏗️ Branching Strategy

```text
master (production-ready stable baseline)
  └── feature/<name>   # Feature development
  └── fix/<name>       # Bug fix development
```

- Keep branches short-lived and focused on a single responsibility.
- Rebase or squash feature branches cleanly before merging into `master`.

---

## 🔍 Pre-Commit Quality Verification Sequence

Always run the project shortcut scripts before committing:

```bash
# 1. Run PHP code style formatting
composer run lint

# 2. Run static analysis & type checking
composer run types:check
npm run types:check

# 3. Run automated tests
composer run test

# 4. Verify frontend build
npm run build
```

Or run the complete automated CI check in a single command:
```bash
composer run ci:check
```
