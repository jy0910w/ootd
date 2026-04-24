"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Item, Outfit } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { MvpNav } from "@/components/mvp-nav";
import { SessionState } from "@/lib/session";
import { ArrowLeft, Upload, X, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/lib/toast-context";

export default function EditOutfitPage() {
  return <RequireAuth>{(session) => <OutfitEditor session={session} />}</RequireAuth>;
}

function OutfitEditor({ session }: { session: SessionState }) {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const outfitId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [allItems, setAllItems] = useState<Item[]>([]);
  
  // Form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOccasion, setEditOccasion] = useState("");
  const [editSeason, setEditSeason] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Image upload preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [outfitData, itemsData] = await Promise.all([
        api.getOutfitById(session.accessToken, outfitId),
        api.getItems(session.accessToken)
      ]);
      
      setOutfit(outfitData);
      setAllItems(itemsData.items);
      
      // Populate form
      setEditTitle(outfitData.title);
      setEditDescription(outfitData.description ?? "");
      setEditOccasion(outfitData.occasion);
      setEditSeason(outfitData.season);
      setEditImageUrl(outfitData.imageUrls[0] ?? "");
      setSelectedItemIds(outfitData.itemIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入穿搭失敗");
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, outfitId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUploadImage() {
    if (!selectedFile) return;
    setUploadingImage(true);
    setError("");
    try {
      const newImageUrl = await api.uploadOutfitImage(session.accessToken, outfitId, selectedFile);
      setEditImageUrl(newImageUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      showToast("照片已更新", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳照片失敗");
    } finally {
      setUploadingImage(false);
    }
  }

  function toggleItemSelection(itemId: string) {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }

  async function handleSave() {
    if (!editTitle.trim()) {
      setError("穿搭標題不能為空");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.updateOutfit(session.accessToken, outfitId, {
        title: editTitle,
        description: editDescription,
        occasion: editOccasion,
        season: editSeason,
        imageUrls: [editImageUrl],
        itemIds: selectedItemIds.map((id) => id)
      });
      
      showToast("穿搭已更新", "success");
      router.push("/outfits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      showToast("儲存失敗", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <MvpNav session={session} />
        <div className="pt-14 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto mb-4 text-cream opacity-20 animate-spin" />
            <p className="text-xs text-cream opacity-30 tracking-widest uppercase">載入中...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !outfit) {
    return (
      <>
        <MvpNav session={session} />
        <div className="pt-14 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-sm text-cream opacity-40 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/outfits")}
              className="btn-ghost h-10 px-6 rounded text-xs tracking-widest uppercase"
            >
              返回穿搭列表
            </button>
          </div>
        </div>
      </>
    );
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
                編輯穿搭
              </h1>
            </div>
            
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="btn-primary h-10 px-8 rounded text-xs tracking-widest uppercase flex items-center gap-2 disabled:opacity-30"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save size={14} />
                  儲存變更
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded text-xs" style={{ background: "rgba(182,59,54,0.12)", border: "1px solid rgba(182,59,54,0.3)", color: "#e07b77" }}>
              {error}
            </div>
          )}

          <div className="py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
              
              {/* Left: Photo */}
              <div>
                <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-3">穿搭照片</p>
                <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "4/5" }}>
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <img src={previewUrl} alt="新照片預覽" className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,11,0.6) 0%, transparent 50%)" }} />
                      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleUploadImage()}
                          disabled={uploadingImage}
                          className="btn-primary flex-1 h-9 rounded text-xs tracking-widest uppercase disabled:opacity-50"
                        >
                          {uploadingImage ? "上傳中..." : "確認更換"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                          className="btn-ghost w-9 h-9 rounded flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img src={editImageUrl} alt={editTitle} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,13,11,0.5) 0%, transparent 50%)" }} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-3 left-3 right-3 btn-ghost h-9 rounded text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                      >
                        <Upload size={12} />
                        更換照片
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Form */}
              <div className="space-y-6">
                
                {/* Basic Info */}
                <div>
                  <p className="text-xs tracking-widest text-cream opacity-30 uppercase mb-3">基本資訊</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1">穿搭標題</label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="field h-10 px-3 rounded text-sm"
                        placeholder="為這套穿搭命名"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1">描述（選填）</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="field h-20 px-3 py-2 rounded text-sm resize-none"
                        placeholder="分享這套穿搭的靈感或搭配心得..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1">場合</label>
                        <select
                          value={editOccasion}
                          onChange={(e) => setEditOccasion(e.target.value)}
                          className="field h-9 px-3 rounded text-xs"
                        >
                          <option value="casual">休閒</option>
                          <option value="formal">正式</option>
                          <option value="business">商務</option>
                          <option value="party">派對</option>
                          <option value="sport">運動</option>
                          <option value="date">約會</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs tracking-widest text-cream opacity-30 uppercase mb-1">季節</label>
                        <select
                          value={editSeason}
                          onChange={(e) => setEditSeason(e.target.value)}
                          className="field h-9 px-3 rounded text-xs"
                        >
                          <option value="spring">春</option>
                          <option value="summer">夏</option>
                          <option value="autumn">秋</option>
                          <option value="winter">冬</option>
                          <option value="all-season">四季</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs tracking-widest text-cream opacity-30 uppercase">
                      選擇單品
                    </p>
                    <span className="text-xs text-cream opacity-20">
                      已選 {selectedItemIds.length} 件
                    </span>
                  </div>

                  {allItems.length === 0 ? (
                    <div className="text-center py-12 rounded-lg" style={{ background: "rgba(245,240,235,0.02)", border: "1px solid rgba(245,240,235,0.06)" }}>
                      <ImageIcon size={32} className="mx-auto mb-3 text-cream opacity-10" />
                      <p className="text-xs text-cream opacity-20">衣櫃中還沒有單品</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
                      {allItems.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleItemSelection(item.id)}
                            className={`composer-item relative rounded-lg overflow-hidden cursor-pointer transition-all ${isSelected ? "selected" : ""}`}
                            style={{ 
                              aspectRatio: "3/4",
                              border: isSelected ? "2px solid #2f7a56" : "1px solid rgba(245,240,235,0.08)",
                              background: isSelected ? "rgba(47,122,86,0.08)" : "rgba(245,240,235,0.02)"
                            }}
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0" style={{ background: "#1a1a17" }} />
                            )}
                            <div
                              className="absolute inset-0"
                              style={{ background: "linear-gradient(to top, rgba(13,13,11,0.8) 0%, transparent 60%)" }}
                            />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs text-cream font-light truncate">{item.name}</p>
                              <p className="text-[9px] text-cream opacity-30 uppercase tracking-wider">{item.category}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-400 flex items-center justify-center">
                                <span className="text-[10px] text-cream">✓</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
