"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, OutfitUploadResponse } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { MvpNav } from "@/components/mvp-nav";
import { SessionState } from "@/lib/session";
import { ArrowLeft, Upload, X, ChevronRight, CheckCircle } from "lucide-react";

export default function NewOutfitPage() {
  return <RequireAuth>{(session) => <OutfitUploader session={session} />}</RequireAuth>;
}

type Step = 1 | 2 | 3;

type EditableItem = {
  id?: string;
  name: string;
  category: string;
  color: string;
  styleHints: string[];
};

function OutfitUploader({ session }: { session: SessionState }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<OutfitUploadResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOccasion, setEditOccasion] = useState("");
  const [editSeason, setEditSeason] = useState("");
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError("");
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    try {
      const data = await api.uploadOutfit(session.accessToken, selectedFile);
      setDraft(data);
      setEditTitle(data.title);
      setEditOccasion(data.occasion);
      setEditSeason(data.season);
      setEditItems(data.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.color,
        styleHints: item.styleHints
      })));
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  function updateItem(index: number, field: keyof EditableItem, value: string) {
    setEditItems((items) =>
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItem(index: number) {
    setEditItems((items) => items.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    if (!draft) return;
    setConfirming(true);
    setError("");
    try {
      const confirmed = await api.confirmOutfit(session.accessToken, draft.draftId, {
        title: editTitle,
        occasion: editOccasion,
        season: editSeason,
        items: editItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          color: item.color,
          styleHints: item.styleHints
        }))
      });
      setConfirmedId(confirmed.id);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "確認失敗");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <MvpNav session={session} />

      <div className="pt-14 min-h-screen">
        <div className="max-w-screen-lg mx-auto px-4 md:px-8 lg:px-10">

          {/* Header */}
          <div className="flex items-center justify-between py-6 border-b hairline">
            <div>
              <button
                type="button"
                onClick={() => router.push("/outfits")}
                className="flex items-center gap-1 text-xs tracking-widest text-cream opacity-30 uppercase mb-1 hover:opacity-60 transition-opacity"
              >
                <ArrowLeft size={11} />
                返回穿搭
              </button>
              <h1 className="font-display text-3xl font-light text-cream mt-1" style={{ letterSpacing: "-0.03em" }}>
                新增穿搭
              </h1>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {([1, 2, 3] as Step[]).map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className={`step-dot ${step === s ? "active" : step > s ? "done" : ""}`}
                  />
                  {idx < 2 && (
                    <span style={{ width: 24, height: 1, background: "rgba(245,240,235,0.15)", display: "inline-block" }} />
                  )}
                </div>
              ))}
              <span className="text-xs text-cream opacity-30 ml-2">步驟 {step}/3</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded text-xs" style={{ background: "rgba(182,59,54,0.12)", border: "1px solid rgba(182,59,54,0.3)", color: "#e07b77" }}>
              {error}
            </div>
          )}

          {/* ── Step 1: Upload ── */}
          {step === 1 && (
            <div className="py-10 max-w-lg mx-auto">
              <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-6 text-center">步驟 1 · 上傳穿搭照</p>

              <label className={`block rounded-xl cursor-pointer transition-all ${previewUrl ? "" : "dropzone p-16 text-center"}`}
                style={previewUrl ? {} : { border: "1px dashed rgba(245,240,235,0.12)" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/5", maxHeight: 440 }}>
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,11,0.4) 0%, transparent 60%)" }} />
                    <button
                      type="button"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center btn-ghost"
                      onClick={(e) => { e.preventDefault(); setPreviewUrl(null); setSelectedFile(null); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={36} className="mx-auto mb-4 text-cream opacity-20" />
                    <p className="text-sm text-cream opacity-40 mb-1">拖曳圖片或點擊上傳</p>
                    <p className="text-xs text-cream opacity-20">JPG、PNG、WEBP · 最大 10 MB</p>
                  </>
                )}
              </label>

              <button
                type="button"
                disabled={!selectedFile || uploading}
                onClick={() => void handleUpload()}
                className="btn-primary w-full h-12 rounded-lg mt-6 text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {uploading ? "AI 分析中..." : (
                  <>下一步 — AI 識別單品 <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          )}

          {/* ── Step 2: Review AI-detected items ── */}
          {step === 2 && draft && (
            <div className="py-8">
              <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-6 text-center">步驟 2 · 確認 AI 識別結果</p>

              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                {/* Photo preview */}
                <div className="rounded-xl overflow-hidden shrink-0" style={{ aspectRatio: "4/5", maxHeight: 340 }}>
                  <img src={draft.imageUrl} alt="穿搭照" className="w-full h-full object-cover" />
                </div>

                {/* Edit form */}
                <div className="space-y-4">
                  {/* Outfit meta */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1">穿搭標題</label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="field h-10 px-3 rounded text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1">場合</label>
                      <input value={editOccasion} onChange={(e) => setEditOccasion(e.target.value)} className="field h-9 px-3 rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1">季節</label>
                      <input value={editSeason} onChange={(e) => setEditSeason(e.target.value)} className="field h-9 px-3 rounded text-xs" />
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-3">
                      AI 識別到 {editItems.length} 件單品
                    </p>
                    <div className="space-y-2">
                      {editItems.map((item, i) => (
                        <div
                          key={item.id ?? i}
                          className="rounded-lg p-3 flex gap-3 items-start"
                          style={{ background: "rgba(245,240,235,0.03)", border: "1px solid rgba(245,240,235,0.06)" }}
                        >
                          <span className="text-xs text-cream opacity-20 shrink-0 mt-2 w-4 text-right">{i + 1}</span>
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <input
                              value={item.name}
                              onChange={(e) => updateItem(i, "name", e.target.value)}
                              placeholder="名稱"
                              className="field h-8 px-2 rounded text-xs sm:col-span-1 col-span-2"
                            />
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(i, "category", e.target.value)}
                              className="field h-8 px-2 rounded text-xs"
                            >
                              <option value="top">上衣</option>
                              <option value="bottom">下身</option>
                              <option value="outer">外套</option>
                              <option value="shoes">鞋履</option>
                              <option value="bag">包款</option>
                              <option value="accessory">配件</option>
                            </select>
                            <input
                              value={item.color}
                              onChange={(e) => updateItem(i, "color", e.target.value)}
                              placeholder="顏色"
                              className="field h-8 px-2 rounded text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-cream opacity-20 hover:opacity-50 transition-opacity mt-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => setStep(1)} className="btn-ghost h-10 px-5 rounded text-xs tracking-widest uppercase">
                      上一步
                    </button>
                    <button
                      type="button"
                      disabled={confirming || !editTitle.trim()}
                      onClick={() => void handleConfirm()}
                      className="btn-primary h-10 px-8 rounded text-xs tracking-widest uppercase flex items-center gap-2 disabled:opacity-30"
                    >
                      {confirming ? "建立中..." : (
                        <>確認建立 <ChevronRight size={12} /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="py-20 text-center">
              <CheckCircle size={48} className="mx-auto mb-6 text-brand-400 opacity-70" />
              <h2 className="font-display text-4xl font-light text-cream mb-3" style={{ letterSpacing: "-0.03em" }}>
                穿搭已建立
              </h2>
              <p className="text-xs text-cream opacity-30 mb-2">
                穿搭已提交審核，審核通過後將公開顯示。
              </p>
              {confirmedId && (
                <p className="text-xs text-cream opacity-20 font-mono mb-8">ID: {confirmedId}</p>
              )}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => { setStep(1); setPreviewUrl(null); setSelectedFile(null); setDraft(null); setError(""); }}
                  className="btn-ghost h-10 px-6 rounded text-xs tracking-widest uppercase"
                >
                  再新增一套
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/outfits")}
                  className="btn-primary h-10 px-6 rounded text-xs tracking-widest uppercase"
                >
                  查看我的穿搭
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
