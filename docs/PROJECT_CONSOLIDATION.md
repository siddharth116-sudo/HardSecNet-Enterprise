# HardSecNet Project Consolidation

## Decision

The canonical implementation is the **web-based HardSecNet control plane + endpoint agent**.

The uploaded projects contained three major implementation directions:

1. **HardSecNet web platform** — Flask, React, MongoDB, Redis, endpoint agents, CIS engine, RBAC, reports.
2. **HardSecNet PySide** — strong local-first benchmark studio and useful architecture/testing documentation.
3. **HardSecNet marketing website** — polished static product site.

### What was selected

- Web control plane → canonical product
- React operations dashboard → canonical application UI
- Dependency-free endpoint agent → canonical endpoint integration
- CIS benchmark engine and scripts → canonical compliance engine
- Marketing website → included under `website/`
- PySide implementation → historical reference only

The PySide implementation should not remain as a second application in the GitHub repository. Maintaining two products creates architecture drift and doubles the testing surface.

## Why the web platform wins

A startup product needs:

- centralized visibility
- multiple endpoints
- client/workspace separation
- authentication and RBAC
- continuous reporting
- remote remediation workflows
- audit history
- integrations
- deployability

The web implementation already contains these product primitives. The PySide implementation is technically useful but is better suited to a local operator tool than a commercial control plane.

## Important cleanup performed

The canonical repository excludes:

- `.git`
- `.claude`
- Python virtual environments
- Node modules
- frontend build output
- generated reports
- machine snapshots
- certificates/private keys
- `.env`
- local databases
- Python bytecode

These are runtime artifacts, not product source.

## Remaining production hardening

The following should be treated as explicit engineering work rather than hidden behind marketing language:

- persistent JWT revocation
- stronger agent identity/enrollment
- durable remediation jobs
- remediation acknowledgement/verification
- audit-event immutability
- rate-limit storage in Redis
- observability/metrics
- backup and restore automation
- dependency pinning and reproducible builds
- integration tests against MongoDB/Redis
- deployment secret management

The architecture is suitable for a serious MVP; those controls move it toward a commercial SaaS platform.
