# Mehregan Clinic — Working Agreement

## Project

- This is a React/Vite + Express + PostgreSQL clinic application.
- The production domain is `https://mehreganpetclinic.ir`.
- The local project root is `Z:\Projects\mehreganClinic\Version5New`.

## Before changing code

- Inspect the current implementation and preserve unrelated user changes.
- Use real PostgreSQL-backed data; do not add display/demo records to production flows.
- Keep experimental or incomplete modules hidden from ordinary clinic users.
- Treat `uu.txt`, `.env`, authentication files, tokens, and clinical data as sensitive. Never print their contents.

## Validation

- Run `npm run lint` and `npm run build` after code changes.
- Run `npm run production:smoke` for API-facing changes.
- For deployment, keep the previous `/var/www/dist` version recoverable and verify HTTPS plus `/api/health`.

## Reporting

- Report in concise Persian.
- Group work into large steps and state only the result, blockers, and next action.
