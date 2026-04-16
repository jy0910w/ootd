"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, Item } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { MvpNav } from "@/components/mvp-nav";
import { SessionState } from "@/lib/session";

export default function NewOutfitPage() {
  return <RequireAuth>{(session) => <OutfitForm session={session} />}</RequireAuth>;
}

function OutfitForm({ session }: { session: SessionState }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdMessage, setCreatedMessage] = useState("");

  const [title, setTitle] = useState("上班簡約通勤");
  const [description, setDescription] = useState("白襯衫搭配深藍寬褲");
  const [occasion, setOccasion] = useState("work");
  const [season, setSeason] = useState("spring");
  const [weatherRange, setWeatherRange] = useState("18-24");
  const [imageUrlsRaw, setImageUrlsRaw] = useState("https://cdn.example.com/outfits/1.jpg");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const imageUrls = useMemo(
    () => imageUrlsRaw.split(",").map((x) => x.trim()).filter(Boolean),
    [imageUrlsRaw]
  );

  useEffect(() => {
    async function loadItems() {
      setLoadingItems(true);
      try {
        const result = await api.getItems(session.accessToken);
        setItems(result.items);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "載入單品失敗");
      } finally {
        setLoadingItems(false);
      }
    }

    void loadItems();
  }, [session.accessToken]);

  function toggleItem(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setCreatedMessage("");

    try {
      const result = await api.createOutfit(session.accessToken, {
        title,
        description,
        occasion,
        season,
        weatherRange,
        imageUrls,
        itemIds: selectedItemIds
      });
      setCreatedMessage(`建立成功：${result.id}（${result.moderationStatus}）`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "建立穿搭失敗");
    }
  }

  return (
    <main>
      <MvpNav session={session} />

      <section className="card">
        <h2>建立新穿搭</h2>
        <p>送出 `POST /outfits`，建立後狀態預期為 `pending`。</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            標題
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>

          <label>
            描述
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </label>

          <div className="grid-two">
            <label>
              Occasion
              <input value={occasion} onChange={(event) => setOccasion(event.target.value)} required />
            </label>
            <label>
              Season
              <input value={season} onChange={(event) => setSeason(event.target.value)} required />
            </label>
          </div>

          <label>
            Weather Range
            <input value={weatherRange} onChange={(event) => setWeatherRange(event.target.value)} />
          </label>

          <label>
            Image URLs (comma separated)
            <input value={imageUrlsRaw} onChange={(event) => setImageUrlsRaw(event.target.value)} required />
          </label>

          <fieldset className="fieldset">
            <legend>綁定單品</legend>
            {loadingItems ? <p className="muted">載入單品中...</p> : null}
            {!loadingItems && items.length === 0 ? <p className="muted">目前尚無單品，請先到 Wardrobe 新增。</p> : null}
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
          </fieldset>

          <button type="submit" disabled={imageUrls.length === 0}>
            建立 Outfit
          </button>
        </form>
      </section>

      {createdMessage ? <div className="message">{createdMessage}</div> : null}
      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
