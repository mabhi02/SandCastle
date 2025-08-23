"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";

export default function LiveMonitor() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [selectedCall, setSelectedCall] = useState<string | null>("call-1");

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

  // Mock data for active calls
  const activeCalls = [
    {
      id: "call-1",
      vendor: "ABC Supply Co.",
      invoice: "#INV-2024-001",
      amount: 2500.00,
      duration: "3:45",
      status: "negotiating",
      agent: "AI Agent 1",
    },
    {
      id: "call-2",
      vendor: "Tech Solutions Inc.",
      invoice: "#INV-2024-002",
      amount: 4200.00,
      duration: "1:20",
      status: "calling",
      agent: "AI Agent 2",
    },
  ];

  // Mock transcript data
  const transcript = [
    { speaker: "AI", text: "Hello, this is Sarah from SandCastle Collections calling about invoice #INV-2024-001.", time: "0:00" },
    { speaker: "Vendor", text: "Oh, hi. Yes, I know about that invoice.", time: "0:05" },
    { speaker: "AI", text: "Great! The invoice for $2,500 was due 15 days ago. We wanted to discuss payment options with you today.", time: "0:08" },
    { speaker: "Vendor", text: "Right, we've been having some cash flow issues this month.", time: "0:15" },
    { speaker: "AI", text: "I understand cash flow can be challenging. Would you be able to make a partial payment today?", time: "0:20" },
    { speaker: "Vendor", text: "I might be able to do $1,000 today.", time: "0:25" },
    { speaker: "AI", text: "That's a good start. If you can pay $1,000 today, when would you be able to pay the remaining $1,500?", time: "0:30" },
    { speaker: "Vendor", text: "Probably by the end of next week.", time: "0:35" },
    { speaker: "AI", text: "Perfect! I can send you a payment link for $1,000 right now, and we'll schedule a follow-up for the remaining balance next Friday. Does that work for you?", time: "0:40" },
  ];

  const selectedCallData = activeCalls.find(c => c.id === selectedCall);

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Collection Monitor</h1>
              <p className="text-gray-500 mt-1">Real-time call monitoring and transcripts</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-gray-700">{activeCalls.length} Active Calls</span>
              </span>
            </div>
          </div>
        </div>

        {/* Active Calls Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex space-x-4 overflow-x-auto">
            {activeCalls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call.id)}
                className={`flex-shrink-0 p-3 rounded-lg border transition-all ${
                  selectedCall === call.id
                    ? "bg-white border-blue-500 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="text-2xl">📞</span>
                    <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm text-gray-900">{call.vendor}</div>
                    <div className="text-xs text-gray-500">{call.duration} • ${call.amount.toLocaleString()}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Live Transcript */}
          <div className="flex-1 bg-white border-r border-gray-200">
            <div className="h-full flex flex-col">
              {/* Transcript Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Live Transcript</h3>
                  <div className="flex items-center space-x-2">
                    <AudioWaveform />
                    <span className="text-sm text-gray-500">Recording</span>
                  </div>
                </div>
              </div>

              {/* Transcript Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {transcript.map((message, index) => (
                  <TranscriptMessage key={index} message={message} />
                ))}
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-sm">AI is listening...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Context Panel */}
          <div className="w-96 bg-gray-50">
            <div className="h-full flex flex-col">
              {/* Context Header */}
              <div className="p-4 bg-white border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Call Context</h3>
              </div>

              {/* Context Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Invoice Details */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invoice:</span>
                      <span className="font-medium">{selectedCallData?.invoice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium">${selectedCallData?.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Days Overdue:</span>
                      <span className="font-medium text-red-600">15 days</span>
                    </div>
                  </div>
                </div>

                {/* Negotiation Parameters */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Negotiation Parameters</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Min Acceptable</span>
                        <span className="font-medium">40%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Current Offer</span>
                        <span className="font-medium text-green-600">60%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Decision Tree */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">AI Strategy</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span>Offered partial payment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span>Vendor accepted $1,000 today</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-600">
                      <span>→</span>
                      <span>Scheduling follow-up for remainder</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <span>○</span>
                      <span>Send payment link</span>
                    </div>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Send Payment Link Now
                    </button>
                    <button className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Adjust Parameters
                    </button>
                    <button className="w-full px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                      End Call
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function TranscriptMessage({ message }: { message: any }) {
  const isAI = message.speaker === "AI";
  
  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-lg ${isAI ? "order-2" : "order-1"}`}>
        <div className="flex items-center space-x-2 mb-1">
          <span className={`text-xs font-medium ${isAI ? "text-blue-600" : "text-gray-600"}`}>
            {message.speaker}
          </span>
          <span className="text-xs text-gray-400">{message.time}</span>
        </div>
        <div className={`p-3 rounded-lg ${
          isAI 
            ? "bg-blue-50 text-blue-900 border border-blue-200" 
            : "bg-gray-100 text-gray-900 border border-gray-200"
        }`}>
          {message.text}
        </div>
      </div>
    </div>
  );
}

function AudioWaveform() {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1 bg-green-500 rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 16 + 8}px`,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}