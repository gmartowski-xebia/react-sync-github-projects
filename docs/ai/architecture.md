# Architecture

This document describes the technical stack and tools used in this React application.

## Frontend
- **React.js** with **TypeScript** for building type-safe, component-based UI
- **Tailwind CSS** for utility-first styling
- **Vite** as the build tool and development server

## Code Quality & Testing
- **ESLint** + **Prettier** for linting and code formatting
- **Vitest** + **React Testing Library** for unit and component testing
- **Husky** + **lint-staged** to enforce pre-commit checks

## CI/CD
- **GitHub Actions** for continuous integration and deployment
    - Runs ESLint, tests, and build on each push
