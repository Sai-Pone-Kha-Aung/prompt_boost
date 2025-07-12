// Main application controller - Dependency Inversion Principle
class PopupApplication {
  constructor() {
    this.elements = this.getElements();
    this.storageService =
      window.PopupFactories.ServiceFactory.createStorageService();
    this.boosterService =
      window.PopupFactories.ServiceFactory.createBoosterService();
    this.uiRenderer = window.PopupFactories.ServiceFactory.createUIRenderer(
      this.elements
    );
    this.promptManager =
      window.PopupFactories.ServiceFactory.createPromptManager(
        this.storageService,
        this.boosterService,
        this.uiRenderer
      );
  }

  getElements() {
    return {
      promptTitle: document.getElementById("promptTitle"),
      promptContent: document.getElementById("promptContent"),
      geminiApiKey: document.getElementById("geminiApiKey"),
      boostPromptBtn: document.getElementById("boostPrompt"),
      boostResult: document.getElementById("boostResult"),
      boostedTitle: document.getElementById("boostedTitle"),
      boostedContent: document.getElementById("boostedContent"),
      saveBoostPromptBtn: document.getElementById("saveBoostPrompt"),
      tryAgainBtn: document.getElementById("tryAgain"),
      promptsList: document.getElementById("promptsList"),
      emptyState: document.getElementById("emptyState"),
      promptCount: document.getElementById("promptCount"),
      messageDiv: document.getElementById("message"),
      editForm: document.getElementById("editForm"),
      editTitle: document.getElementById("editTitle"),
      editContent: document.getElementById("editContent"),
      saveEditBtn: document.getElementById("saveEdit"),
      cancelEditBtn: document.getElementById("cancelEdit"),
    };
  }

  async initialize() {
    const apiKey = await this.promptManager.initialize();
    this.elements.geminiApiKey.value = apiKey;
    this.uiRenderer.renderPrompts(this.promptManager.getPrompts());
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Boost prompt functionality
    this.elements.boostPromptBtn.addEventListener("click", () =>
      this.handleBoostPrompt()
    );

    // Save boosted prompt
    this.elements.saveBoostPromptBtn.addEventListener("click", () =>
      this.handleSaveBoostedPrompt()
    );

    // Try again button
    this.elements.tryAgainBtn.addEventListener("click", () =>
      this.promptManager.tryAgain()
    );

    // Edit form functionality
    this.elements.saveEditBtn.addEventListener("click", () =>
      this.handleSaveEdit()
    );
    this.elements.cancelEditBtn.addEventListener("click", () =>
      this.uiRenderer.hideEditForm()
    );

    // Prompt actions event delegation
    this.elements.promptsList.addEventListener("click", (event) =>
      this.handlePromptAction(event)
    );

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Auto-resize textareas
    this.setupAutoResize();
  }

  async handleBoostPrompt() {
    const title = this.elements.promptTitle.value.trim();
    const content = this.elements.promptContent.value.trim();
    const apiKey = this.elements.geminiApiKey.value.trim();

    const originalText = window.PopupUtils.ButtonStateManager.setLoadingState(
      this.elements.boostPromptBtn,
      "🔄 Boosting..."
    );

    try {
      this.uiRenderer.showMessage("Boosting your prompt with AI...", "info");
      await this.promptManager.boostPrompt(title, content, apiKey);
    } catch (error) {
      // Error is already handled in promptManager
    } finally {
      window.PopupUtils.ButtonStateManager.resetState(
        this.elements.boostPromptBtn,
        originalText
      );
    }
  }

  async handleSaveBoostedPrompt() {
    try {
      const originalTitle = this.elements.promptTitle.value.trim();
      const originalContent = this.elements.promptContent.value.trim();
      await this.promptManager.saveBoostedPrompt(
        originalTitle,
        originalContent
      );
    } catch (error) {
      this.uiRenderer.showMessage(error.message, "error");
    }
  }

  async handleSaveEdit() {
    const title = this.elements.editTitle.value.trim();
    const content = this.elements.editContent.value.trim();

    try {
      await this.promptManager.updatePrompt(
        this.promptManager.editingIndex,
        title,
        content
      );
    } catch (error) {
      this.uiRenderer.showMessage(error.message, "error");
    }
  }

  async handlePromptAction(event) {
    const target = event.target;
    if (!target.dataset.action) return;

    const action = target.dataset.action;
    const index = parseInt(target.dataset.index);

    if (action === "delete") {
      if (confirm("Are you sure you want to delete this prompt?")) {
        await this.promptManager.deletePrompt(index);
      }
    } else if (action === "edit") {
      const prompt = this.promptManager.startEdit(index);
      this.elements.editTitle.value = prompt.title;
      this.elements.editContent.value = prompt.content;
      this.uiRenderer.showEditForm(index);
    } else if (action === "regenerate") {
      const apiKey = this.elements.geminiApiKey.value.trim();
      const originalText = window.PopupUtils.ButtonStateManager.setLoadingState(
        target,
        "🔄 Improving..."
      );

      try {
        this.uiRenderer.showMessage("Improving your prompt...", "info");
        await this.promptManager.regeneratePrompt(index, apiKey);
      } catch (error) {
        this.uiRenderer.showMessage(error.message, "error");
      } finally {
        window.PopupUtils.ButtonStateManager.resetState(target, originalText);
      }
    }
  }

  setupKeyboardShortcuts() {
    this.elements.promptTitle.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.elements.promptContent.focus();
      }
    });

    this.elements.promptContent.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        this.elements.boostPromptBtn.click();
      }
    });

    this.elements.editTitle.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.elements.editContent.focus();
      }
    });

    this.elements.editContent.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        this.elements.saveEditBtn.click();
      }
    });
  }

  setupAutoResize() {
    [this.elements.promptContent, this.elements.editContent].forEach(
      (textarea) => {
        textarea.addEventListener("input", function () {
          this.style.height = "auto";
          this.style.height = Math.min(this.scrollHeight, 150) + "px";
        });
      }
    );
  }
}

// Export for use in other modules
window.PopupApp = window.PopupApp || {};
window.PopupApp.PopupApplication = PopupApplication;
