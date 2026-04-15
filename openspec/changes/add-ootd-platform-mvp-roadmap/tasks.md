## 1. Week 1 Kickoff (Ready to Start)

### 1.1 API (`apps/api`)
- [ ] 1.1.1 Add auth module skeleton (`/auth/register`, `/auth/login`, `/auth/refresh` route contracts)
- [ ] 1.1.2 Add RBAC middleware/policy for `user`, `moderator`, `admin`
- [ ] 1.1.3 Define v1 API error response format (code, message, details, traceId)
- [ ] 1.1.4 Scaffold domain controllers: `items`, `outfits`, `recommendations`, `feedback`, `admin/moderation`
- [ ] 1.1.5 Add health and readiness endpoints (`/health/live`, `/health/ready`)

### 1.2 Database (`PostgreSQL` + EF Core)
- [ ] 1.2.1 Create initial entities for `users`, `items`, `outfits`, `outfit_items`, `recommendation_logs`, `feedback`, `moderation_actions`
- [ ] 1.2.2 Add base columns and constraints (UUID PK, FK, `created_at`, `updated_at`)
- [ ] 1.2.3 Add baseline indexes (`users.email`, all FK columns, moderation status + created time)
- [ ] 1.2.4 Generate first migration and verify local apply/rollback
- [ ] 1.2.5 Prepare seed strategy draft (admin user + sample taxonomy values)

### 1.3 Web (`apps/web`)
- [ ] 1.3.1 Initialize app shell and routing (`/login`, `/wardrobe`, `/outfits/new`, `/recommendations`)
- [ ] 1.3.2 Build auth page UI skeleton (login/register forms without final backend wiring)
- [ ] 1.3.3 Build wardrobe list/upload page skeleton (empty state, upload CTA, item card placeholder)
- [ ] 1.3.4 Build recommendation result page skeleton (input panel + top 10 result placeholders)
- [ ] 1.3.5 Define shared API client wrapper and error handling pattern

### 1.4 Admin (`apps/admin`)
- [ ] 1.4.1 Initialize admin app shell and protected route layout
- [ ] 1.4.2 Build moderation queue page skeleton (pending list + approve/reject action slots)
- [ ] 1.4.3 Build user management page skeleton (search, role display, ban/unban action slots)
- [ ] 1.4.4 Build operations dashboard skeleton (placeholder KPI cards)
- [ ] 1.4.5 Add admin auth guard and role check integration points

### 1.5 Week 1 Integration and Definition of Done
- [ ] 1.5.1 Define shared DTO and enum package in `packages/types` for MVP contracts
- [ ] 1.5.2 Wire local dev flow to run API + DB and verify web/admin can hit mock or real API base URL
- [ ] 1.5.3 Finalize week 1 acceptance checklist and assign owner per subtask
- [ ] 1.5.4 Hold week 1 review and lock week 2 backlog based on actual progress

## 2. Data and Backend Foundation (Week 2+)
- [ ] 2.1 Implement complete authentication and RBAC behavior in `apps/api`
- [ ] 2.2 Implement production-ready item, outfit, recommendation, feedback, and moderation APIs
- [ ] 2.3 Complete migration and seed strategy for local, staging, and production bootstrap

## 3. Frontend Delivery (Week 3+)
- [ ] 3.1 Implement full `apps/web` flows: auth, wardrobe, outfit upload, recommendations, feedback
- [ ] 3.2 Implement full `apps/admin` flows: moderation queue, moderation actions, user management, operations dashboard
- [ ] 3.3 Integrate frontend and backend contracts with shared typed DTOs end-to-end

## 4. Recommendation and Content Operations (Week 4+)
- [ ] 4.1 Deliver recommendation v1 (rule filtering + ranking + reason output)
- [ ] 4.2 Add recommendation logging and quality feedback loop
- [ ] 4.3 Add content moderation audit trail and incident handling procedure

## 5. Quality and Launch (Week 5+)
- [ ] 5.1 Add test coverage for critical API and UI paths
- [ ] 5.2 Complete performance, error, and observability instrumentation
- [ ] 5.3 Complete go-live checklist and rollback plan
- [ ] 5.4 Execute staged rollout and weekly KPI review process
