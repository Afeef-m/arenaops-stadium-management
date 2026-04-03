"use client";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: {
    confirm: "bg-red-500 text-white hover:bg-red-600",
    icon: "text-red-400",
  },
  warning: {
    confirm: "bg-yellow-500 text-black hover:bg-yellow-600",
    icon: "text-yellow-400",
  },
  info: {
    confirm: "bg-[#10b981] text-black hover:bg-[#059669]",
    icon: "text-[#10b981]",
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  variant = "info",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#111827] border border-white/10 rounded-xl p-6 shadow-2xl">
        <h2 className={`text-lg font-bold mb-2 ${styles.icon}`}>{title}</h2>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-transparent border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} className={styles.confirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
