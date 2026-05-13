"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { api, ItemRecommendationResponse } from "@/lib/api";
import { SessionState } from "@/lib/session";
import { Upload, X, Sparkles } from "lucide-react";
import { OutfitMasonryGrid } from "./OutfitMasonryGrid";

type LoginReason = "recommend-item";

const FREE_ITEM_USAGE_KEY = "ootd_item_recommend_uses";
const FREE_USAGE_LIMIT = 3;

function getUsageCount(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(FREE_ITEM_USAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function incrementUsage(): number {
  const current = getUsageCount();
  const newCount = current + 1;
  localStorage.setItem(FREE_ITEM_USAGE_KEY, String(newCount));
  return newCount;
}

export function RecommendFromItemTab({
  session,
  onNeedLogin
}: {
  session: SessionState | null;
  onNeedLogin: (reason: LoginReason) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ItemRecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    setUsageCount(getUsageCount());
  }, []);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setError("");
  }

  function clearFile() {
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!selectedFile) return;

    // Check anonymous usage limit
    if (!session) {
      const currentUsage = getUsageCount();
      if (currentUsage >= FREE_USAGE_LIMIT) {
        onNeedLogin("recommend-item");
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.getItemRecommendations(selectedFile);
      setResult(data);
      
      // Increment usage count for anonymous users
      if (!session) {
        const newCount = incrementUsage();
        setUsageCount(newCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Upload Section */}
      <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg mb-8">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase">
              上傳單品照片
            </p>
            {/* Usage indicator for anonymous users */}
            {!session && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  剩餘 {FREE_USAGE_LIMIT - usageCount} 次
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: FREE_USAGE_LIMIT }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < usageCount
                          ? "bg-gray-300 dark:bg-gray-600"
                          : "bg-brand-500"
                      }`}
                    />
                  ))}
                </div>
              </div>
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
                style={{ aspectRatio: "4/5", maxHeight: 380 }}
              >
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
                  上傳單品照片（T恤、褲子、鞋子等）
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  JPG · PNG · WEBP · 最大 10 MB
                </p>
              </>
            )}
          </label>

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 rounded-lg text-xs bg-error-bg text-error border border-error/30">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            disabled={!selectedFile || loading}
            onClick={() => void handleAnalyze()}
            className="btn-primary w-full h-12 rounded-xl mt-4 text-sm tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
          >
            <Sparkles size={14} />
            {loading ? "AI 分析中..." : "取得穿搭推薦"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          {/* Loading Skeleton for Detected Item */}
          <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="p-6 md:p-8">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-3" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                  <div className="h-6 w-14 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading Skeleton for Masonry Grid */}
          <div>
            <div className="mb-6">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="masonry">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse"
                  style={{ height: [380, 420, 360, 400, 380, 420][i] }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!loading && result && (
        <div>
          {/* Detected Item Info */}
          <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg mb-6">
            <div className="p-6 md:p-8">
              <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-4">
                AI 識別結果
              </p>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {result.detectedItem.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="tag-pill px-3 py-1 rounded-full text-xs">
                      {result.detectedItem.category}
                    </span>
                    <span className="tag-pill px-3 py-1 rounded-full text-xs">
                      {result.detectedItem.color}
                    </span>
                    {result.detectedItem.styleHints.map((hint) => (
                      <span key={hint} className="tag-pill px-3 py-1 rounded-full text-xs">
                        {hint}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            {result.recommendedOutfits.length > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1">
                      推薦穿搭
                    </p>
                    <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                      適合這件單品的穿搭靈感
                    </h2>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    共 {result.recommendedOutfits.length} 套
                  </span>
                </div>
                <OutfitMasonryGrid outfits={result.recommendedOutfits} />
              </>
            ) : (
              <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Sparkles size={24} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    目前沒有找到適合的穿搭推薦
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    試試上傳其他單品，或稍後再試
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
