# Coding Conventions

This document describes the coding conventions and best practices used in this project. Following these conventions ensures consistent, maintainable, and readable code across the team.

## 1. General
- All code should be written in **TypeScript**.
- Use **camelCase** for variables and functions.
- Use **PascalCase** for React components and TypeScript types/interfaces.
- Avoid `any` type unless absolutely necessary; prefer precise typing.
- Keep functions small and focused on a single responsibility.

## 2. React & Components
- Functional components with **React Hooks** are preferred.
- Component files should be named after the component, e.g., `Button.tsx`.
- Folder structure for components:
```
  src/
  components/
  Button/
  Button.tsx
  Button.test.tsx
  Button.module.css (if not using Tailwind)
```
- Prefer **composition to inheritance**.
- Use **React Query** (or chosen state management) for data fetching.

## 3. Styling
- Use **Tailwind CSS** for styling.
- Avoid inline styles unless necessary.
- Use **responsive design utilities** for mobile-first layout.

## 4. Testing
- Write **unit tests** for all new components and functions.
- Use **Vitest** + **React Testing Library**.
- Test file naming convention: `<Component>.test.tsx` or `<function>.test.ts`.

## 5. Linting & Formatting
- Use **ESLint** and **Prettier** for code quality.
- Run `lint-staged` pre-commit hooks via **Husky**.
- Always fix linting errors before committing.

## 6. Git & Branching
- Use **feature branches**: `feature/<short-description>`
- Use **PR titles** that clearly describe the change.
- Rebase frequently to keep history clean.


