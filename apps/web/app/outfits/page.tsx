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

const STATUS_BADGE: Record<string, { bg: string; border: string; color: string; label: string }> = {
  approved: { bg: "rgba(47,122,86,0.2)", border: "rgba(47,122,86,0.4)", color: "#7bbfa0", label: "已審核" },
  pending:  { bg: "rgba(180,130,0,0.15)", border: "rgba(180,130,0,0.3)", color: "#c9a84c", label: "審核中" },
  rejected: { bg: "rgba(182,59,54,0.15)", border: "rgba(182,59,54,0.3)", color: "#e07b77", label: "已拒絕" }
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

      <div className="pt-14 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10">

          {/* Header */}
          <div className="flex items-end justify-between py-8 border-b hairline mb-8">
            <div>
              <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-1">Lookbook</p>
              <h1 className="font-display text-5xl md:text-6xl font-light text-cream" style={{ lineHeight: 1, letterSpacing: "-0.04em" }}>
                穿搭
              </h1>
            </div>
            <button
              type="button"
              onClick={() => router.push("/outfits/new")}
              className="btn-primary h-10 px-6 rounded text-xs tracking-widest uppercase flex items-center gap-2"
            >
              <Plus size={14} />
              新建穿搭
            </button>
          </div>

          {/* Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded text-xs" style={{ background: "rgba(182,59,54,0.12)", border: "1px solid rgba(182,59,54,0.3)", color: "#e07b77" }}>
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded text-xs" style={{ background: "rgba(47,122,86,0.1)", border: "1px solid rgba(47,122,86,0.25)", color: "#7bbfa0" }}>
              {successMessage}
            </div>
          )}

          {/* Reload */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => void loadOutfits()}
              className="btn-ghost h-8 px-4 rounded text-xs tracking-widest uppercase flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              重新載入
            </button>
          </div>

          {/* Outfits grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded" style={{ aspectRatio: "3/4", background: "rgba(245,240,235,0.04)" }} />
              ))}
            </div>
          ) : outfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="font-display text-3xl font-light text-cream opacity-20 mb-3" style={{ fontStyle: "italic" }}>
                還沒有穿搭
              </p>
              <p className="text-xs text-cream opacity-20 mb-6">建立你的第一套穿搭組合</p>
              <button
                type="button"
                onClick={() => router.push("/outfits/new")}
                className="btn-primary h-10 px-6 rounded text-xs tracking-widest uppercase"
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
                  <div key={outfit.id} className="outfit-card relative rounded overflow-hidden cursor-pointer" style={{ aspectRatio: "3/4", background: "#1a1a17" }}>
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={outfit.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: "#1a1a17" }} />
                    )}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(13,13,11,0.9) 0%, rgba(13,13,11,0.1) 60%, transparent 100%)" }}
                    />

                    {/* Hover overlay */}
                    <div
                      className="outfit-overlay absolute inset-0 flex flex-col items-end justify-start gap-2 p-3"
                      style={{ background: "rgba(13,13,11,0.4)" }}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/outfits/${outfit.id}/edit`)}
                        className="btn-ghost w-8 h-8 rounded flex items-center justify-center"
                        title="編輯"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(outfit.id)}
                        className="btn-ghost w-8 h-8 rounded flex items-center justify-center"
                        title="刪除"
                        style={{ color: "#e07b77" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontSize: "9px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase"
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="font-display text-2xl font-light text-cream" style={{ fontStyle: "italic", letterSpacing: "-0.02em" }}>
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
                        <p className="text-xs text-cream opacity-30">{outfit.itemIds?.length ?? 0} 件</p>
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
