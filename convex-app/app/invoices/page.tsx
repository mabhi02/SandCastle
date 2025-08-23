"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";

export default function InvoiceQueue() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("ai_score");

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

  // Mock invoice data with AI scoring
  const invoices = [
    {
      id: "INV-001",
      vendor: "ABC Supply Co.",
      amount: 5200,
      dueDate: "2024-01-01",
      daysOverdue: 14,
      status: "Overdue" as const,
      aiScore: 95,
      aiReason: "High payment history, responds well to calls",
      lastContact: "2 days ago",
      attempts: 2,
    },
    {
      id: "INV-002",
      vendor: "Tech Solutions Inc.",
      amount: 3500,
      dueDate: "2024-01-05",
      daysOverdue: 10,
      status: "InProgress" as const,
      aiScore: 88,
      aiReason: "Currently negotiating, 60% collection probability",
      lastContact: "Today",
      attempts: 3,
    },
    {
      id: "INV-003",
      vendor: "Global Logistics",
      amount: 8900,
      dueDate: "2023-12-15",
      daysOverdue: 30,
      status: "Overdue" as const,
      aiScore: 82,
      aiReason: "Large amount, best time to call is mornings",
      lastContact: "1 week ago",
      attempts: 5,
    },
    {
      id: "INV-004",
      vendor: "Prime Vendors",
      amount: 2100,
      dueDate: "2024-01-10",
      daysOverdue: 5,
      status: "PromiseToPay" as const,
      aiScore: 75,
      aiReason: "Promised payment by Friday",
      lastContact: "Yesterday",
      attempts: 1,
    },
    {
      id: "INV-005",
      vendor: "Metro Services",
      amount: 1500,
      dueDate: "2023-12-20",
      daysOverdue: 25,
      status: "Overdue" as const,
      aiScore: 70,
      aiReason: "Small amount, quick win potential",
      lastContact: "3 days ago",
      attempts: 4,
    },
  ];

  const handleSelectAll = () => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(invoices.map(inv => inv.id)));
    }
  };

  const handleSelectInvoice = (id: string) => {
    const newSelection = new Set(selectedInvoices);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedInvoices(newSelection);
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice Queue</h1>
            <p className="text-gray-500 mt-1">AI-prioritized collection queue</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Export CSV
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              + Add Invoice
            </button>
          </div>
        </div>

        {/* Filters and Actions Bar */}
        <div className="mb-6 flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="overdue">Overdue</option>
              <option value="inprogress">In Progress</option>
              <option value="promise">Promise to Pay</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ai_score">AI Priority Score</option>
              <option value="amount">Amount</option>
              <option value="days_overdue">Days Overdue</option>
              <option value="vendor">Vendor Name</option>
            </select>
          </div>
          {selectedInvoices.size > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedInvoices.size} selected
              </span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Queue for AI Collection
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Send Payment Links
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Update Status
              </button>
            </div>
          )}
        </div>

        {/* AI Insights Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-medium text-gray-900">AI Collection Insights</h3>
                <p className="text-sm text-gray-600">
                  Best time to collect: <span className="font-medium">9:00 AM - 11:00 AM</span> • 
                  Expected collection today: <span className="font-medium text-green-600">$12,500</span> • 
                  Top opportunity: <span className="font-medium">ABC Supply Co. (95% probability)</span>
                </p>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Details →
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === invoices.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    isSelected={selectedInvoices.has(invoice.id)}
                    onSelect={() => handleSelectInvoice(invoice.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InvoiceRow({ invoice, isSelected, onSelect }: any) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 75) return "text-yellow-600 bg-yellow-50";
    if (score >= 60) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(invoice.aiScore)}`}>
            {invoice.aiScore}
          </div>
          <div className="group relative">
            <span className="text-gray-400 hover:text-gray-600 cursor-help">ⓘ</span>
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg z-10">
              {invoice.aiReason}
              <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{invoice.vendor}</div>
        <div className="text-xs text-gray-500">{invoice.attempts} attempts</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">${invoice.amount.toLocaleString()}</div>
      </td>
      <td className="px-6 py-4">
        <div className={`text-sm font-medium ${invoice.daysOverdue > 20 ? 'text-red-600' : invoice.daysOverdue > 10 ? 'text-orange-600' : 'text-yellow-600'}`}>
          {invoice.daysOverdue} days
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={invoice.status} />
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500">{invoice.lastContact}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Collect
          </button>
          <span className="text-gray-300">|</span>
          <button className="text-gray-600 hover:text-gray-700 text-sm">
            Details
          </button>
        </div>
      </td>
    </tr>
  );
}