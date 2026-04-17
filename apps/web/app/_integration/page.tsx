"use client";

import { FormEvent, useMemo, useState } from "react";
import { api, Item, RecommendationQueryResult } from "@/lib/api";

export default function IntegrationPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("P@ssw0rd123");
  const [displayName, setDisplayName] = useState("Ariel");
  const [token, setToken] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState("白色牛津襯衫");
  const [itemCategory, setItemCategory] = useState("top");
  const [itemColor, setItemColor] = useState("white");
  const [itemImageUrl, setItemImageUrl] = useState("https://images.unsplash.com/photo-1521572163474-6864f9cf17ab");
  const [itemStyleTags, setItemStyleTags] = useState("minimal,formal");

  const [recommendation, setRecommendation] = useState<RecommendationQueryResult | null>(null);
  const [occasion, setOccasion] = useState("work");
  const [season, setSeason] = useState("spring");
  const [weather, setWeather] = useState("23");
  const [styleHints, setStyleHints] = useState("minimal,clean");

  const canUseApi = Boolean(token);
  const selectedItemId = items[0]?.id ?? "";

  const itemPayloadStyleTags = useMemo(
    () => itemStyleTags.split(",").map((x) => x.trim()).filter(Boolean),
    [itemStyleTags]
  );

  const recommendationStyleHints = useMemo(
    () => styleHints.split(",").map((x) => x.trim()).filter(Boolean),
    [styleHints]
  );

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setAuthMessage("");

    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password, displayName);

      setToken(result.accessToken);
      setAuthMessage(`已登入：${result.user.displayName} (${result.user.role})`);
      await loadItems(result.accessToken);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "登入失敗");
    }
  }

  async function loadItems(accessToken = token) {
    if (!accessToken) return;
    setErrorMessage("");
    try {
      const result = await api.getItems(accessToken);
      setItems(result.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "載入單品失敗");
    }
  }

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setErrorMessage("手動新增單品已移除，請改用上傳穿搭照流程。");
  }

  async function handleRecommendation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedItemId) return;
    setErrorMessage("");

    try {
      const result = await api.queryRecommendation(token, {
        itemIds: [selectedItemId],
        occasion,
        season,
        weather,
        styleHints: recommendationStyleHints
      });
      setRecommendation(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "推薦查詢失敗");
    }
  }

  return (
    <main>
      <section className="hero">
        <div>
          <h1>OOTD Integration Harness</h1>
          <p>保留用：一次驗證 Auth / Items / Recommendations API</p>
        </div>
        <span className="pill">API Base: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5050/api/v1"}</span>
      </section>

      <section className="grid">
        <article className="card span-4">
          <h2>1. {mode === "login" ? "登入" : "註冊"}</h2>
          <p>先取得 access token 再操作後續功能。</p>
          <form className="form-grid" onSubmit={handleAuthSubmit}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" />
            </label>

            <label>
              Password
              <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" />
            </label>

            {mode === "register" ? (
              <label>
                Display Name
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              </label>
            ) : null}

            <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
          </form>

          <div className="row" style={{ marginTop: 10 }}>
            <button className="subtle" onClick={() => setMode(mode === "login" ? "register" : "login")} type="button">
              切換到 {mode === "login" ? "註冊" : "登入"}
            </button>
            <button className="subtle" onClick={() => loadItems()} type="button" disabled={!canUseApi}>
              重新載入單品
            </button>
          </div>

          {authMessage ? <div className="message">{authMessage}</div> : null}
        </article>

        <article className="card span-4">
          <h2>2. 新增單品</h2>
          <p>送 `POST /items`，成功後自動 refresh list。</p>
          <form className="form-grid" onSubmit={handleCreateItem}>
            <label>
              名稱
              <input value={itemName} onChange={(event) => setItemName(event.target.value)} required />
            </label>

            <label>
              品類
              <select value={itemCategory} onChange={(event) => setItemCategory(event.target.value)}>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
                <option value="outer">outer</option>
                <option value="shoes">shoes</option>
                <option value="accessory">accessory</option>
                <option value="dress">dress</option>
              </select>
            </label>

            <label>
              顏色
              <input value={itemColor} onChange={(event) => setItemColor(event.target.value)} required />
            </label>

            <label>
              style tags (comma separated)
              <input value={itemStyleTags} onChange={(event) => setItemStyleTags(event.target.value)} />
            </label>

            <label>
              圖片 URL
              <input value={itemImageUrl} onChange={(event) => setItemImageUrl(event.target.value)} required />
            </label>

            <button type="submit" disabled={!canUseApi}>
              新增 Item
            </button>
          </form>
        </article>

        <article className="card span-4">
          <h2>3. 查詢推薦</h2>
          <p>送 `POST /recommendations/query`，預設使用第一筆 item。</p>
          <form className="form-grid" onSubmit={handleRecommendation}>
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
              <input value={styleHints} onChange={(event) => setStyleHints(event.target.value)} />
            </label>
            <button type="submit" disabled={!canUseApi || !selectedItemId}>
              查詢 Recommendation
            </button>
          </form>
        </article>

        <article className="card span-8">
          <h2>我的單品</h2>
          <p>目前登入後的 item 清單（`GET /items`）。</p>
          <ul className="list">
            {items.map((item) => (
              <li className="item" key={item.id}>
                <strong>{item.name}</strong>
                <span className="muted">
                  {item.category} / {item.color} / {item.status}
                </span>
                <div className="muted">id: {item.id}</div>
              </li>
            ))}
            {items.length === 0 ? <li className="item muted">尚無資料，請先登入並新增單品。</li> : null}
          </ul>
        </article>

        <article className="card span-4">
          <h2>推薦結果</h2>
          <p>顯示 `recommendationId` 與 top results。</p>
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
            </>
          ) : (
            <div className="item muted">尚未查詢推薦。</div>
          )}
        </article>
      </section>

      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
