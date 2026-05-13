"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, Item } from "@/lib/api";
import { MvpNav } from "@/components/mvp-nav";
import { RequireAuth } from "@/components/require-auth";
import { SessionState } from "@/lib/session";
import { RefreshCw } from "lucide-react";

export default function WardrobePage() {
  return <RequireAuth>{(session) => <WardrobeContent session={session} />}</RequireAuth>;
}

// ── Category filter options ──────────────────────────────────────────────────
const CATEGORIES = [
  { value: "", label: "全部" },
  { value: "top", label: "上衣" },
  { value: "bottom", label: "下身" },
  { value: "outer", label: "外套" },
  { value: "shoes", label: "鞋履" },
  { value: "accessory", label: "配件" },
  { value: "dress", label: "連衣裙" }
] as const;

// ── Masonry placeholder heights (cycle through) ──────────────────────────────
const HEIGHTS = [560, 680, 500, 620, 460, 540, 580, 520];

function WardrobeContent({ session }: { session: SessionState }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const filteredItems = useMemo(
    () => filterCategory ? items.filter((item) => item.category === filterCategory) : items,
    [items, filterCategory]
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

  return (
    <>
      <MvpNav session={session} />

      {/* ── Page content ── */}
      <div className="pt-14 min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10">

          {/* Header */}
          <div className="flex items-end justify-between py-8 border-b border-gray-200 dark:border-gray-800 mb-6">
            <div>
              <p className="text-xs tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">My Collection</p>
              <h1 className="text-5xl md:text-6xl font-light text-gray-900 dark:text-white leading-none tracking-tight">
                衣櫃
              </h1>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3 pb-6 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFilterCategory(cat.value)}
                className={`shrink-0 h-8 px-4 rounded-full text-[10px] tracking-wide uppercase ${filterCategory === cat.value ? "btn-primary" : "btn-ghost"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Reload */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => void loadItems()}
              className="btn-ghost h-8 px-4 rounded-lg text-xs tracking-widest uppercase flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              重新載入
            </button>
          </div>

          {/* Masonry grid */}
          {loading ? (
            <div className="masonry pb-16">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="masonry-item">
                  <div
                    className="rounded-lg bg-gray-100 dark:bg-gray-900"
                    style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                  />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-3xl font-light text-gray-300 dark:text-gray-700 mb-3 italic">
                衣櫃是空的
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600">上傳穿搭照後，AI 識別的單品將自動加入衣櫃</p>
            </div>
          ) : (
            <div className="masonry pb-16">
              {filteredItems.map((item, i) => (
                <div key={item.id} className="masonry-item">
                  <div className="item-card relative rounded-lg overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-900">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full block object-cover"
                        style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                      />
                    ) : (
                      <div style={{ height: HEIGHTS[i % HEIGHTS.length] }} className="bg-gray-100 dark:bg-gray-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                      <p className="text-xs text-white font-medium">{item.name}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <span className="tag-pill px-2 py-0.5 rounded-full">{item.category}</span>
                        <span className="tag-pill px-2 py-0.5 rounded-full">{item.color}</span>
                        {item.styleTags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag-pill px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
