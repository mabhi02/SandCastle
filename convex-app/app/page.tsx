"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  
  // Get real data from Convex
  const appUser = useQuery(api.users.getCurrentAppUser, {});
  const overdueInvoices = useQuery(
    api.dashboard.getOverdueInvoices,
    appUser ? { userId: appUser._id } : "skip"
  );
  
  const [selected, setSelected] = useState<Set<Id<"invoices">>>(new Set());
  const startFollowUps = useMutation(api.collection.startFollowUps);
  const [submitting, setSubmitting] = useState(false);

  // For development: skip authentication redirect
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push("/signin");
  //   }
  // }, [isAuthenticated, isLoading, router]);

  const handleSelectAll = () => {
    if (overdueInvoices) {
      if (selected.size === overdueInvoices.length) {
        setSelected(new Set());
      } else {
        setSelected(new Set(overdueInvoices.map(inv => inv._id)));
      }
    }
  };

  const handleSelectOne = (id: Id<"invoices">) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
  };

  const handleStartFollowUps = async () => {
    if (selected.size === 0) return;
    
    setSubmitting(true);
    try {
      await startFollowUps({ invoiceIds: Array.from(selected) });
      setSelected(new Set());
    } catch (error) {
      console.error("Failed to start follow-ups:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">SandCastle Collections</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Overdue Invoices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select invoices and start automated follow-ups
            </p>
          </div>
          <button
            onClick={handleStartFollowUps}
            disabled={selected.size === 0 || submitting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selected.size === 0 || submitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {submitting ? "Starting..." : `Start Follow-ups (${selected.size})`}
          </button>
        </div>

        {/* Simple Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={overdueInvoices && overdueInvoices.length > 0 && selected.size === overdueInvoices.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!overdueInvoices ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No overdue invoices
                  </td>
                </tr>
              ) : (
                overdueInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(invoice._id)}
                        onChange={() => handleSelectOne(invoice._id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {invoice.vendorName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${((invoice.amountCents - invoice.paidCents) / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${
                        invoice.daysLate > 30 ? "text-red-600" :
                        invoice.daysLate > 15 ? "text-orange-600" :
                        "text-yellow-600"
                      }`}>
                        {invoice.daysLate} days
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {invoice.lastOutcome || "Never contacted"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}