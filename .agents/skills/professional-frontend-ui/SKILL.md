---
name: professional-frontend-ui
description: Analyze, redesign, and polish Funkollection Vue pages and components so they are professional, cohesive, responsive, accessible, and production-ready while preserving behavior. Use for page redesigns, UI or UX reviews, dashboard modernization, component polish, responsive improvements, visual hierarchy, design-system consistency, or applying the Funkollection visual identity. Do not use for backend-only work, Firebase rules, database migrations, or unrelated debugging.
---

# Professional Frontend UI

Improve one requested Funkollection interface completely and cohesively. Preserve working application behavior and avoid unrelated or repository-wide redesigns unless explicitly requested.

## Follow the workflow

### 1. Inspect before editing

- Read the target component in full and inspect its related child and parent components.
- Inspect the router entry, surrounding layout, shared components, and relevant composables or stores. Do not assume the page is isolated.
- Inspect `package.json`, Tailwind and Vite configuration, global CSS, PrimeVue setup and version, theme variables, brand guidance, and existing reusable UI patterns.
- Identify functionality that must remain intact: props, emits, events, routes, forms, Firebase calls and queries, authentication, permissions, loading states, and data models.
- Look for suitable existing components and styles before creating new ones.

### 2. Give a brief UI assessment

Before implementation, concisely report:

- visual and usability problems;
- inconsistent patterns;
- responsive and accessibility concerns;
- the proposed visual direction; and
- files likely to change.

Keep the assessment actionable, then proceed unless a missing requirement could materially change functionality or brand direction.

### 3. Preserve behavior

- Do not unintentionally change business logic, Firebase queries, authentication, permissions, routing, form submission, event handlers, component contracts, emitted events, props, or data models.
- Do not delete working features because they complicate the layout.
- Do not replace live application data with mock data.
- Do not rewrite working logic merely to make it different.
- Explain any structural change required to support the redesign.

### 4. Apply the Funkollection direction

Create an interface that feels modern, clean, inviting, collectible-focused, distinctive, and trustworthy without becoming overly corporate.

Favor:

- spacious but efficient layouts;
- clear page headings and strong information hierarchy;
- clean cards, purposeful borders, restrained shadows, and consistent radii;
- readable typography and consistent spacing;
- clear loading, error, and empty states;
- obvious primary actions;
- subtle hover and focus feedback; and
- meaningful, consistent use of brand colors.

Follow the repository's brand guidance and existing CSS variables. In particular, inspect `src/assets/base.css`, `src/assets/main.css`, and `docs/funkollection_brand_guidelines.png` when relevant. Prefer the existing primary, secondary, background, text, soft-white, and premium-gradient tokens over hardcoded colors.

Avoid:

- excessive gradients, glassmorphism, shadows, animation, or competing accent colors;
- giant headings, deeply nested cards, overly rounded bubble styling, and random decoration;
- generic AI-dashboard aesthetics;
- changing the brand from page to page; and
- emojis as primary interface icons.

Do not introduce stock or generated imagery unless explicitly requested.

### 5. Maintain design-system consistency

Before adding styles, identify or establish proportionate conventions for:

- page width, horizontal padding, headers, and section spacing;
- card padding, borders, shadows, and radii;
- typography scale and muted text;
- primary, secondary, and destructive actions;
- forms, tables, search, and filter controls;
- badges and status indicators;
- empty states and loading skeletons;
- dialogs and mobile layouts.

Prefer shared classes, reusable Vue components, CSS variables, Tailwind theme values, or small design tokens over repeated arbitrary values. Do not build a full component library for a one-page task. Extract a component only when repetition or likely reuse justifies it.

### 6. Use PrimeVue deliberately

- Use an existing PrimeVue component when it appropriately solves the problem.
- Match PrimeVue styling to the application and avoid mixing inconsistent component treatments.
- Preserve accessibility behavior supplied by PrimeVue.
- Check the installed PrimeVue version before selecting APIs or props; never invent unsupported props.
- Prefer simple semantic HTML when a heavier component provides no meaningful benefit.
- Use existing icon libraries before adding another dependency.

### 7. Design responsively

Review the result at approximately 375px, 768px, 1024px, and 1440px.

- Prevent unintended horizontal scrolling.
- Keep touch targets usable and actions discoverable.
- Let controls wrap deliberately without cramping text.
- Give tables an intentional mobile strategy rather than blindly stacking every element.
- Ensure dialogs fit small screens and navigation remains usable.
- Prevent cards from becoming excessively narrow and balance desktop whitespace.
- Respect the existing 768px breakpoint and fixed mobile-header spacing where applicable.

### 8. Improve accessibility

- Use semantic HTML, buttons for actions, and links for navigation.
- Preserve keyboard navigation and provide visible focus states.
- Associate labels with controls and give buttons accessible names.
- Maintain dialog semantics and understandable validation messages.
- Ensure sufficient contrast and communicate status with more than color alone.
- Hide purely decorative icons from assistive technology when appropriate.
- Respect reduced-motion preferences whenever introducing motion.

### 9. Cover relevant interface states

For every data-driven interface, account for the states that apply:

- loading and loaded;
- empty;
- search with no results;
- filters with no results;
- error;
- disabled;
- saving;
- success;
- destructive confirmation; and
- unauthenticated or unauthorized.

Do not polish only the populated success state.

### 10. Implement cleanly

- Follow the Vue 3 conventions and Composition API or Options API pattern already used nearby.
- Keep components focused and avoid massive files or duplicated markup.
- Avoid unnecessary dependencies and unexplained magic numbers.
- Remove obsolete styles made unnecessary by the redesign.
- Do not leave commented-out code or present placeholder behavior as complete.
- Keep naming clear and consistent.
- Make reasonable visual decisions without repeatedly requesting subjective preferences.
- Modify only the requested interface and directly supporting shared code.

### 11. Validate the result

Run applicable repository commands, including:

1. the configured formatter;
2. linting;
3. type checking;
4. the production build;
5. relevant tests; and
6. responsive inspection using available browser tooling.

Then:

- inspect the final diff for accidental functional changes;
- verify imports and component registrations;
- check for console errors; and
- confirm the relevant responsive states as far as tools allow.

Do not claim a check succeeded unless its command actually completed successfully. If a check fails for an unrelated pre-existing reason, distinguish it clearly from issues introduced by the redesign. Be careful with configured fix-mode commands such as `npm run lint`; inspect their resulting changes.

## Report the completed work

Structure the final response around:

1. what was improved;
2. files changed;
3. reusable patterns introduced;
4. functional behavior preserved;
5. validation performed; and
6. remaining concerns or recommended follow-up work.

Name specific improvements rather than saying only that the interface was modernized.
