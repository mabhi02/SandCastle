"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function InvoiceQueue() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  // Current app user and their overdue invoices
  const appUser = useQuery(api.users.getCurrentAppUser, {});
  const overdue = useQuery(
    api.dashboard.getOverdueInvoices,
    appUser ? { userId: appUser._id } : "skip"
  );

  type OverdueRow = {
    _id: Id<"invoices">;
    invoiceNo: string;
    vendorName?: string;
    amountCents: number;
    paidCents: number;
    daysLate: number;
    state: "Overdue" | "InProgress" | "PromiseToPay" | "PartialPaid" | "Paid" | "Dispute" | "Reassign" | "Callback" | "DNC";
    lastOutcome?: string | null;
  };

  const [selected, setSelected] = useState<Set<Id<"invoices">>>(new Set());
  const startFollowUps = useMutation(api.collection.startFollowUps);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/signin");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const rows: OverdueRow[] = (overdue ?? []) as unknown as OverdueRow[];

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r._id)));
  };

  const toggleOne = (id: Id<"invoices">) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onStart = async () => {
    if (!selected.size) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await startFollowUps({ invoiceIds: Array.from(selected) });
      setMessage(`Queued ${res.queued} follow-up${res.queued === 1 ? "" : "s"}.`);
      // After queuing, clear selection
      setSelected(new Set());
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to queue follow-ups");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Overdue Invoices</h1>
            <p className="text-gray-500 mt-1">Select and start follow-ups</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              disabled={!selected.size || submitting}
              onClick={onStart}
              className={`px-5 py-2 rounded-lg font-medium text-white ${
                !selected.size || submitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting ? "Queuing…" : `Start Follow-ups (${selected.size})`}
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-sm">{message}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selected.size === rows.length}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Late</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Outcome</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      {appUser ? "No overdue invoices." : "Loading user…"}
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selected.has(r._id)}
                        onChange={() => toggleOne(r._id)}
                      />
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">{r.invoiceNo}</td>
                    <td className="px-6 py-3 text-sm">{r.vendorName}</td>
                    <td className="px-6 py-3 text-sm font-medium">${((r.amountCents - r.paidCents) / 100).toLocaleString()}</td>
                    <td className={`px-6 py-3 text-sm font-medium ${
                      r.daysLate > 20 ? 'text-red-600' : r.daysLate > 10 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {r.daysLate} days
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={r.state} /></td>
                    <td className="px-6 py-3 text-sm text-gray-600">{r.lastOutcome ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
