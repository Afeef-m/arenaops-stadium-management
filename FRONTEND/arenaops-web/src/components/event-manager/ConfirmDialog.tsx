"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "info",
  isLoading = false,
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertCircle className="w-10 h-10 text-red-500 mb-2" />;
      case "warning":
        return <AlertTriangle className="w-10 h-10 text-yellow-500 mb-2" />;
      default:
        return <Info className="w-10 h-10 text-blue-500 mb-2" />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white border-none";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white border-none";
      default:
        return "bg-[#10b981] hover:bg-[#059669] text-black border-none";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#111827] border-white/10 text-white">
        <DialogHeader className="items-center text-center">
          {getIcon()}
          <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-400 pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange?.(false);
            }}
            className="border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange?.(false);
            }}
            className={`${getConfirmButtonStyles()} font-bold uppercase tracking-widest text-[10px] min-w-[100px]`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  title,
  message,
  variant = "info",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <AlertDialogContent className="bg-[#111827] text-white border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-transparent border-white/10 hover:bg-white/5 text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : variant === "warning"
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
