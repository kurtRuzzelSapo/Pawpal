import { useState, useEffect } from "react";
import { FaDownload, FaMobileAlt, FaTimes } from "react-icons/fa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallButtonProps {
  variant?: "hero" | "button";
  className?: string;
}

export const PWAInstallButton = ({ variant = "button", className = "" }: PWAInstallButtonProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is installed
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }
    };

    setTimeout(checkInstalled, 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // If we have the native prompt (Android Chrome), use it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          setIsInstalled(true);
        }

        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error("Error showing install prompt:", error);
      }
    }

    // Show instructions for iOS or browsers without native prompt
    setShowInstructions(true);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Hero variant - larger button for hero section
  if (variant === "hero") {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-3 bg-white/90 hover:bg-white text-indigo-600 px-6 sm:px-8 py-3 rounded-md text-base sm:text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${className}`}
        >
          <FaMobileAlt className="text-xl" />
          <span>Install App</span>
        </button>

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Install Pawpal</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
              
              {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-indigo-600">1.</span>
                    <p>Tap the <strong>Share</strong> button <span style={{ fontSize: '18px' }}>📤</span> at the bottom</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-indigo-600">2.</span>
                    <p>Scroll and tap <strong>"Add to Home Screen"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-indigo-600">3.</span>
                    <p>Tap <strong>"Add"</strong> to install</p>
                  </div>
                </div>
              ) : /Android/.test(navigator.userAgent) ? (
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-indigo-600">1.</span>
                    <p>Tap the <strong>menu</strong> (three dots ⋮) in your browser</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-indigo-600">2.</span>
                    <p>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-indigo-600">3.</span>
                    <p>Tap <strong>"Install"</strong> or <strong>"Add"</strong></p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  Look for an install icon in your browser's address bar, or check your browser's menu for 'Install' option.
                </p>
              )}
              
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Regular button variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 transition-all duration-200 ${className}`}
      >
        <FaDownload className="text-sm" />
        <span>Install App</span>
      </button>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Install Pawpal</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            
            {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-indigo-600">1.</span>
                  <p>Tap the <strong>Share</strong> button <span style={{ fontSize: '18px' }}>📤</span> at the bottom</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold text-indigo-600">2.</span>
                  <p>Scroll and tap <strong>"Add to Home Screen"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold text-indigo-600">3.</span>
                  <p>Tap <strong>"Add"</strong> to install</p>
                </div>
              </div>
            ) : /Android/.test(navigator.userAgent) ? (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-indigo-600">1.</span>
                  <p>Tap the <strong>menu</strong> (three dots ⋮) in your browser</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold text-indigo-600">2.</span>
                  <p>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-bold text-indigo-600">3.</span>
                  <p>Tap <strong>"Install"</strong> or <strong>"Add"</strong></p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                Look for an install icon in your browser's address bar, or check your browser's menu for 'Install' option.
              </p>
            )}
            
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

