import type {
  ApiError,
  AuthResult,
  CreateFeedbackPayload,
  CreateFeedbackResult,
  CreateItemPayload,
  CreateOutfitPayload,
  CreateOutfitResult,
  Item,
  Outfit,
  PagedResponse,
  RecommendationDetail,
  RecommendationQueryPayload,
  RecommendationQueryResult,
  UpdateOutfitPayload
} from "@ootd/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5050/api/v1";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
  createItem(
    token: string,
    payload: CreateItemPayload
  ) {
    return request<Item>("/items", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
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
  createOutfit(token: string, payload: CreateOutfitPayload) {
    return request<CreateOutfitResult>("/outfits", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);
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
  CreateFeedbackPayload,
  CreateFeedbackResult,
  CreateItemPayload,
  CreateOutfitPayload,
  CreateOutfitResult,
  Item,
  Outfit,
  RecommendationDetail,
  RecommendationQueryPayload,
  RecommendationQueryResult,
  UpdateOutfitPayload
};
