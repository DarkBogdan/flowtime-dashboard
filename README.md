# Flowtime Dashboard

A lightweight SPA dashboard for employee management and time tracking, built with vanilla JavaScript and modern CSS.

The project focuses on clean UI architecture, predictable state management, and responsive design without external frameworks.

---

## Features

- Client-side authentication with session persistence
- Employee management (add, edit, filter, sort)
- Time tracking with live timer and activity state
- Dark / Light theme toggle using CSS variables
- Fully responsive layout (desktop → mobile)
- Mobile-friendly table-to-card transformation
- Accessible keyboard interactions and focus states

---

## Tech Stack

- **HTML5** — semantic markup
- **CSS3**
  - Custom properties (CSS variables)
  - Animations and transitions
  - Responsive layouts with media queries
- **Vanilla JavaScript (ES6+)**
  - Modular architecture
  - Event-driven UI logic
  - LocalStorage persistence
- **No frameworks or libraries**

---

## Architecture Decisions

- **Single-page layout** without routing libraries  
  All views are conditionally rendered via CSS classes and application state.

- **Theme management via root-level CSS variables**  
  Dark mode is implemented by toggling a class on the `<html>` element, allowing full theme switching without duplicating component styles.

- **State persistence with LocalStorage**  
  Authentication status, current page, employees data, and timer state are preserved across page reloads.

- **Separation of concerns**
  - UI logic
  - business logic
  - state persistence  
  are kept isolated and predictable.

---

## Responsive Strategy

- Desktop-first layout with mobile overrides
- Tables are converted into **card-based layout on small screens** using pure CSS
- No duplicated markup for mobile views
- Touch-friendly controls and adaptive spacing
- Layout adjustments handled via CSS variables where possible

---

## Accessibility & UX

- Keyboard navigation support (Enter / Escape)
- Focus-visible styles for interactive elements
- Disabled states handled both visually and logically
- Smooth animations with respect to user interaction flow

---

## Project Status

**Portfolio project**

This project was built to demonstrate:
- solid front-end fundamentals
- UI architecture thinking
- responsive and accessible design
- clean, readable code without frameworks

---

