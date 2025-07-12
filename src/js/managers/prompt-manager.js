// Open/Closed Principle: Open for extension, closed for modification
// Dependency Inversion: High-level modules depend on abstractions
class PromptManager {
  constructor(storageService, boosterService, uiRenderer) {
    this.storageService = storageService;
    this.boosterService = boosterService;
    this.uiRenderer = uiRenderer;
    this.prompts = [];
    this.currentBoostedPrompt = null;
    this.editingIndex = -1;
  }

  async initialize() {
    this.prompts = await this.storageService.loadPrompts();
    const apiKey = await this.storageService.loadApiKey();
    return apiKey;
  }

  async boostPrompt(title, content, apiKey) {
    try {
      window.PopupUtils.PromptValidator.validatePromptInput(title, content);
      window.PopupUtils.PromptValidator.validateApiKey(apiKey);

      await this.storageService.saveApiKey(apiKey);

      this.currentBoostedPrompt = await this.boosterService.boostPrompt(
        title,
        content,
        apiKey
      );
      this.uiRenderer.showBoostResult(this.currentBoostedPrompt);
      this.uiRenderer.showMessage("Prompt boosted successfully! ✨", "success");
    } catch (error) {
      console.error("Error boosting prompt:", error);
      this.uiRenderer.showMessage(error.message, "error");
      throw error;
    }
  }

  async saveBoostedPrompt(originalTitle, originalContent) {
    if (!this.currentBoostedPrompt) {
      throw new Error("No boosted prompt to save.");
    }

    window.PopupUtils.PromptValidator.validateDuplicateTitle(
      this.prompts,
      this.currentBoostedPrompt.title
    );

    const newPrompt = {
      id: Date.now().toString(),
      title: this.currentBoostedPrompt.title,
      content: this.currentBoostedPrompt.content,
      createdAt: new Date().toISOString(),
      improved: true,
      originalTitle: originalTitle,
      originalContent: originalContent,
    };

    this.prompts.push(newPrompt);
    await this.storageService.savePrompts(this.prompts);

    this.uiRenderer.clearForm();
    this.uiRenderer.hideBoostResult();
    this.uiRenderer.renderPrompts(this.prompts);
    this.uiRenderer.showMessage(
      "Boosted prompt saved successfully! ✨",
      "success"
    );

    this.currentBoostedPrompt = null;
  }

  async deletePrompt(index) {
    this.prompts.splice(index, 1);
    await this.storageService.savePrompts(this.prompts);
    this.uiRenderer.renderPrompts(this.prompts);
    this.uiRenderer.showMessage("Prompt deleted successfully.", "success");
  }

  async updatePrompt(index, title, content) {
    window.PopupUtils.PromptValidator.validatePromptInput(title, content);
    window.PopupUtils.PromptValidator.validateDuplicateTitle(
      this.prompts,
      title,
      index
    );

    this.prompts[index].title = title;
    this.prompts[index].content = content;
    this.prompts[index].updatedAt = new Date().toISOString();

    await this.storageService.savePrompts(this.prompts);
    this.uiRenderer.hideEditForm();
    this.uiRenderer.showMessage("Prompt updated successfully!", "success");
    this.uiRenderer.renderPrompts(this.prompts);
    this.editingIndex = -1;
  }

  async regeneratePrompt(index, apiKey) {
    window.PopupUtils.PromptValidator.validateApiKey(apiKey);

    const prompt = this.prompts[index];
    const improvedPrompt = await this.boosterService.boostPrompt(
      prompt.title,
      prompt.content,
      apiKey
    );

    this.prompts[index].content = improvedPrompt.content;
    this.prompts[index].title = improvedPrompt.title || prompt.title;
    this.prompts[index].updatedAt = new Date().toISOString();
    this.prompts[index].improved = true;

    await this.storageService.savePrompts(this.prompts);
    this.uiRenderer.renderPrompts(this.prompts);
    this.uiRenderer.showMessage("Prompt improved successfully! ✨", "success");
  }

  startEdit(index) {
    this.editingIndex = index;
    const prompt = this.prompts[index];
    return prompt;
  }

  getPrompts() {
    return this.prompts;
  }

  tryAgain() {
    this.uiRenderer.hideBoostResult();
    this.currentBoostedPrompt = null;
    this.uiRenderer.showMessage("Ready to boost your prompt again!", "info");
  }
}

// Export for use in other modules
window.PopupManagers = window.PopupManagers || {};
window.PopupManagers.PromptManager = PromptManager;
