<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## User Preferences

- 偏好語言：說明與規劃文件以正體中文（zh-TW）為主。
- 溝通風格：精簡、務實、可執行；執行追蹤請使用 checklist。
- 規劃風格：提供分階段（week-based）計畫，且在實作前先定義清楚 MVP scope。
- 架構偏好：以 monorepo-first 為原則，結構包含 `apps/api`、`apps/web`、`apps/admin`、`packages/*`。
- 後端偏好：以 `.NET` 為主要 backend；Python service 僅在 recommendation/ML 工作負載需要時再新增。
- 產品交付偏好：先做 Web-first MVP，再擴展到 iOS app。
- 文件偏好：維護 OpenSpec 變更文件（`proposal.md`、`design.md`、`tasks.md`），並在 `docs/` 保持可讀的 roadmap 文件。
- 安全偏好：禁止在版本控管檔案硬編碼 secrets，統一使用 environment variables。
- 執行偏好：進入重大實作前，先提供具體 task breakdown 與 validation steps。
