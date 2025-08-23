"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CommandCenter() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  // For now, we'll use placeholder data until we have proper user context
  // const metrics = useQuery(api.dashboard.getInvoiceMetrics, { userId: "placeholder" });
  // const overdueInvoices = useQuery(api.dashboard.getOverdueInvoices, { userId: "placeholder" });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Placeholder data for UI development
  const metrics = {
    overdue: 12,
    inProgress: 5,
    paid: 28,
    totalOutstandingCents: 4523400,
  };

  const activeCollections = [
    {
      id: "1",
      vendorName: "ABC Supply Co.",
      status: "calling" as const,
      duration: "2:34",
      amount: 1250.00,
    },
    {
      id: "2",
      vendorName: "Tech Solutions Inc.",
      status: "negotiating" as const,
      duration: "5:12",
      amount: 3200.00,
    },
    {
      id: "3",
      vendorName: "Global Logistics",
      status: "sending_payment" as const,
      duration: "0:45",
      amount: 890.00,
    },
  ];

  const recentActivity = [
    {
      id: "1",
      time: "2 min ago",
      type: "payment_received",
      vendor: "XYZ Corp",
      amount: 2500.00,
    },
    {
      id: "2", 
      time: "15 min ago",
      type: "call_completed",
      vendor: "ABC Supply",
      outcome: "Promise to pay tomorrow",
    },
    {
      id: "3",
      time: "1 hour ago",
      type: "email_sent",
      vendor: "Tech Solutions",
      action: "Payment link sent",
    },
  ];

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
          <p className="text-gray-500 mt-1">AI Collection Agent Overview</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Overdue Invoices"
            value={metrics.overdue}
            icon="🔴"
            trend="+2"
            trendUp={false}
          />
          <MetricCard
            title="In Progress"
            value={metrics.inProgress}
            icon="🔄"
            trend="Active"
            trendUp={true}
          />
          <MetricCard
            title="Paid Today"
            value={metrics.paid}
            icon="✅"
            trend="+12%"
            trendUp={true}
          />
          <MetricCard
            title="Outstanding"
            value={`$${(metrics.totalOutstandingCents / 100).toLocaleString()}`}
            icon="💰"
            trend="-$5,234"
            trendUp={true}
          />
        </div>

        {/* Active AI Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Collections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active AI Sessions</h2>
                <span className="flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-gray-500">{activeCollections.length} Active</span>
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {activeCollections.map((collection) => (
                <ActiveCollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6 space-y-4">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>

        {/* Collection Pipeline */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Collection Pipeline</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <PipelineStage
                title="Queued"
                count={8}
                icon="📋"
                color="bg-gray-100"
              />
              <div className="flex-shrink-0 w-8 h-0.5 bg-gray-300"></div>
              <PipelineStage
                title="Calling"
                count={3}
                icon="📞"
                color="bg-blue-100"
              />
              <div className="flex-shrink-0 w-8 h-0.5 bg-gray-300"></div>
              <PipelineStage
                title="Negotiating"
                count={2}
                icon="🤝"
                color="bg-yellow-100"
              />
              <div className="flex-shrink-0 w-8 h-0.5 bg-gray-300"></div>
              <PipelineStage
                title="Payment Sent"
                count={5}
                icon="📧"
                color="bg-purple-100"
              />
              <div className="flex-shrink-0 w-8 h-0.5 bg-gray-300"></div>
              <PipelineStage
                title="Paid"
                count={28}
                icon="✅"
                color="bg-green-100"
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </div>
  );
}

function ActiveCollectionCard({ collection }: any) {
  const statusConfig = {
    calling: { bg: "bg-blue-100", text: "text-blue-700", label: "Calling" },
    negotiating: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Negotiating" },
    sending_payment: { bg: "bg-purple-100", text: "text-purple-700", label: "Sending Payment" },
  };

  const config = statusConfig[collection.status as keyof typeof statusConfig];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
            <span>📞</span>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>
        <div>
          <div className="font-medium text-gray-900">{collection.vendorName}</div>
          <div className="text-sm text-gray-500">${collection.amount.toLocaleString()}</div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
          {config.label}
        </span>
        <span className="text-sm text-gray-500">{collection.duration}</span>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View →
        </button>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: any) {
  const typeConfig = {
    payment_received: { icon: "💰", color: "text-green-600" },
    call_completed: { icon: "📞", color: "text-blue-600" },
    email_sent: { icon: "📧", color: "text-purple-600" },
  };

  const config = typeConfig[activity.type as keyof typeof typeConfig];

  return (
    <div className="flex items-start space-x-3">
      <span className={`text-lg ${config.color}`}>{config.icon}</span>
      <div className="flex-1">
        <div className="text-sm text-gray-900 font-medium">{activity.vendor}</div>
        <div className="text-sm text-gray-500">
          {activity.outcome || activity.action || `$${activity.amount?.toLocaleString()} received`}
        </div>
      </div>
      <span className="text-xs text-gray-400">{activity.time}</span>
    </div>
  );
}

function PipelineStage({ title, count, icon, color }: any) {
  return (
    <div className="flex-1">
      <div className={`${color} rounded-lg p-4 text-center`}>
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-2xl font-bold text-gray-900">{count}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    </div>
  );
}