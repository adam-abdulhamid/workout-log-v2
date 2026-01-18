"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { domToPng } from "modern-screenshot";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackModal } from "./feedback-modal";

const FEEDBACK_ENABLED_KEY = "feedback-enabled";

export function FeedbackButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [screenshot, setScreenshot] = useState("");
  const [capturedUrl, setCapturedUrl] = useState("");

  useEffect(() => {
    setIsMounted(true);
    // Check localStorage for enabled state
    const stored = localStorage.getItem(FEEDBACK_ENABLED_KEY);
    setIsEnabled(stored !== "false");

    // Listen for toggle events from settings
    const handleToggle = (e: CustomEvent<boolean>) => {
      setIsEnabled(e.detail);
    };
    window.addEventListener("feedback-toggle", handleToggle as EventListener);
    return () => {
      window.removeEventListener("feedback-toggle", handleToggle as EventListener);
    };
  }, []);

  const handleCapture = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      const dataUrl = await domToPng(document.body, {
        scale: window.devicePixelRatio > 1 ? 0.5 : 1,
        width: window.innerWidth,
        height: window.innerHeight,
        style: {
          transform: `translate(-${window.scrollX}px, -${window.scrollY}px)`,
        },
      });

      setScreenshot(dataUrl);
      setCapturedUrl(window.location.href);
      setModalOpen(true);
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  if (!isMounted || !isEnabled) return null;

  return createPortal(
    <>
      <button
        onClick={handleCapture}
        disabled={isCapturing}
        className="fixed right-3 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-primary/80 hover:bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
        style={{ top: "66.67%" }}
        aria-label="Submit feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      <FeedbackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        screenshot={screenshot}
        url={capturedUrl}
      />
    </>,
    document.body
  );
}
