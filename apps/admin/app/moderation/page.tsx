"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { RequireAdmin } from "@/components/require-admin";
import { api, ModerationOutfit } from "@/lib/api";
import { AdminSessionState } from "@/lib/session";

export default function ModerationPage() {
  return <RequireAdmin>{(session) => <ModerationContent session={session} />}</RequireAdmin>;
}

function ModerationContent({ session }: { session: AdminSessionState }) {
  const [status, setStatus] = useState("pending");
  const [outfits, setOutfits] = useState<ModerationOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("不符合社群規範");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadOutfits = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await api.getModerationOutfits(session.accessToken, status);
      setOutfits(result.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "載入審核清單失敗");
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, status]);

  useEffect(() => {
    void loadOutfits();
  }, [loadOutfits]);

  async function handleApprove(outfitId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.approveOutfit(session.accessToken, outfitId);
      setSuccessMessage("審核已通過。");
      await loadOutfits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "審核操作失敗");
    }
  }

  async function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectingId) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.rejectOutfit(session.accessToken, rejectingId, rejectReason);
      setSuccessMessage("審核已駁回。");
      setRejectingId(null);
      await loadOutfits();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "駁回操作失敗");
    }
  }

  return (
    <main>
      <AdminNav session={session} />

      <section className="card">
        <h2>內容審核佇列</h2>
        <p>檢視待審核穿搭，並進行 approve/reject。</p>

        <div className="row" style={{ marginBottom: 12 }}>
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ maxWidth: 220 }}>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
          <button className="subtle" type="button" onClick={() => void loadOutfits()}>
            重新載入
          </button>
        </div>

        <ul className="list">
          {outfits.map((outfit) => (
            <li className="item" key={outfit.id}>
              <strong>{outfit.title}</strong>
              <div className="muted">
                {outfit.occasion} / {outfit.season} / {outfit.moderationStatus}
              </div>
              <div className="muted">user: {outfit.userId}</div>
              <div className="muted">images: {outfit.imageUrls.length} / items: {outfit.itemIds.length}</div>
              {status === "pending" ? (
                <div className="row" style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => void handleApprove(outfit.id)}>
                    Approve
                  </button>
                  <button className="danger" type="button" onClick={() => setRejectingId(outfit.id)}>
                    Reject
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {!loading && outfits.length === 0 ? <li className="item muted">目前沒有資料。</li> : null}
        </ul>
      </section>

      {rejectingId ? (
        <section className="card" style={{ marginTop: 12 }}>
          <h2>駁回理由</h2>
          <form className="form-grid" onSubmit={handleReject}>
            <label>
              Reason
              <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={3} required />
            </label>
            <div className="row">
              <button type="submit">送出駁回</button>
              <button className="subtle" type="button" onClick={() => setRejectingId(null)}>
                取消
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {successMessage ? <div className="message">{successMessage}</div> : null}
      {errorMessage ? <div className="message error">{errorMessage}</div> : null}
    </main>
  );
}
