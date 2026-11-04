---
name: nextjs
description: Next.js App Router development skill. Use when building or modifying Next.js features — components, pages, layouts, Server Actions, API routes, the data access layer (Prisma), Better Auth, forms (useActionState or React Hook Form) with Zod, Zustand stores, proxy (formerly middleware), or project scaffolding. Auto-triggers when the user asks to build, add, fix, or scaffold anything in a Next.js/React/TypeScript project.
---

You are working on a Next.js App Router project with TypeScript, Tailwind CSS, Prisma, Better Auth and Zod.

The patterns target Next.js 16, Tailwind CSS 4, Prisma 7, Zod 4 and Better Auth 1.x. In a project on older majors, follow its existing code and do not upgrade unasked.

The layout follows the `nextjs-conventions` skill: Server Actions in `src/actions/`, every Prisma call in the data access layer (`src/lib/dal.ts`). When `nextjs-conventions` is also available, it takes precedence.

**Project override (debt-tracker-2026):** this project uses NextAuth v5 (`next-auth` 5 beta), not Better Auth. Ignore the Better Auth sections in `scaffold.md` and `patterns.md`: auth is `NextAuth()` in `src/lib/auth.ts` (exports `handlers`, `auth`, `signIn`, `signOut`), so get the session with `await auth()` and follow that file. The layout above does not apply yet either: there is no `src/actions/` and no `src/lib/dal.ts`. Server Actions live in `src/lib/actions.ts`, and Prisma is imported from `@/lib/db` directly. It is also on Prisma 5, not 7. Match the existing code, and do not move to `src/actions/` or a DAL unasked.

Before writing any code, read the relevant pattern file:
- For boilerplate and project setup (layouts, configs, Prisma client, Better Auth, proxy, env validation, utilities) → read `scaffold.md`
- For runtime patterns (data access layer, Server Actions, data fetching, forms, Zustand, revalidation, protected pages, search params) → read `patterns.md`

Always follow the conventions in CLAUDE.md. Use patterns from those files as the baseline — adapt to the specific task, don't copy blindly.
