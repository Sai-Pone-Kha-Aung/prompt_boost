// Single Responsibility: Handle prompt boosting logic
class PromptBoosterService extends window.PopupInterfaces.IPromptBooster {
  async boostPrompt(title, content, apiKey) {
    const response = await chrome.runtime.sendMessage({
      action: "improvePrompt",
      promptText: content,
      title: title,
      apiKey: apiKey,
    });

    if (!response || !response.success) {
      throw new Error(response?.error || "Failed to boost prompt");
    }

    return {
      title: response.improvedTitle,
      content: response.improvedText,
    };
  }
}

// Export for use in other modules
window.PopupServices = window.PopupServices || {};
window.PopupServices.PromptBoosterService = PromptBoosterService;
