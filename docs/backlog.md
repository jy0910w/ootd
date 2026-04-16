# Backlog — 待完成項目

從 `add-ootd-platform-mvp-roadmap` change 中未完成的項目，供後續追蹤。

---

## 後端 DB Ops

- [ ] 完成 migration & seed 策略：涵蓋 local、staging、production 環境的初始化流程，包含 admin user seed 與分類資料預設值

## 推薦系統

- [ ] Recommendation v1：實作 rule-based 過濾 + 排序 + 推薦理由輸出
- [ ] Recommendation logging：記錄每次推薦結果與使用者互動
- [ ] Feedback loop：推薦品質追蹤，串接 feedback 資料回訓或調權

## 內容審核

- [ ] Moderation audit trail：審核操作歷程記錄與 incident handling 流程

## 品質與上線

- [ ] Test coverage：API 關鍵路徑與 UI 主要流程的測試覆蓋
- [ ] Observability：效能監控、錯誤追蹤、logging 儀器化
- [ ] Go-live checklist：上線前完整檢核項目與 rollback plan
- [ ] Staged rollout：分階段部署計畫與每週 KPI review 流程

## 流程確認

- [ ] Week 1 acceptance checklist 最終化，並指定各子任務負責人
- [ ] Week 1 review 完成，鎖定 Week 2 backlog
