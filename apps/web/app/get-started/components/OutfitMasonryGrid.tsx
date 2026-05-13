"use client";

import { useRouter } from "next/navigation";
import type { OutfitBrief } from "@ootd/types";

const HEIGHTS = [560, 680, 500, 620, 460, 540, 580, 520];

export function OutfitMasonryGrid({ outfits }: { outfits: OutfitBrief[] }) {
  const router = useRouter();

  if (outfits.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-sans text-2xl font-light text-gray-300 dark:text-gray-700 mb-2 italic">
          暫無推薦
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          資料庫中還沒有適合的穿搭推薦
        </p>
      </div>
    );
  }

  return (
    <div className="masonry" style={{ columnGap: "1rem", rowGap: "1rem" }}>
      {outfits.map((outfit, index) => {
        const height = HEIGHTS[index % HEIGHTS.length];
        return (
          <div
            key={outfit.id}
            className="masonry-item relative rounded-lg overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl"
            style={{ height: `${height}px` }}
            onClick={() => router.push(`/outfits/${outfit.id}`)}
          >
            <img
              src={outfit.imageUrl}
              alt={outfit.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                {outfit.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/80 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm">
                  {outfit.occasion}
                </span>
                <span className="text-xs text-white/80 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm">
                  {outfit.season}
                </span>
              </div>
              {outfit.reasons && outfit.reasons.length > 0 && (
                <p className="text-xs text-white/70 line-clamp-2">
                  {outfit.reasons.join("、")}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-brand-400 font-medium">
                  相符度 {Math.round(outfit.score * 100)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
