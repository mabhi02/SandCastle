"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export default function CollectPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId as unknown as Id<"invoices">;

  const invoice = useQuery(api.users.getInvoiceById, invoiceId ? { invoiceId } : "skip");
  const run = useQuery(api.collection.getActiveRun, invoiceId ? { invoiceId } : "skip");
  const paymentStatus = useQuery(api.payments.getPaymentStatus, invoiceId ? { invoiceId } : "skip");

  if (!invoice || !run || !paymentStatus) return <p>Loading…</p>;
  if (invoice === null) return <p>Invoice not found</p>;

  return (
    <main className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Collect • #{invoice.invoiceNo}</h1>
        <span className="text-sm text-muted-foreground">
          ${(invoice.amountCents / 100).toLocaleString()} total • Paid ${(invoice.paidCents / 100).toLocaleString()}
        </span>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-md">
          <h2 className="font-semibold mb-2">Live Trace</h2>
          {run === null ? (
            <p>No active run</p>
          ) : (
            <ul className="text-sm flex flex-col gap-1">
              {run.trace.map((t, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{t.time}</span>
                  <span>{t.summary}</span>
                  <span className="opacity-60">{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-md">
          <h2 className="font-semibold mb-2">Payments</h2>
          <p className="text-sm">
            Total paid: ${(paymentStatus.totalPaidCents / 100).toLocaleString()}
          </p>
          <p className="text-sm">Pending: {paymentStatus.pendingPayments.length}</p>
          {paymentStatus.lastPaymentAt && (
            <p className="text-xs opacity-70">
              Last at {new Date(paymentStatus.lastPaymentAt).toLocaleString()}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

