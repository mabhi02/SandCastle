import React from "react";

type InvoiceStatus = 
  | "Overdue"
  | "InProgress"
  | "PromiseToPay"
  | "PartialPaid"
  | "Paid"
  | "Dispute"
  | "Reassign"
  | "Callback"
  | "DNC";

type PaymentStatus = "created" | "sent" | "succeeded" | "failed";

const invoiceStatusStyles: Record<InvoiceStatus, { bg: string; text: string; border: string }> = {
  Overdue: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  InProgress: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  PromiseToPay: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  PartialPaid: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Paid: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Dispute: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Reassign: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  Callback: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  DNC: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

const paymentStatusStyles: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
  created: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  succeeded: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  failed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

interface StatusBadgeProps {
  status: InvoiceStatus | PaymentStatus;
  type?: "invoice" | "payment";
}

export default function StatusBadge({ status, type = "invoice" }: StatusBadgeProps) {
  const styles = type === "invoice" 
    ? invoiceStatusStyles[status as InvoiceStatus]
    : paymentStatusStyles[status as PaymentStatus];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles.bg} ${styles.text} ${styles.border}`}
    >
      {status}
    </span>
  );
}