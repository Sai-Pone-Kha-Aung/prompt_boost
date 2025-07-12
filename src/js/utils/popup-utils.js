// Single Responsibility: Handle prompt validation
class PromptValidator {
  static validatePromptInput(title, content) {
    if (!title || !content) {
      throw new Error("Please fill in both title and content fields.");
    }
  }

  static validateApiKey(apiKey) {
    if (!apiKey) {
      throw new Error("Please enter your Gemini API key.");
    }
  }

  static validateDuplicateTitle(prompts, title, excludeIndex = -1) {
    const isDuplicate = prompts.some(
      (p, index) =>
        index !== excludeIndex && p.title.toLowerCase() === title.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error("A prompt with this title already exists.");
    }
  }
}

// Single Responsibility: Handle button state management
class ButtonStateManager {
  static setLoadingState(button, loadingText) {
    const originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    return originalText;
  }

  static resetState(button, originalText) {
    button.textContent = originalText;
    button.disabled = false;
  }
}

// Export for use in other modules
window.PopupUtils = window.PopupUtils || {};
window.PopupUtils.PromptValidator = PromptValidator;
window.PopupUtils.ButtonStateManager = ButtonStateManager;
