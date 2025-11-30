// Service worker registration is handled automatically by vite-plugin-pwa
// This file is kept for potential future custom PWA functionality
export function registerServiceWorker() {
  // The vite-plugin-pwa handles registration automatically when registerType is "autoUpdate"
  // No manual registration needed
  if ('serviceWorker' in navigator) {
    console.log('Service Worker support detected. Registration handled by vite-plugin-pwa.');
  }
}

