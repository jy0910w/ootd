import type {
  ApiError,
  AuthResult,
  ConfirmOutfitRequest,
  CreateFeedbackPayload,
  CreateFeedbackResult,
  Item,
  Outfit,
  OutfitUploadResponse,
  PagedResponse,
  RecommendationDetail,
  RecommendationQueryPayload,
  RecommendationQueryResult,
  UpdateOutfitPayload,
  VisualRecommendationResponse
} from "@ootd/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5050/api/v1";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    const message = payload?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}


export const api = {
  register(email: string, password: string, displayName: string) {
    return request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName })
    });
  },
  login(email: string, password: string) {
    return request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  getItems(token: string) {
    return request<PagedResponse<Item>>("/items", {}, token);
  },
  /** Step 1：上傳穿搭圖片 → AI 識別 → 回傳草稿 */
  uploadOutfit(token: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<OutfitUploadResponse>("/outfits/upload", {
      method: "POST",
      body: form
    }, token);
  },
  /** Step 2：確認/編輯草稿 → 建立正式 Outfit */
  confirmOutfit(token: string, draftId: string, payload: ConfirmOutfitRequest) {
    return request<Outfit>(`/outfits/${draftId}/confirm`, {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  /** 公開視覺推薦（不需登入，Rate Limit: 20/hr/IP） */
  visualRecommend(file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<VisualRecommendationResponse>("/recommendations/visual", {
      method: "POST",
      body: form
    });
  },
  queryRecommendation(
    token: string,
    payload: RecommendationQueryPayload
  ) {
    return request<RecommendationQueryResult>("/recommendations/query", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  },
  getRecommendationDetail(token: string, recommendationId: string) {
    return request<RecommendationDetail>(`/recommendations/${recommendationId}`, {}, token);
  },
  getMyOutfits(token: string) {
    return request<PagedResponse<Outfit>>("/outfits/mine", {}, token);
  },
  updateOutfit(token: string, outfitId: string, payload: UpdateOutfitPayload) {
    return request<Outfit>(`/outfits/${outfitId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }, token);
  },
  deleteOutfit(token: string, outfitId: string) {
    return request<void>(`/outfits/${outfitId}`, {
      method: "DELETE"
    }, token);
  },
  createFeedback(token: string, payload: CreateFeedbackPayload) {
    return request<CreateFeedbackResult>("/feedback", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
  }
};

export type {
  AuthResult,
  ConfirmOutfitRequest,
  CreateFeedbackPayload,
  CreateFeedbackResult,
  Item,
  Outfit,
  OutfitUploadResponse,
  RecommendationDetail,
  RecommendationQueryPayload,
  RecommendationQueryResult,
  UpdateOutfitPayload,
  VisualRecommendationResponse
};
