// Single Responsibility Principle: Handle Chrome storage operations
class ChromeStorageService extends window.PopupInterfaces.IPromptService {
  async loadPrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["prompts"], (result) => {
        resolve(result.prompts || []);
      });
    });
  }

  async savePrompts(prompts) {
    return new Promise((resolve, reject) => {
      const promptsData = JSON.stringify(prompts);
      const dataSize = new Blob([promptsData]).size;

      console.log("Saving prompts to local storage:", {
        promptsCount: prompts.length,
        dataSize: dataSize,
        storageType: "local",
      });

      chrome.storage.local.set({ prompts: prompts }, () => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          const errorMessage = error.message || "Unknown storage error";

          console.error("Local storage error:", {
            fullError: error,
            errorMessage: errorMessage,
            promptsCount: prompts.length,
            promptsSize: dataSize,
          });

          reject(new Error(`Storage Error: ${errorMessage}`));
        } else {
          console.log("Prompts saved successfully to local storage");

          // Send sync message to notify content scripts
          chrome.runtime
            .sendMessage({ action: "broadcastSync" })
            .catch((error) => {
              console.log("Could not send broadcast sync message:", error);
            });

          resolve();
        }
      });
    });
  }

  async saveApiKey(apiKey) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, resolve);
    });
  }

  async loadApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("geminiApiKey", (result) => {
        resolve(result.geminiApiKey || "");
      });
    });
  }
}

// Export for use in other modules
window.PopupServices = window.PopupServices || {};
window.PopupServices.ChromeStorageService = ChromeStorageService;
