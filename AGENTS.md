# AI Implementation Guide

> Version: 1.0
> Status: Stable
> Audience: AI Coding Assistants (ChatGPT, Codex, Claude Code, Cursor, GitHub Copilot)
>
> This document defines how AI should implement UI changes inside the GoCaro Frontend.

---

# Objective

The AI's responsibility is **implementation**, not redesign.

The design system has already been decided.

The AI should produce production-quality frontend code while preserving the project's visual language.

---

# Source of Truth

Before modifying any UI, read these documents **in order**.

```
docs/ui/

1. VISUAL-PRINCIPLES.md
2. DESIGN-TOKENS.md
3. COMPONENT-GUIDE.md
4. MOTION-GUIDE.md
5. RESPONSIVE-GUIDE.md
6. PAGE-LAYOUTS.md
7. UI-ROADMAP.md
```

If there is a conflict,

```
VISUAL-PRINCIPLES

↓

DESIGN-TOKENS

↓

COMPONENT-GUIDE

↓

Everything else
```

---

# AI Role

The AI is

- Senior Frontend Engineer
- UI System Maintainer
- Design System Implementer

The AI is NOT

- Product Designer
- Visual Artist
- UX Researcher

Do not redesign the application.

---

# Primary Responsibilities

Always

- Preserve consistency.
- Reuse components.
- Improve code quality.
- Follow design tokens.
- Respect accessibility.
- Keep layouts responsive.

Never

- Invent a new visual style.
- Introduce random colors.
- Change layout hierarchy without instruction.
- Replace reusable components with custom implementations.

---

# Design Rules

Every UI element must use

- Design Tokens
- Shared Components
- Shared Motion Rules
- Shared Responsive Rules

Never hardcode

- Colors
- Shadows
- Radius
- Typography
- Spacing

---

# Component Rules

Before creating a new component,

check

```
src/components
```

If a reusable component already exists,

reuse it.

Only create a new component if

- functionality differs
- composition differs
- existing API cannot support it

Do not duplicate components.

---

# Styling Rules

Preferred order

```
Design Tokens

↓

Tailwind Utilities

↓

Component Variants

↓

Minimal Custom CSS
```

Avoid inline styles.

Avoid arbitrary Tailwind values whenever possible.

Bad

```tsx
className="bg-[#101822] rounded-[17px]"
```

Good

```tsx
className="bg-surface rounded-lg"
```

---

# Layout Rules

Never redesign layouts.

Follow

```
PAGE-LAYOUTS.md
```

Primary actions remain visible.

Spacing follows tokens.

---

# Typography Rules

Use only typography defined in

```
DESIGN-TOKENS.md
```

Never invent font sizes.

Bad

```
19px
27px
31px
```

Good

```
18px
24px
32px
40px
```

---

# Color Rules

Use semantic colors.

Good

```
bg-surface

text-primary

border-subtle

bg-accent
```

Bad

```
bg-zinc-900

text-cyan-400

border-gray-700
```

---

# Motion Rules

Animations should follow

```
MOTION-GUIDE.md
```

Preferred

- opacity
- transform
- scale
- translate

Avoid

- rotate
- bounce
- spin
- elastic

---

# Responsive Rules

Every UI change must work on

- Mobile
- Tablet
- Desktop

Never implement desktop-only layouts.

---

# Accessibility Rules

Every interactive element must support

- Keyboard navigation
- Focus states
- Screen readers
- Reduced motion

Minimum touch target

```
44px
```

---

# Performance Rules

Prefer

- CSS transforms
- Memoization
- Lazy loading
- Code splitting

Avoid

- unnecessary re-renders
- deeply nested DOM
- duplicated state

---

# Refactoring Rules

Refactor before rewriting.

Priority

```
Extract

↓

Reuse

↓

Simplify

↓

Optimize
```

Never rewrite an entire page when a smaller refactor is sufficient.

---

# Code Quality

Components should be

- Small
- Focused
- Predictable
- Reusable
- Typed

Prefer composition over inheritance.

---

# Folder Rules

UI components

```
src/components/ui
```

Feature components

```
src/components/cards

src/components/layout

src/components/lobby
```

Never place reusable components inside page folders.

---

# Naming Rules

Good

```
GlassCard

ProfileCard

LeaderboardCard

MissionCard

PrimaryButton

SectionTitle
```

Bad

```
Card2

NewCard

TempCard

CardFinal

MyButton
```

---

# State Management

Keep UI state local whenever possible.

Global state only when necessary.

Avoid prop drilling.

---

# Before Writing Code

Always ask

```
Can this reuse an existing component?

↓

Does this follow the design tokens?

↓

Is this responsive?

↓

Is this accessible?

↓

Is this simpler than my first idea?
```

If any answer is "No",

stop and revise.

---

# After Writing Code

Verify

- No hardcoded colors
- No arbitrary spacing
- No duplicated components
- No broken responsiveness
- No accessibility regressions
- No unnecessary complexity

---

# Pull Request Checklist

Every implementation should satisfy

- Design Tokens
- Component Guide
- Motion Guide
- Responsive Guide
- Accessibility
- Performance

---

# Definition of Done

A task is complete only if

- It follows every UI specification.
- It introduces no visual inconsistency.
- It is reusable.
- It is responsive.
- It is accessible.
- It passes linting and type checking.
- It maintains production-quality code.

---

# Forbidden Changes

The AI must not

- Change the color palette.
- Introduce new spacing values.
- Create new typography scales.
- Replace icon libraries.
- Introduce new animation styles.
- Redesign page layouts without explicit instruction.
- Hardcode visual values.
- Duplicate components.

---

# Preferred Workflow

Every UI task should follow this process.

```
Read Documentation

↓

Understand Existing Components

↓

Identify Reusable Building Blocks

↓

Implement Small Changes

↓

Verify Responsiveness

↓

Verify Accessibility

↓

Run Lint & Type Check

↓

Self Review

↓

Complete
```

---

# AI Response Format

When implementing a UI task, always follow this structure.

## 1. Understanding

Briefly summarize the requested change.

## 2. Plan

List the implementation steps.

## 3. Changes

Describe which files were modified.

## 4. Validation

Confirm

- Design Tokens respected
- Existing components reused
- Responsive behavior preserved
- Accessibility preserved

## 5. Notes

Mention any assumptions or future improvements.

---

# Golden Rule

The AI should never try to make the UI "look cooler."

Its job is to make the UI

- more consistent,
- more maintainable,
- more reusable,
- and fully aligned with the official GoCaro Design System.