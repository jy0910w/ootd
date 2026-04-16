import type { AdminActionResponse, AdminUser, ApiError, AuthResult, Outfit, PagedResponse } from "@ootd/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5282/api/v1";

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
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type ModerationOutfit = Outfit;

export const api = {
  login(email: string, password: string) {
    return request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  getModerationOutfits(token: string, status = "pending") {
    return request<PagedResponse<ModerationOutfit>>(`/admin/moderation/outfits?status=${status}`, {}, token);
  },
  approveOutfit(token: string, outfitId: string) {
    return request<AdminActionResponse>(`/admin/moderation/outfits/${outfitId}/approve`, {
      method: "POST",
      body: JSON.stringify({})
    }, token);
  },
  rejectOutfit(token: string, outfitId: string, reason: string) {
    return request<AdminActionResponse>(`/admin/moderation/outfits/${outfitId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    }, token);
  },
  getUsers(token: string) {
    return request<PagedResponse<AdminUser>>("/admin/users", {}, token);
  },
  banUser(token: string, userId: string) {
    return request<AdminActionResponse>(`/admin/users/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify({})
    }, token);
  },
  unbanUser(token: string, userId: string) {
    return request<AdminActionResponse>(`/admin/users/${userId}/unban`, {
      method: "POST",
      body: JSON.stringify({})
    }, token);
  }
};

export type { AdminUser, AuthResult, PagedResponse };
