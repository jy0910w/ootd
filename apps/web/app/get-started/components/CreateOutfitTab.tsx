"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, OutfitUploadResponse } from "@/lib/api";
import { SessionState } from "@/lib/session";
import { Upload, X, ChevronRight, CheckCircle } from "lucide-react";

type Step = 1 | 2 | 3;

type EditableItem = {
  id?: string;
  name: string;
  category: string;
  color: string;
  styleHints: string[];
};

type LoginReason = "create-outfit";

export function CreateOutfitTab({
  session,
  onNeedLogin
}: {
  session: SessionState | null;
  onNeedLogin: (reason: LoginReason) => void;
}) {
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

    // 如果未登入，觸發登入
    if (!session) {
      onNeedLogin("create-outfit");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError("");
  }

  function clearFile() {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!selectedFile || !session) return;
    setUploading(true);
    setError("");
    try {
      const data = await api.uploadOutfit(session.accessToken, selectedFile);
      setDraft(data);
      setEditTitle(data.title);
      setEditOccasion(data.occasion);
      setEditSeason(data.season);
      setEditItems(
        data.items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          color: item.color,
          styleHints: item.styleHints
        }))
      );
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  function updateItem(index: number, field: keyof EditableItem, value: string) {
    setEditItems((items) =>
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(index: number) {
    setEditItems((items) => items.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    if (!draft || !session) return;
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

  function resetForm() {
    setStep(1);
    setPreviewUrl(null);
    setSelectedFile(null);
    setDraft(null);
    setError("");
    setEditTitle("");
    setEditOccasion("");
    setEditSeason("");
    setEditItems([]);
    setConfirmedId(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-xs bg-error-bg text-error border border-error/30">
          {error}
        </div>
      )}

      {/* ── Loading State (between Step 1 and 2) ── */}
      {uploading && (
        <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-6 md:p-8">
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
              {/* Photo skeleton */}
              <div
                className="rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"
                style={{ aspectRatio: "4/5", maxHeight: 320 }}
              />
              {/* Form skeleton */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                  <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                  <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                </div>
                <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                  <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === 1 && !uploading && (
        <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase">
                上傳穿搭照片
              </p>
              {!session && (
                <p className="text-xs text-accent-500 dark:text-accent-400">需要登入</p>
              )}
            </div>

            <label
              className={`block rounded-xl cursor-pointer transition-all ${
                previewUrl
                  ? ""
                  : "p-14 text-center border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {previewUrl ? (
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={{ aspectRatio: "4/5", maxHeight: 440 }}
                >
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <button
                    type="button"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/60 border border-white/10 hover:bg-black/80 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      clearFile();
                    }}
                  >
                    <X size={13} className="text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={30} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    拖曳或點擊上傳穿搭照
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    JPG · PNG · WEBP · 最大 10 MB
                  </p>
                </>
              )}
            </label>

            <button
              type="button"
              disabled={!selectedFile || uploading || !session}
              onClick={() => void handleUpload()}
              className="btn-primary w-full h-12 rounded-xl mt-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
            >
              {uploading ? (
                "AI 分析中..."
              ) : (
                <>
                  下一步 — AI 識別單品 <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading State (confirming) ── */}
      {confirming && (
        <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="py-20 px-8 text-center">
            <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-10 w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
            <div className="h-4 w-64 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* ── Step 2: Review AI-detected items ── */}
      {step === 2 && draft && !confirming && (
        <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-6 md:p-8">
            <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-6">
              確認 AI 識別結果
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
              {/* Photo preview */}
              <div
                className="rounded-xl overflow-hidden shrink-0"
                style={{ aspectRatio: "4/5", maxHeight: 320 }}
              >
                <img src={draft.imageUrl} alt="穿搭照" className="w-full h-full object-cover" />
              </div>

              {/* Edit form */}
              <div className="space-y-4">
                {/* Outfit meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1">
                      穿搭標題
                    </label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="field h-10 px-3 rounded-lg text-sm w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1">
                      場合
                    </label>
                    <input
                      value={editOccasion}
                      onChange={(e) => setEditOccasion(e.target.value)}
                      className="field h-9 px-3 rounded-lg text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1">
                      季節
                    </label>
                    <input
                      value={editSeason}
                      onChange={(e) => setEditSeason(e.target.value)}
                      className="field h-9 px-3 rounded-lg text-xs w-full"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-3">
                    AI 識別到 {editItems.length} 件單品
                  </p>
                  <div className="space-y-2">
                    {editItems.map((item, i) => (
                      <div
                        key={item.id ?? i}
                        className="rounded-lg p-3 flex gap-3 items-start bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                      >
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-2 w-4 text-right">
                          {i + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <input
                            value={item.name}
                            onChange={(e) => updateItem(i, "name", e.target.value)}
                            placeholder="名稱"
                            className="field h-8 px-2 rounded-lg text-xs sm:col-span-1 col-span-2"
                          />
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(i, "category", e.target.value)}
                            className="field h-8 px-2 rounded-lg text-xs"
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
                            className="field h-8 px-2 rounded-lg text-xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors mt-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-ghost h-10 px-5 rounded-lg text-xs tracking-widest uppercase"
                  >
                    上一步
                  </button>
                  <button
                    type="button"
                    disabled={confirming || !editTitle.trim()}
                    onClick={() => void handleConfirm()}
                    className="btn-primary h-10 px-8 rounded-lg text-xs tracking-widest uppercase flex items-center gap-2 disabled:opacity-30"
                  >
                    {confirming ? (
                      "建立中..."
                    ) : (
                      <>
                        確認建立 <ChevronRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Success ── */}
      {step === 3 && (
        <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="py-20 px-8 text-center">
            <CheckCircle size={48} className="mx-auto mb-6 text-brand-500 dark:text-brand-400" />
            <h2 className="text-4xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">
              穿搭已建立
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              穿搭已提交審核，審核通過後將公開顯示。
            </p>
            {confirmedId && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-8">
                ID: {confirmedId}
              </p>
            )}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="btn-ghost h-10 px-6 rounded-lg text-xs tracking-widest uppercase"
              >
                再新增一套
              </button>
              <button
                type="button"
                onClick={() => router.push("/outfits")}
                className="btn-primary h-10 px-6 rounded-lg text-xs tracking-widest uppercase"
              >
                查看我的穿搭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
