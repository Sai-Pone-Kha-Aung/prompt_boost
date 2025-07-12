// Interface definitions for Popup module following Interface Segregation Principle

class IPromptService {
  async loadPrompts() {
    throw new Error("Method not implemented");
  }
  async savePrompts(prompts) {
    throw new Error("Method not implemented");
  }
  async saveApiKey(apiKey) {
    throw new Error("Method not implemented");
  }
  async loadApiKey() {
    throw new Error("Method not implemented");
  }
}

class IPromptBooster {
  async boostPrompt(title, content, apiKey) {
    throw new Error("Method not implemented");
  }
}

class IUIRenderer {
  renderPrompts(prompts) {
    throw new Error("Method not implemented");
  }
  showMessage(text, type) {
    throw new Error("Method not implemented");
  }
  clearForm() {
    throw new Error("Method not implemented");
  }
  showEditForm(index) {
    throw new Error("Method not implemented");
  }
  hideEditForm() {
    throw new Error("Method not implemented");
  }
}

// Export interfaces for use in other modules
window.PopupInterfaces = {
  IPromptService,
  IPromptBooster,
  IUIRenderer,
};
