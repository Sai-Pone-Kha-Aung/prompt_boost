// Single Responsibility Principle: Handle storage operations
class ContentStorageService extends window.ContentInterfaces.IStorageService {
  async loadPrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["prompts"], (result) => {
        const prompts = result.prompts || [];
        console.log(`✅ Loaded ${prompts.length} prompts from local storage`);
        resolve(prompts);
      });
    });
  }
}

// Export for use in other modules
window.ContentServices = window.ContentServices || {};
window.ContentServices.ContentStorageService = ContentStorageService;
