export type UserRole = "user" | "moderator" | "admin";
export type UserStatus = "active" | "banned";

export type ApiErrorDetail = {
  field: string;
  reason: string;
};

export type ApiError = {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  traceId?: string;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status?: UserStatus;
  stylePreferences?: string[];
  locale?: string;
};

export type AuthResult = {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
};

export type ItemCategory = "top" | "bottom" | "outer" | "shoes" | "accessory" | "dress";
export type ItemStatus = "active" | "archived";

export type Item = {
  id: string;
  userId: string;
  name: string;
  category: ItemCategory | string;
  color: string;
  styleTags?: string[];
  imageUrl?: string;
  status: ItemStatus | string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateItemPayload = {
  name: string;
  category: string;
  color: string;
  styleTags: string[];
  imageUrl: string;
};

export type ModerationStatus = "pending" | "approved" | "rejected" | "draft";

export type Outfit = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  occasion: string;
  season: string;
  weatherRange?: string;
  imageUrls: string[];
  itemIds: string[];
  moderationStatus: ModerationStatus | string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOutfitPayload = {
  title: string;
  description?: string;
  occasion: string;
  season: string;
  weatherRange?: string;
  imageUrls: string[];
  itemIds?: string[];
};

export type CreateOutfitResult = {
  id: string;
  moderationStatus: string;
};

export type UpdateOutfitPayload = {
  title?: string;
  description?: string;
  occasion?: string;
  season?: string;
  weatherRange?: string;
  imageUrls?: string[];
  itemIds?: string[];
};

export type RecommendationResult = {
  outfitId: string;
  score: number;
  reasons: string[];
};

export type RecommendationQueryPayload = {
  itemIds: string[];
  occasion: string;
  season: string;
  weather: string;
  styleHints: string[];
};

export type RecommendationQueryResult = {
  recommendationId: string;
  results: RecommendationResult[];
};

export type RecommendationDetail = {
  id: string;
  userId: string;
  inputItemIds: string[];
  context: {
    occasion: string;
    season: string;
    weather: string;
    styleHints: string[];
  };
  resultOutfitIds: string[];
  latencyMs: number;
  createdAt: string;
};

export type CreateFeedbackPayload = {
  recommendationId: string;
  helpful: boolean;
  reason?: string;
};

export type CreateFeedbackResult = {
  id: string;
  success: boolean;
};

export type AdminActionResponse = {
  success: boolean;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole | string;
  status: UserStatus | string;
  createdAt: string;
};

// ─── Visual Outfit Upload ─────────────────────────────────────────────────────

export type DraftItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  styleHints: string[];
  imageUrl: string;
};

export type OutfitUploadResponse = {
  draftId: string;
  imageUrl: string;
  title: string;
  description: string;
  occasion: string;
  season: string;
  items: DraftItem[];
};

export type ConfirmItemRequest = {
  id?: string;
  name: string;
  category: string;
  color: string;
  styleHints?: string[];
};

export type ConfirmOutfitRequest = {
  title: string;
  description?: string;
  occasion: string;
  season: string;
  weatherRange?: string;
  items: ConfirmItemRequest[];
};

// ─── Visual Recommendation ────────────────────────────────────────────────────

export type VisualAnalysisSummary = {
  occasion: string;
  season: string;
  styleHints: string[];
  colorPalette: string;
};

export type VisualRecommendationResponse = {
  analysis: VisualAnalysisSummary;
  results: RecommendationResult[];
};
