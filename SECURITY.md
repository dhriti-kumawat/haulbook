# Security

## Reporting a problem

Email the maintainer (see the GitHub profile) rather than opening a public issue. Please include
steps to reproduce. We aim to reply within a few days.

## How Haulbook protects data

- **Accounts:** passwords hashed with bcrypt (cost 12), 8–128 characters; sign-in gives the same
  answer and timing whether or not an account exists; resetting a password signs out every other
  session. Google sign-in only accepts Google-verified emails, and signing in with Google removes any
  password set by someone who registered that email before its owner.
- **Abuse limits:** sign-in, sign-up, password reset, link import, voice add and test messages are
  rate-limited per person or network, counted in the database so limits hold across servers.
- **Requests:** every data API checks the signed-in user owns what they read or change. Requests
  that change data must come from Haulbook's own pages (origin check), on top of SameSite cookies.
- **Browser:** strict security headers (content security policy, HSTS, no framing, no MIME
  sniffing, camera and location off, microphone only for our own pages).
- **Link import:** only public web addresses are fetched; private and internal addresses are refused.
- **Database:** Supabase row-level security is on for every table and the public API roles have no
  access; only the server connects.
- **Secrets:** kept in Vercel environment variables, never in the repository.
- **Dependencies:** CI type-checks, builds and runs `npm audit` on every pull request; Dependabot
  opens weekly update pull requests.

## Known limits

- Inline scripts are allowed by the content security policy (Next.js needs them); moving to
  per-request nonces would tighten it further.
- Emails aren't verified at sign-up yet; verifying them would also allow showing whether an email
  is already registered without helping attackers.
