"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";

export default function ARCollectionHub() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "invoices" | "vendors" | "payments">("active");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

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

  // Mock data - would be replaced with real Convex queries
  const activeCalls = [
    {
      id: "call-1",
      vendor: "ABC Supply Co.",
      invoice: "INV-2024-001",
      amount: 2500,
      status: "negotiating",
      duration: "3:45",
      transcript: "Discussing payment terms...",
      aiScore: 95,
    },
    {
      id: "call-2",
      vendor: "Tech Solutions",
      invoice: "INV-2024-002",
      amount: 4200,
      status: "calling",
      duration: "0:15",
      transcript: "Dialing...",
      aiScore: 88,
    },
  ];

  const invoices = [
    {
      id: "INV-001",
      vendor: "ABC Supply Co.",
      amount: 5200,
      daysOverdue: 14,
      status: "Overdue" as const,
      aiScore: 95,
      lastAttempt: "2 hours ago",
      nextAction: "Call scheduled 3pm",
      callStatus: "active",
    },
    {
      id: "INV-002",
      vendor: "Tech Solutions Inc.",
      amount: 3500,
      daysOverdue: 10,
      status: "InProgress" as const,
      aiScore: 88,
      lastAttempt: "Today 9am",
      nextAction: "Payment link sent",
      callStatus: "idle",
    },
    {
      id: "INV-003",
      vendor: "Global Logistics",
      amount: 8900,
      daysOverdue: 30,
      status: "Overdue" as const,
      aiScore: 82,
      lastAttempt: "Yesterday",
      nextAction: "Follow-up tomorrow",
      callStatus: "idle",
    },
    {
      id: "INV-004",
      vendor: "Prime Vendors",
      amount: 2100,
      daysOverdue: 5,
      status: "PromiseToPay" as const,
      aiScore: 75,
      lastAttempt: "1 hour ago",
      nextAction: "Expecting payment",
      callStatus: "completed",
    },
  ];

  const vendors = [
    {
      id: "V-001",
      name: "ABC Supply Co.",
      outstanding: 12500,
      invoiceCount: 3,
      avgDaysLate: 12,
      contactability: "High",
      lastPayment: "30 days ago",
      preferredChannel: "voice",
      status: "active",
    },
    {
      id: "V-002",
      name: "Tech Solutions Inc.",
      outstanding: 8200,
      invoiceCount: 2,
      avgDaysLate: 8,
      contactability: "Medium",
      lastPayment: "15 days ago",
      preferredChannel: "email",
      status: "idle",
    },
  ];

  const payments = [
    {
      id: "PAY-001",
      vendor: "XYZ Corp",
      invoice: "INV-2023-998",
      amount: 2500,
      status: "succeeded" as const,
      method: "Payment Link",
      timestamp: "10 min ago",
    },
    {
      id: "PAY-002",
      vendor: "Metro Services",
      invoice: "INV-2023-999",
      amount: 1200,
      status: "sent" as const,
      method: "Email Link",
      timestamp: "1 hour ago",
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">🏰 SandCastle AR Collection</h1>
            <div className="flex items-center space-x-2 text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-gray-600">{activeCalls.length} Active Calls</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">$45,200 Outstanding</span>
              <span className="text-gray-400">|</span>
              <span className="text-green-600 font-medium">$8,420 Collected Today</span>
            </div>
          </div>
          <button
            onClick={() => router.push("/signin")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {[
            { id: "active", label: "Active Calls", count: activeCalls.length },
            { id: "invoices", label: "Invoices", count: invoices.length },
            { id: "vendors", label: "Vendors", count: vendors.length },
            { id: "payments", label: "Payments", count: payments.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="font-medium">{tab.label}</span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* Active Calls Table */}
        {activeTab === "active" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Live Transcript</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            {call.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{call.vendor}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{call.invoice}</td>
                      <td className="px-4 py-3 text-sm font-medium">${call.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{call.duration}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                          {call.aiScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 italic max-w-xs truncate">
                          {call.transcript}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Listen
                          </button>
                          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                            Send Link
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            End
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Queue Selected for AI
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                  Send Payment Links
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {selectedInvoices.size > 0 && `${selectedInvoices.size} selected`}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Live</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Attempt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={() => {
                            const newSet = new Set(selectedInvoices);
                            if (newSet.has(invoice.id)) {
                              newSet.delete(invoice.id);
                            } else {
                              newSet.add(invoice.id);
                            }
                            setSelectedInvoices(newSet);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {invoice.callStatus === "active" && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                        {invoice.callStatus === "completed" && (
                          <span className="text-green-600">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          invoice.aiScore >= 90 ? "bg-green-100 text-green-700" :
                          invoice.aiScore >= 75 ? "bg-yellow-100 text-yellow-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {invoice.aiScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{invoice.id}</td>
                      <td className="px-4 py-3 text-sm">{invoice.vendor}</td>
                      <td className="px-4 py-3 text-sm font-medium">${invoice.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          invoice.daysOverdue > 20 ? "text-red-600" :
                          invoice.daysOverdue > 10 ? "text-orange-600" :
                          "text-yellow-600"
                        }`}>
                          {invoice.daysOverdue} days
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{invoice.lastAttempt}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{invoice.nextAction}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Collect
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 text-sm">
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vendors Table */}
        {activeTab === "vendors" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Days Late</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contactability</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {vendor.status === "active" && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{vendor.name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-red-600">
                      ${vendor.outstanding.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{vendor.invoiceCount}</td>
                    <td className="px-4 py-3 text-sm">{vendor.avgDaysLate} days</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        vendor.contactability === "High" ? "bg-green-100 text-green-700" :
                        vendor.contactability === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {vendor.contactability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.lastPayment}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-gray-600">
                        {vendor.preferredChannel === "voice" ? "📞" : "📧"} {vendor.preferredChannel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Contact
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 text-sm">
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Table */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.timestamp}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} type="payment" />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{payment.vendor}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.invoice}</td>
                    <td className="px-4 py-3 text-sm font-medium">${payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.method}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}