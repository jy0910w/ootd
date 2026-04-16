"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api, Item } from "@/lib/api";
import { MvpNav } from "@/components/mvp-nav";
import { RequireAuth } from "@/components/require-auth";
import { SessionState } from "@/lib/session";

export default function WardrobePage() {
  return <RequireAuth>{(session) => <WardrobeContent session={session} />}</RequireAuth>;
}

function WardrobeContent({ session }: { session: SessionState }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [itemName, setItemName] = useState("白色牛津襯衫");
  const [itemCategory, setItemCategory] = useState("top");
  const [itemColor, setItemColor] = useState("white");
  const [itemImageUrl, setItemImageUrl] = useState("https://images.unsplash.com/photo-1521572163474-6864f9cf17ab");
  const [itemStyleTags, setItemStyleTags] = useState("minimal,formal");

  const styleTags = useMemo(
    () => itemStyleTags.split(",").map((x) => x.trim()).filter(Boolean),
    [itemStyleTags]
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await api.getItems(session.accessToken);
      setItems(result.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "載入單品失敗");
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      await api.createItem(session.accessToken, {
        name: itemName,
        category: itemCategory,
        color: itemColor,
        styleTags,
        imageUrl: itemImageUrl
      });
      await loadItems();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "新增單品失敗");
    }
  }

  return (
    <main>
      <MvpNav
        session={session}
      />

      <section className="grid">
        <article className="card span-4">
          <h2>新增單品</h2>
          <p>建立 item 後可在穿搭與推薦頁使用。</p>
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
              Style Tags
              <input value={itemStyleTags} onChange={(event) => setItemStyleTags(event.target.value)} />
            </label>

            <label>
              圖片 URL
              <input value={itemImageUrl} onChange={(event) => setItemImageUrl(event.target.value)} required />
            </label>

            <button type="submit">新增 Item</button>
          </form>
        </article>

        <article className="card span-8">
          <h2>我的衣櫥</h2>
          <p>`GET /items` 清單（{loading ? "載入中..." : `共 ${items.length} 筆`}）。</p>
          <div className="row" style={{ marginBottom: 10 }}>
            <button className="subtle" onClick={() => void loadItems()} type="button">
              重新載入
            </button>
          </div>
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
            {!loading && items.length === 0 ? <li className="item muted">尚無資料，先新增第一筆單品。</li> : null}
          </ul>
        </article>
      </section>

      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
