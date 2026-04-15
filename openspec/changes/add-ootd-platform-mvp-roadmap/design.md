## Context
The team is building an OOTD platform using a monorepo with `apps/api`, `apps/web`, and `apps/admin`. The MVP must support user-generated outfit content, recommendation workflows, and moderation controls while keeping delivery risk manageable.

## Goals / Non-Goals
- Goals:
  - Provide an end-to-end roadmap from setup to production launch.
  - Cover database schema, backend APIs, frontend surfaces, and admin operations.
  - Provide measurable release and post-launch tracking criteria.
- Non-Goals:
  - Prescribe final UI design details.
  - Lock in a v2 recommendation model architecture.
  - Define non-MVP capabilities (chat, marketplace, full social graph).

## Decisions
- Decision: Use a phased 8-week MVP roadmap with dependencies across infrastructure, data model, APIs, frontend surfaces, and launch operations.
  - Alternatives considered:
    - Feature-by-feature planning with no milestone gates: rejected because tracking quality and launch readiness are harder to audit.
    - Full waterfall plan for all future phases: rejected because it reduces iteration speed after initial launch feedback.

- Decision: Use PostgreSQL as the canonical relational store and object storage for image assets.
  - Alternatives considered:
    - NoSQL-first schema: rejected for this phase because moderation, ownership, and recommendation logs are relational and audit-oriented.

- Decision: Keep recommendation v1 rule-based and observable before adding personalized ML ranking.
  - Alternatives considered:
    - Train model-first approach: rejected due to data cold-start and slower MVP launch.

## Risks / Trade-offs
- Risk: Cold-start recommendation quality may be weak.
  - Mitigation: Seed outfit dataset and collect explicit helpful/not-helpful feedback from day one.
- Risk: User-generated content moderation may create operational bottlenecks.
  - Mitigation: Launch with admin moderation queue and auditable moderation actions.
- Risk: Launch blockers due to environment or migration drift.
  - Mitigation: Enforce migration replay in staging and include go-live checklist gates.

## Migration Plan
1. Approve roadmap documents in OpenSpec.
2. Execute implementation changes through scoped follow-up change proposals.
3. Track weekly progress against roadmap milestones in sprint updates.
4. Promote completed roadmap sections to canonical specs at archive time.

## Open Questions
- Should staging and production use separate cloud accounts/projects from day one?
- Should push notifications be included in MVP or deferred to v1.1?
- Which analytics stack will be used for KPI tracking (self-hosted vs managed)?
