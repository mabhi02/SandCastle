"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

const navItems = [
  {
    name: "Command Center",
    href: "/",
    icon: "🎯",
    description: "AI Agent Dashboard",
  },
  {
    name: "Live Monitor",
    href: "/live",
    icon: "📞",
    description: "Active Calls & Transcripts",
  },
  {
    name: "Collection",
    href: "/collection",
    icon: "🤖",
    description: "Automated Workflows",
  },
  {
    name: "Invoices",
    href: "/invoices", 
    icon: "📋",
    description: "Queue Management",
  },
  {
    name: "Payments",
    href: "/payments",
    icon: "💳",
    description: "Track & Analytics",
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: "👥",
    description: "Intelligence & History",
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏰</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SandCastle</h1>
              <p className="text-xs text-gray-500">AI Collection Agent</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
                {isActive && (
                  <div className="w-1 h-6 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => void signOut().then(() => router.push("/signin"))}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}