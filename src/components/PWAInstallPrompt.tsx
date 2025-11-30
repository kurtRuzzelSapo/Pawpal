import { useState, useEffect } from "react";
import { FaTimes, FaDownload, FaMobileAlt } from "react-icons/fa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before (stored in localStorage)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Don't show if dismissed in the last 7 days
    if (dismissed && daysSinceDismissed <= 7) {
      return;
    }

    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    let showTimeout: NodeJS.Timeout;
    let hasShown = false;

    // Listen for the beforeinstallprompt event (mainly for Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!hasShown) {
        setShowPrompt(true);
        hasShown = true;
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For mobile devices, show prompt after a delay even without beforeinstallprompt
    // This is especially important for iOS which doesn't support beforeinstallprompt
    if (isMobile) {
      // Show prompt after 3 seconds on mobile (gives time for beforeinstallprompt to fire first)
      showTimeout = setTimeout(() => {
        setShowPrompt((prev) => {
          if (!prev && !hasShown) {
            hasShown = true;
            return true;
          }
          return prev;
        });
      }, 3000);
    }

    // Check if app is installed after a delay (to catch standalone mode)
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    };

    setTimeout(checkInstalled, 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (showTimeout) {
        clearTimeout(showTimeout);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    // If we have the native prompt (Android Chrome), use it
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("User accepted the install prompt");
          setIsInstalled(true);
          setShowPrompt(false);
        } else {
          console.log("User dismissed the install prompt");
          handleDismiss();
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error("Error showing install prompt:", error);
        // Fall through to show instructions
      }
    }

    // Fallback: Show instructions modal for iOS or browsers without native prompt
    if (isIOS) {
      // Create a better modal for iOS instructions
      const modal = document.createElement("div");
      modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4";
      modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Install Pawpal on iOS</h3>
          <div class="space-y-3 text-sm text-gray-700 mb-6">
            <div class="flex items-start gap-3">
              <span class="font-bold text-violet-600">1.</span>
              <p>Tap the <strong>Share</strong> button <span style="font-size: 18px;">📤</span> at the bottom of your screen</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="font-bold text-violet-600">2.</span>
              <p>Scroll down and tap <strong>"Add to Home Screen"</strong></p>
            </div>
            <div class="flex items-start gap-3">
              <span class="font-bold text-violet-600">3.</span>
              <p>Tap <strong>"Add"</strong> in the top right corner</p>
            </div>
          </div>
          <button class="w-full bg-violet-600 text-white py-3 rounded-lg font-semibold hover:bg-violet-700 transition-colors">
            Got it!
          </button>
        </div>
      `;
      document.body.appendChild(modal);
      
      const button = modal.querySelector("button");
      const closeModal = () => {
        document.body.removeChild(modal);
        handleDismiss();
      };
      button?.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    } else if (isAndroid) {
      // Android instructions
      const modal = document.createElement("div");
      modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4";
      modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Install Pawpal on Android</h3>
          <div class="space-y-3 text-sm text-gray-700 mb-6">
            <div class="flex items-start gap-3">
              <span class="font-bold text-violet-600">1.</span>
              <p>Tap the <strong>menu</strong> (three dots ⋮) in your browser</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="font-bold text-violet-600">2.</span>
              <p>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
            </div>
            <div class="flex items-start gap-3">
              <span class="font-bold text-violet-600">3.</span>
              <p>Tap <strong>"Install"</strong> or <strong>"Add"</strong></p>
            </div>
          </div>
          <button class="w-full bg-violet-600 text-white py-3 rounded-lg font-semibold hover:bg-violet-700 transition-colors">
            Got it!
          </button>
        </div>
      `;
      document.body.appendChild(modal);
      
      const button = modal.querySelector("button");
      const closeModal = () => {
        document.body.removeChild(modal);
        handleDismiss();
      };
      button?.addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    } else {
      // Desktop fallback
      alert(
        "To install this app:\n\n" +
        "Look for an install icon in your browser's address bar, " +
        "or check your browser's menu for 'Install' or 'Add to Home Screen' option."
      );
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal time in localStorage
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if already installed or prompt shouldn't be shown
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border border-violet-200 p-4 md:p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <FaMobileAlt className="text-white text-xl" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Install Pawpal App
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Install our app for a better experience! Get quick access, offline support, and faster loading.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <FaDownload className="text-sm" />
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                aria-label="Dismiss"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

