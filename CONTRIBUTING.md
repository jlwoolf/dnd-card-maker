# Contributing to DnD Card Maker

Thanks for your interest in contributing! This document outlines the process and conventions.

## Getting Started

1. Fork the repository and clone it locally.
2. Follow the [Development Guide](docs/development.md) to set up your environment.
3. Create a branch for your work (`feat/description` or `fix/description`).

## Development Workflow

- **Backend** (`backend/`): Python 3.12+, FastAPI, SQLAlchemy, pytest
- **Frontend** (`frontend/`): React 19, TypeScript, Vite, Vitest, Playwright

See [docs/development.md](docs/development.md) for full setup instructions.

### Before Submitting

Run the full test suite and linters:

```bash
# Backend
cd backend && uv run ruff check && uv run pytest -v

# Frontend
cd frontend && npm run lint && npm run test && npm run test:e2e
```

## Code Conventions

### Backend (Python)
- Follow [Ruff](https://docs.astral.sh/ruff/) linting rules configured in `backend/pyproject.toml`.
- Use type hints everywhere.
- Add tests for new routes and service functions in `backend/tests/`.
- Use `double` quotes for strings.

### Frontend (TypeScript)
- Follow the ESLint flat config in `frontend/eslint.config.js`.
- Use functional components and hooks — no class components except `ErrorBoundary`.
- Use Zustand stores in `frontend/src/stores/` for shared state.
- Use Zod schemas in `frontend/src/schemas/` for data validation.
- Avoid adding comments unless explaining non-obvious logic.

### Commit Messages

Use conventional commit format:

```
feat: add card element rotation
fix: resolve CORS issue on image proxy
docs: update API reference
refactor: extract deck service helpers
test: add sharing flow integration tests
```

## Pull Request Process

1. Ensure all tests pass and lint checks are clean.
2. Update documentation in `docs/` if your change affects user-facing features, configuration, or APIs.
3. Add a clear description of what the PR does and why.
4. Reference any related issues.

## Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template. Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, deployment method, version)

## Feature Requests

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template. Describe the use case and how it fits within the project's scope.

## Questions?

Open a discussion or issue on GitHub.
