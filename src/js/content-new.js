// Main content script - loads all modules and initializes the application

// Initialize when the script loads
function initializePromptBoost() {
  const promptBoost =
    window.ContentFactories.ContentServiceFactory.createPromptBoost();
  promptBoost.init();
  return promptBoost;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePromptBoost);
} else {
  initializePromptBoost();
}

// Handle dynamic page changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      // Reinitialize if needed
      if (!document.getElementById("prompt-boost-sidebar")) {
        initializePromptBoost();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
