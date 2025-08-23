"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        AR Collections Agent Demo
        <SignOutButton />
      </header>
      <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <DashboardContent />
      </main>
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  if (!isAuthenticated) return null;
  return (
    <button
      className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-2 py-1"
      onClick={() => void signOut().then(() => router.push("/signin"))}
    >
      Sign out
    </button>
  );
}

function DashboardContent() {
  const appUser = useQuery(api.users.getCurrentAppUser, {});
  const metrics = useQuery(
    api.dashboard.getInvoiceMetrics,
    appUser ? { userId: appUser._id } : undefined
  );
  const overdue = useQuery(
    api.dashboard.getOverdueInvoices,
    appUser ? { userId: appUser._id } : undefined
  );

  if (!appUser || !metrics || !overdue) {
    return <p>Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Overdue" value={metrics.overdue} />
        <StatCard label="In progress" value={metrics.inProgress} />
        <StatCard label="Paid" value={metrics.paid} />
      </div>
      <p className="text-sm text-muted-foreground">
        Total outstanding: ${" "}
        {(metrics.totalOutstandingCents / 100).toLocaleString()}
      </p>
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Overdue invoices</h2>
        {overdue.length === 0 && <p>None 🎉</p>}
        <div className="flex flex-col gap-2">
          {overdue.map((inv) => (
            <div
              key={inv._id}
              className="flex justify-between items-center bg-slate-200 dark:bg-slate-800 p-3 rounded-md"
            >
              <div className="flex flex-col">
                <span className="font-semibold">
                  {inv.vendorName} • #{inv.invoiceNo}
                </span>
                <span className="text-sm text-muted-foreground">
                  ${ (inv.amountCents / 100).toLocaleString() } • {inv.daysLate} days late • Attempts this week: {inv.attemptsThisWeek}
                </span>
              </div>
              <Link
                href={`/collect/${inv._id}`}
                className="bg-foreground text-background px-3 py-1 rounded-md text-sm"
              >
                Collect
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-md text-center">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}


