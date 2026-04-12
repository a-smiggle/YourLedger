# Pre-Release Checklist

## Automated Validation

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm test:e2e`.

## Manual Browser QA

- [ ] Confirm the landing, dashboard, scenarios, results, lenders, and data-management routes open without console or rendering errors.
- [ ] Confirm local storage hydration restores the prior session without flashing stale values.
- [ ] Confirm export, import, reset, and clear-data flows show the expected feedback messages.
- [ ] Confirm chart labels remain readable on desktop and mobile layouts.
- [ ] Confirm the mobile menu, dialogs, skip link, and focus states are keyboard accessible.

## Browser Matrix

- [ ] Chromium desktop
- [ ] Firefox desktop
- [ ] Safari or WebKit desktop
- [ ] Android Chrome or Pixel-class mobile emulation
- [ ] iPhone Safari or iPhone-class mobile emulation

## Release Notes Review

- [ ] Review `README.md` so setup, validation, and browser coverage match the shipped build.
- [ ] Review in-app general-information messaging and route copy against the latest product behavior.
- [ ] Capture any known issues or deferred items before tagging a release.