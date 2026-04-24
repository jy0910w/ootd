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
import { getSession, updateTokens, clearSession } from "./session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5050/api/v1";

// Custom error for refresh failures
export class RefreshFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefreshFailedError";
  }
}

// Promise cache to prevent duplicate refresh calls
let refreshPromise: Promise<AuthResult> | null = null;

async function refreshTokens(): Promise<AuthResult> {
  // Return existing refresh promise if one is in flight
  if (refreshPromise) {
    return refreshPromise;
  }

  const session = getSession();
  if (!session?.refreshToken) {
    throw new RefreshFailedError("No refresh token available");
  }

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  })
    .then(async (response) => {
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiError | null;
        const message = payload?.message ?? "Token refresh failed";
        throw new RefreshFailedError(message);
      }
      return response.json() as Promise<AuthResult>;
    })
    .then((result) => {
      // Update tokens in session
      updateTokens(result.accessToken, result.refreshToken);
      return result;
    })
    .finally(() => {
      // Clear the promise cache
      refreshPromise = null;
    });

  return refreshPromise;
}

type RequestOptions = RequestInit & {
  skipRefresh?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}, token?: string): Promise<T> {
  const { skipRefresh, ...fetchOptions } = options;
  const isFormData = fetchOptions.body instanceof FormData;
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers ?? {})
    },
    cache: "no-store"
  });

  // Handle 401 with automatic token refresh
  if (response.status === 401 && !skipRefresh && token) {
    try {
      const { accessToken } = await refreshTokens();
      // Retry the original request with the new token
      return request<T>(path, { ...options, skipRefresh: true }, accessToken);
    } catch (error) {
      if (error instanceof RefreshFailedError) {
        // Clear session and re-throw to be handled by AuthGuard
        clearSession();
        throw error;
      }
      throw error;
    }
  }

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
  getOutfitById(token: string, outfitId: string) {
    return request<Outfit>(`/outfits/${outfitId}`, {}, token);
  },
  uploadOutfitImage(token: string, outfitId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<string>(`/outfits/${outfitId}/upload-image`, {
      method: "POST",
      body: form
    }, token);
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
