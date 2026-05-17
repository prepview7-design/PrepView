import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

export function useAntiCheat(isActive, onTriggerAutoSubmit) {
  const [warnings, setWarnings] = useState(0);
  const MAX_WARNINGS = 3;
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!isActive || hasSubmitted.current) return;

    const handleCheatWarning = (message) => {
      setWarnings((prev) => {
        const newWarnings = prev + 1;
        if (newWarnings >= MAX_WARNINGS) {
          if (!hasSubmitted.current) {
            hasSubmitted.current = true;
            toast.error("Cheating detected. Your test is being automatically submitted.");
            onTriggerAutoSubmit();
          }
        } else {
          toast.error(`${message} (Warning ${newWarnings} of ${MAX_WARNINGS})`, {
            duration: 5000,
          });
        }
        return newWarnings;
      });
    };

    // 1. Tab Switching / Blur
    const handleVisibilityChange = () => {
      if (document.hidden && !hasSubmitted.current) {
        handleCheatWarning("You switched tabs or minimized the browser!");
      }
    };

    // 2. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !hasSubmitted.current) {
        handleCheatWarning("You exited fullscreen mode!");
      }
    };

    // 3. Copy, Paste, Right Click Prevention
    const preventCheat = (e) => {
      e.preventDefault();
      // Only warn on paste or copy, right click is too common to warn for, just block it.
      if (e.type === 'copy' || e.type === 'paste') {
        handleCheatWarning(`You cannot ${e.type} during the test!`);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener('copy', preventCheat);
    document.addEventListener('paste', preventCheat);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Enter Fullscreen automatically when active
    const requestFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request denied by browser.");
      }
    };
    requestFullscreen();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener('copy', preventCheat);
      document.removeEventListener('paste', preventCheat);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [isActive, onTriggerAutoSubmit]);

  return warnings;
}
