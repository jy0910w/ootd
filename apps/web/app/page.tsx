"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MvpNav } from "@/components/mvp-nav";
import { getSession, SessionState } from "@/lib/session";

// ─── Outfit Photos ────────────────────────────────────────────────────────────
// 16 curated Unsplash photos: fashion, streetwear, outfits
const OUTFIT_PHOTOS = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1467632499275-7a693a761056?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=500&h=625&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=500&h=625&fit=crop&q=80"
];

// ─── Masonry heights (cycling pattern) ────────────────────────────────────────
const HEIGHTS = [560, 680, 500, 620, 460, 540, 580, 520];

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  function openPrimaryEntry() {
    if (session) {
      router.push("/get-started");
      return;
    }

    router.push("/login?returnUrl=%2Fget-started");
  }

  return (
    <>
      <MvpNav session={session} />

      {/* ─── Main Content: Masonry Grid ────────────────────────────────────── */}
      <div className="pt-14 min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-10 py-8">
          
          {/* Masonry grid */}
          <div className="masonry pb-16">
            {OUTFIT_PHOTOS.map((photo, i) => (
              <div key={i} className="masonry-item">
                <div 
                  className="item-card relative rounded-lg overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-900 shadow-sm hover:shadow-xl transition-shadow duration-300"
                  onClick={openPrimaryEntry}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openPrimaryEntry();
                    }
                  }}
                >
                  <img
                    src={photo}
                    alt={`Outfit inspiration ${i + 1}`}
                    className="w-full block object-cover"
                    style={{ height: HEIGHTS[i % HEIGHTS.length] }}
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hover text */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-sm font-medium tracking-wide px-4 py-2 rounded-full bg-brand-500/90 backdrop-blur-sm">
                      {session ? "開始你的穿搭之旅" : "登入後開始使用"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
