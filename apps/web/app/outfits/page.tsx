"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MvpNav } from "@/components/mvp-nav";
import { RequireAuth } from "@/components/require-auth";
import { api, Item, Outfit } from "@/lib/api";
import { SessionState } from "@/lib/session";

export default function OutfitsPage() {
  return <RequireAuth>{(session) => <OutfitsContent session={session} />}</RequireAuth>;
}

function OutfitsContent({ session }: { session: SessionState }) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [weatherRange, setWeatherRange] = useState("");
  const [imageUrlsRaw, setImageUrlsRaw] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const imageUrls = useMemo(
    () => imageUrlsRaw.split(",").map((x) => x.trim()).filter(Boolean),
    [imageUrlsRaw]
  );

  const loadOutfits = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await api.getMyOutfits(session.accessToken);
      setOutfits(result.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "載入穿搭失敗");
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const result = await api.getItems(session.accessToken);
      setItems(result.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "載入單品失敗");
    } finally {
      setLoadingItems(false);
    }
  }, [session.accessToken]);

  useEffect(() => {
    void loadOutfits();
    void loadItems();
  }, [loadItems, loadOutfits]);

  function startEdit(outfit: Outfit) {
    setEditingId(outfit.id);
    setTitle(outfit.title);
    setDescription(outfit.description ?? "");
    setOccasion(outfit.occasion);
    setSeason(outfit.season);
    setWeatherRange(outfit.weatherRange ?? "");
    setImageUrlsRaw(outfit.imageUrls.join(", "));
    setSelectedItemIds(outfit.itemIds);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setOccasion("");
    setSeason("");
    setWeatherRange("");
    setImageUrlsRaw("");
    setSelectedItemIds([]);
  }

  function toggleItem(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.updateOutfit(session.accessToken, editingId, {
        title,
        description,
        occasion,
        season,
        weatherRange,
        imageUrls,
        itemIds: selectedItemIds
      });
      setSuccessMessage("穿搭更新成功，已回到 pending 審核狀態。");
      cancelEdit();
      await loadOutfits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "更新穿搭失敗");
    }
  }

  async function handleDelete(outfitId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.deleteOutfit(session.accessToken, outfitId);
      if (editingId === outfitId) {
        cancelEdit();
      }
      setSuccessMessage("穿搭已刪除。");
      await loadOutfits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "刪除穿搭失敗");
    }
  }

  return (
    <main>
      <MvpNav session={session} />

      <section className="grid">
        <article className="card span-7">
          <h2>我的穿搭</h2>
          <p>`GET /outfits/mine`（{loading ? "載入中..." : `共 ${outfits.length} 筆`}）。</p>
          <div className="row" style={{ marginBottom: 10 }}>
            <button className="subtle" type="button" onClick={() => void loadOutfits()}>
              重新載入
            </button>
          </div>

          <ul className="list">
            {outfits.map((outfit) => (
              <li className="item" key={outfit.id}>
                <strong>{outfit.title}</strong>
                <span className="muted">
                  {outfit.occasion} / {outfit.season} / {outfit.moderationStatus}
                </span>
                <div className="muted">images: {outfit.imageUrls.length} / items: {outfit.itemIds.length}</div>
                <div className="muted">id: {outfit.id}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="subtle" type="button" onClick={() => startEdit(outfit)}>
                    編輯
                  </button>
                  <button className="danger" type="button" onClick={() => void handleDelete(outfit.id)}>
                    刪除
                  </button>
                </div>
              </li>
            ))}
            {!loading && outfits.length === 0 ? (
              <li className="item muted">尚無穿搭，先到 New Outfit 建立第一筆。</li>
            ) : null}
          </ul>
        </article>

        <article className="card span-5">
          <h2>編輯穿搭</h2>
          <p>送 `PATCH /outfits/{'{id}'}`。修改後會重新進入 pending。</p>
          {!editingId ? (
            <div className="item muted">請先從左側清單選擇一筆穿搭。</div>
          ) : (
            <form className="form-grid" onSubmit={handleUpdate}>
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
                {!loadingItems && items.length === 0 ? (
                  <p className="muted">目前尚無單品，請先到 Wardrobe 新增。</p>
                ) : null}
                <p className="muted">已選 {selectedItemIds.length} 件</p>
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

              <div className="row">
                <button type="submit" disabled={imageUrls.length === 0}>
                  更新 Outfit
                </button>
                <button className="subtle" type="button" onClick={cancelEdit}>
                  取消
                </button>
              </div>
            </form>
          )}
        </article>
      </section>

      {successMessage ? <div className="message">{successMessage}</div> : null}
      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
