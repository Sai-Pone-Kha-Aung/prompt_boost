// Single Responsibility Principle: Handle messaging
class ContentMessageService extends window.ContentInterfaces.IMessageService {
  setupMessageListener(callback) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("📨 Message received in content script:", request);

      if (request.action === "syncPrompts") {
        console.log(
          "🔄 Received sync request from background/popup, reloading prompts..."
        );
        callback("syncPrompts");
        sendResponse({ success: true });
        return true;
      }

      if (request.action === "toggleSidebar") {
        console.log("🔄 Received sidebar toggle request from popup...");
        callback("toggleSidebar");
        sendResponse({ success: true });
        return true;
      }

      if (request.action === "getSidebarState") {
        console.log("📊 Received sidebar state request from popup...");
        const state = callback("getSidebarState");
        sendResponse(state || { isVisible: false });
        return true;
      }

      return true;
    });
  }

  setupStorageListener(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      console.log("🔄 Storage changed:", changes, "Area:", areaName);
      if (areaName === "local" && changes.prompts) {
        console.log(
          "✅ Prompts updated in local storage, syncing content script..."
        );
        const prompts = changes.prompts.newValue || [];
        callback("storageChanged", prompts, changes);
      }
    });
  }
}

// Export for use in other modules
window.ContentServices = window.ContentServices || {};
window.ContentServices.ContentMessageService = ContentMessageService;
