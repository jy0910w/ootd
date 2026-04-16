"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, Item, RecommendationDetail, RecommendationQueryResult } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { MvpNav } from "@/components/mvp-nav";
import { SessionState } from "@/lib/session";

export default function RecommendationsPage() {
  return <RequireAuth>{(session) => <RecommendationsContent session={session} />}</RequireAuth>;
}

function RecommendationsContent({ session }: { session: SessionState }) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationQueryResult | null>(null);
  const [recommendationDetail, setRecommendationDetail] = useState<RecommendationDetail | null>(null);
  const [detailIdInput, setDetailIdInput] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [occasion, setOccasion] = useState("work");
  const [season, setSeason] = useState("spring");
  const [weather, setWeather] = useState("23");
  const [styleHintsRaw, setStyleHintsRaw] = useState("minimal,clean");
  const [feedbackReason, setFeedbackReason] = useState("配色有參考價值");

  const styleHints = useMemo(
    () => styleHintsRaw.split(",").map((x) => x.trim()).filter(Boolean),
    [styleHintsRaw]
  );

  useEffect(() => {
    async function loadItems() {
      try {
        const result = await api.getItems(session.accessToken);
        setItems(result.items);
        setSelectedItemIds(result.items.slice(0, 1).map((item) => item.id));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "載入單品失敗");
      }
    }

    void loadItems();
  }, [session.accessToken]);

  function toggleItem(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  }

  async function handleQuery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setFeedbackMessage("");

    try {
      const result = await api.queryRecommendation(session.accessToken, {
        itemIds: selectedItemIds,
        occasion,
        season,
        weather,
        styleHints
      });
      setRecommendation(result);
      setDetailIdInput(result.recommendationId);
      await loadRecommendationDetail(result.recommendationId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "推薦查詢失敗");
    }
  }

  async function loadRecommendationDetail(recommendationId: string) {
    if (!recommendationId.trim()) {
      return;
    }

    setLoadingDetail(true);
    try {
      const detail = await api.getRecommendationDetail(session.accessToken, recommendationId.trim());
      setRecommendationDetail(detail);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDetailLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setFeedbackMessage("");

    try {
      await loadRecommendationDetail(detailIdInput);
    } catch (error) {
      setRecommendationDetail(null);
      setErrorMessage(error instanceof Error ? error.message : "查詢推薦明細失敗");
    }
  }

  async function sendFeedback(helpful: boolean) {
    if (!recommendation?.recommendationId) {
      return;
    }

    setErrorMessage("");
    setFeedbackMessage("");
    try {
      await api.createFeedback(session.accessToken, {
        recommendationId: recommendation.recommendationId,
        helpful,
        reason: feedbackReason
      });
      setFeedbackMessage(helpful ? "已送出有幫助回饋" : "已送出需改進回饋");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "送出回饋失敗");
    }
  }

  return (
    <main>
      <MvpNav session={session} />

      <section className="grid">
        <article className="card span-5">
          <h2>查詢推薦</h2>
          <p>送 `POST /recommendations/query`。</p>
          <form className="form-grid" onSubmit={handleQuery}>
            <fieldset className="fieldset">
              <legend>選擇單品（至少 1 筆）</legend>
              <div className="checkbox-list">
                {items.map((item) => (
                  <label className="checkbox-item" key={item.id}>
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span>
                      {item.name} ({item.category}/{item.color})
                    </span>
                  </label>
                ))}
              </div>
              {items.length === 0 ? <p className="muted">尚無單品，請先到 Wardrobe 新增資料。</p> : null}
            </fieldset>

            <label>
              Occasion
              <input value={occasion} onChange={(event) => setOccasion(event.target.value)} required />
            </label>

            <label>
              Season
              <input value={season} onChange={(event) => setSeason(event.target.value)} required />
            </label>

            <label>
              Weather
              <input value={weather} onChange={(event) => setWeather(event.target.value)} required />
            </label>

            <label>
              Style hints
              <input value={styleHintsRaw} onChange={(event) => setStyleHintsRaw(event.target.value)} />
            </label>

            <button type="submit" disabled={selectedItemIds.length === 0}>
              查詢 Recommendation
            </button>
          </form>
        </article>

        <article className="card span-7">
          <h2>推薦結果</h2>
          {recommendation ? (
            <>
              <div className="message">recommendationId: {recommendation.recommendationId}</div>
              <ul className="list">
                {recommendation.results.map((result) => (
                  <li className="item" key={result.outfitId}>
                    <strong>outfitId: {result.outfitId}</strong>
                    <span className="muted">score: {result.score}</span>
                    <div className="muted">{result.reasons.join(" / ")}</div>
                  </li>
                ))}
              </ul>

              <div className="feedback-box">
                <h3>回饋這次推薦</h3>
                <label>
                  原因
                  <input value={feedbackReason} onChange={(event) => setFeedbackReason(event.target.value)} />
                </label>
                <div className="row">
                  <button type="button" onClick={() => void sendFeedback(true)}>
                    有幫助
                  </button>
                  <button type="button" className="subtle" onClick={() => void sendFeedback(false)}>
                    需改進
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="item muted">尚未查詢推薦。</div>
          )}

          <div className="feedback-box">
            <h3>推薦明細查詢</h3>
            <p className="muted">支援貼上舊的 recommendationId 查詢明細（`GET /recommendations/{'{id}'}`）。</p>
            <form className="form-grid" onSubmit={handleDetailLookup}>
              <label>
                Recommendation ID
                <input value={detailIdInput} onChange={(event) => setDetailIdInput(event.target.value)} required />
              </label>
              <button type="submit" disabled={loadingDetail}>
                {loadingDetail ? "查詢中..." : "查詢明細"}
              </button>
            </form>

            {recommendationDetail ? (
              <div className="item" style={{ marginTop: 10 }}>
                <strong>detailId: {recommendationDetail.id}</strong>
                <div className="muted">userId: {recommendationDetail.userId}</div>
                <div className="muted">inputItemIds: {recommendationDetail.inputItemIds.join(", ") || "(none)"}</div>
                <div className="muted">resultOutfitIds: {recommendationDetail.resultOutfitIds.join(", ") || "(none)"}</div>
                <div className="muted">context: {recommendationDetail.context.occasion} / {recommendationDetail.context.season} / {recommendationDetail.context.weather}</div>
                <div className="muted">styleHints: {recommendationDetail.context.styleHints.join(" / ") || "(none)"}</div>
                <div className="muted">latency: {recommendationDetail.latencyMs} ms</div>
                <div className="muted">createdAt: {new Date(recommendationDetail.createdAt).toLocaleString()}</div>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      {feedbackMessage ? <div className="message">{feedbackMessage}</div> : null}
      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
