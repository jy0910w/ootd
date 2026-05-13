"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MvpNav } from "@/components/mvp-nav";
import { RequireAuth } from "@/components/require-auth";
import { api, Outfit } from "@/lib/api";
import { SessionState } from "@/lib/session";
import { Plus, RefreshCw, Trash2, Pencil } from "lucide-react";

export default function OutfitsPage() {
  return <RequireAuth>{(session) => <OutfitsContent session={session} />}</RequireAuth>;
}

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  approved: { className: "bg-brand-500/20 border border-brand-500/40 text-brand-400 dark:text-brand-300", label: "已審核" },
  pending:  { className: "bg-accent-400/15 border border-accent-400/30 text-accent-500 dark:text-accent-300", label: "審核中" },
  rejected: { className: "bg-red-500/15 border border-red-500/30 text-red-500 dark:text-red-400", label: "已拒絕" }
};

function OutfitsContent({ session }: { session: SessionState }) {
  const router = useRouter();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  useEffect(() => {
    void loadOutfits();
  }, [loadOutfits]);

  async function handleDelete(outfitId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.deleteOutfit(session.accessToken, outfitId);
      setSuccessMessage("穿搭已刪除。");
      await loadOutfits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "刪除穿搭失敗");
    }
  }

  return (
    <>
      <MvpNav session={session} />

      <div className="pt-14 min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10">

          {/* Header */}
          <div className="flex items-end justify-between py-8 border-b border-gray-200 dark:border-gray-800 mb-8">
            <div>
              <p className="text-xs tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">Lookbook</p>
              <h1 className="text-5xl md:text-6xl font-light text-gray-900 dark:text-white leading-none tracking-tight">
                穿搭
              </h1>
            </div>
            <button
              type="button"
              onClick={() => router.push("/outfits/new")}
              className="btn-primary h-10 px-6 rounded-lg text-xs tracking-widest uppercase flex items-center gap-2"
            >
              <Plus size={14} />
              新建穿搭
            </button>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg text-xs bg-brand-500/10 border border-brand-500/25 text-brand-600 dark:text-brand-400">
              {successMessage}
            </div>
          )}

          {/* Reload */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => void loadOutfits()}
              className="btn-ghost h-8 px-4 rounded-lg text-xs tracking-widest uppercase flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              重新載入
            </button>
          </div>

          {/* Outfits grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-gray-100 dark:bg-gray-900" style={{ aspectRatio: "3/4" }} />
              ))}
            </div>
          ) : outfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-3xl font-light text-gray-300 dark:text-gray-700 mb-3 italic">
                還沒有穿搭
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mb-6">建立你的第一套穿搭組合</p>
              <button
                type="button"
                onClick={() => router.push("/outfits/new")}
                className="btn-primary h-10 px-6 rounded-lg text-xs tracking-widest uppercase"
              >
                新建穿搭
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
              {outfits.map((outfit) => {
                const badge = STATUS_BADGE[outfit.moderationStatus] ?? STATUS_BADGE.pending;
                const coverUrl = outfit.imageUrls?.[0];
                return (
                  <div key={outfit.id} className="outfit-card relative rounded-lg overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-900" style={{ aspectRatio: "3/4" }}>
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={outfit.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                    {/* Hover overlay */}
                    <div className="outfit-overlay absolute inset-0 flex flex-col items-end justify-start gap-2 p-3 bg-black/40">
                      <button
                        type="button"
                        onClick={() => router.push(`/outfits/${outfit.id}/edit`)}
                        className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center"
                        title="編輯"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(outfit.id)}
                        className="btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-400"
                        title="刪除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-2xl font-light text-white italic tracking-tight">
                        {outfit.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1.5 flex-wrap">
                          {outfit.occasion && (
                            <span className="tag-pill px-2 py-0.5 rounded-full">{outfit.occasion}</span>
                          )}
                          {outfit.season && (
                            <span className="tag-pill px-2 py-0.5 rounded-full">{outfit.season}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/30">{outfit.itemIds?.length ?? 0} 件</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
