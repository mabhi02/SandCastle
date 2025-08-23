"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CollectionWorkspace() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

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

  // Mock schedule data
  const todaysSchedule = [
    { id: "1", time: "09:00", vendor: "ABC Supply", amount: 2500, status: "completed", outcome: "Paid in full" },
    { id: "2", time: "09:30", vendor: "Tech Solutions", amount: 4200, status: "completed", outcome: "Promise to pay" },
    { id: "3", time: "10:00", vendor: "Global Logistics", amount: 1500, status: "in_progress", outcome: null },
    { id: "4", time: "10:30", vendor: "Prime Vendors", amount: 3100, status: "scheduled", outcome: null },
    { id: "5", time: "11:00", vendor: "Metro Services", amount: 890, status: "scheduled", outcome: null },
    { id: "6", time: "11:30", vendor: "City Supplies", amount: 2200, status: "scheduled", outcome: null },
    { id: "7", time: "14:00", vendor: "Regional Partners", amount: 5500, status: "scheduled", outcome: null },
    { id: "8", time: "14:30", vendor: "Express Delivery", amount: 1750, status: "scheduled", outcome: null },
  ];

  const followUps = [
    { date: "2024-01-15", vendor: "ABC Supply", type: "promise", amount: 1500 },
    { date: "2024-01-16", vendor: "Tech Solutions", type: "callback", amount: 4200 },
    { date: "2024-01-17", vendor: "Global Logistics", type: "promise", amount: 890 },
    { date: "2024-01-18", vendor: "Prime Vendors", type: "payment_due", amount: 3100 },
  ];

  const agentSettings = {
    strategy: "balanced",
    voiceTone: "professional",
    maxDiscount: 20,
    allowInstallments: true,
    autoSendLinks: true,
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collection Workspace</h1>
            <p className="text-gray-500 mt-1">Manage automated collection campaigns</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isPaused
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {isPaused ? "▶ Resume All" : "⏸ Pause All"}
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              + New Campaign
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Collection Schedule */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Today's Collection Schedule</h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {todaysSchedule.map((item) => (
                  <ScheduleItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Agent Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">AI Agent Configuration</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Negotiation Strategy</label>
                  <select className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="aggressive">Aggressive</option>
                    <option value="balanced" selected>Balanced</option>
                    <option value="lenient">Lenient</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Voice Tone</label>
                  <select className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="friendly">Friendly</option>
                    <option value="professional" selected>Professional</option>
                    <option value="firm">Firm</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Discount (%)</label>
                  <input
                    type="number"
                    value={agentSettings.maxDiscount}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={agentSettings.allowInstallments} className="rounded" />
                    <span className="text-sm text-gray-700">Allow installment plans</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={agentSettings.autoSendLinks} className="rounded" />
                    <span className="text-sm text-gray-700">Auto-send payment links</span>
                  </label>
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Save Configuration
                </button>
              </div>
            </div>

            {/* Follow-up Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Follow-ups</h2>
              </div>
              <div className="p-6 space-y-3">
                {followUps.map((followUp, index) => (
                  <FollowUpItem key={index} followUp={followUp} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Collection Performance */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Today's Performance</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <PerformanceMetric label="Calls Made" value="12" icon="📞" />
              <PerformanceMetric label="Connected" value="8" icon="✅" />
              <PerformanceMetric label="Promises" value="5" icon="🤝" />
              <PerformanceMetric label="Payments" value="3" icon="💳" />
              <PerformanceMetric label="Collected" value="$8,420" icon="💰" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ScheduleItem({ item }: { item: any }) {
  const statusConfig = {
    completed: { bg: "bg-green-100", text: "text-green-700", icon: "✅" },
    in_progress: { bg: "bg-blue-100", text: "text-blue-700", icon: "🔄" },
    scheduled: { bg: "bg-gray-100", text: "text-gray-700", icon: "⏰" },
  };

  const config = statusConfig[item.status as keyof typeof statusConfig];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-500 w-12">{item.time}</span>
        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
          <span>{config.icon}</span>
        </div>
        <div>
          <div className="font-medium text-gray-900">{item.vendor}</div>
          <div className="text-sm text-gray-500">
            ${item.amount.toLocaleString()}
            {item.outcome && ` • ${item.outcome}`}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
          {item.status.replace('_', ' ')}
        </span>
        {item.status === "scheduled" && (
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
}

function FollowUpItem({ followUp }: { followUp: any }) {
  const typeConfig = {
    promise: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Promise to Pay" },
    callback: { bg: "bg-blue-100", text: "text-blue-700", label: "Callback" },
    payment_due: { bg: "bg-red-100", text: "text-red-700", label: "Payment Due" },
  };

  const config = typeConfig[followUp.type as keyof typeof typeConfig];

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="text-sm font-medium text-gray-900">{followUp.vendor}</div>
        <div className="text-xs text-gray-500">{followUp.date} • ${followUp.amount.toLocaleString()}</div>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}

function PerformanceMetric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}