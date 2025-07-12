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
      sidebarToggleBtn: document.getElementById("sidebarToggle"),
    };
  }

  async initialize() {
    try {
      const apiKey = await this.promptManager.initialize();
      this.elements.geminiApiKey.value = apiKey;
      this.uiRenderer.renderPrompts(this.promptManager.getPrompts());
      this.setupEventListeners();
      await this.initializeSidebarButton();
    } catch (error) {
      console.error("Error initializing popup application:", error);
      // Show a basic error message to the user
      this.uiRenderer.showMessage(
        "Failed to initialize extension. Please refresh and try again.",
        "error"
      );
    }
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

    // Sidebar toggle functionality
    this.elements.sidebarToggleBtn.addEventListener("click", () =>
      this.handleSidebarToggle()
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

  async handleSidebarToggle() {
    try {
      // Check if chrome.tabs is available
      if (!chrome || !chrome.tabs) {
        this.uiRenderer.showMessage("Chrome tabs API not available", "error");
        return;
      }

      // Get the current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        this.uiRenderer.showMessage("No active tab found", "error");
        return;
      }

      // Check if the tab URL is supported
      const supportedUrls = [
        "https://chatgpt.com/*",
        "https://chat.deepseek.com/*",
        "https://grok.com/*",
        "https://gemini.google.com/*",
      ];

      const isSupported = supportedUrls.some((pattern) => {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(tab.url);
      });

      if (!isSupported) {
        this.uiRenderer.showMessage(
          "Sidebar is only available on supported AI platforms (ChatGPT, DeepSeek, Grok, Gemini)",
          "error"
        );
        return;
      }

      // Send message to content script to toggle sidebar
      await chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });

      // Update button text based on current state
      const currentText = this.elements.sidebarToggleBtn.textContent.trim();
      if (currentText === "Open Sidebar") {
        this.elements.sidebarToggleBtn.textContent = "Close Sidebar";
      } else {
        this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
      }

      this.uiRenderer.showMessage("Sidebar toggled successfully!", "success");
    } catch (error) {
      console.error("Error toggling sidebar:", error);
      this.uiRenderer.showMessage(
        "Could not toggle sidebar. Make sure you're on a supported AI platform page.",
        "error"
      );
    }
  }

  async initializeSidebarButton() {
    try {
      // Check if chrome.tabs is available
      if (!chrome || !chrome.tabs) {
        console.warn("Chrome tabs API not available");
        this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
        this.elements.sidebarToggleBtn.disabled = false;
        this.elements.sidebarToggleBtn.title = "Toggle the sidebar";
        return;
      }

      // Get the current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
        this.elements.sidebarToggleBtn.disabled = true;
        this.elements.sidebarToggleBtn.title = "No active tab found";
        return;
      }

      // Check if the tab URL is supported
      const supportedUrls = [
        "https://chatgpt.com/*",
        "https://chat.deepseek.com/*",
        "https://grok.com/*",
        "https://gemini.google.com/*",
      ];

      const isSupported = supportedUrls.some((pattern) => {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(tab.url);
      });

      if (!isSupported) {
        this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
        this.elements.sidebarToggleBtn.disabled = true;
        this.elements.sidebarToggleBtn.title =
          "Only available on supported AI platforms";
        return;
      }

      // Enable button for supported platforms
      this.elements.sidebarToggleBtn.disabled = false;
      this.elements.sidebarToggleBtn.title =
        "Toggle the sidebar on the current page";

      // Try to query the current sidebar state
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getSidebarState",
        });
        if (response && response.isVisible !== undefined) {
          if (response.isVisible) {
            this.elements.sidebarToggleBtn.textContent = "Close Sidebar";
            this.elements.sidebarToggleBtn.title = response.isCollapsed
              ? "Sidebar is currently collapsed - click to close completely"
              : "Sidebar is currently expanded - click to close completely";
          } else {
            this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
            this.elements.sidebarToggleBtn.title =
              "Click to open sidebar in collapsed mode";
          }
        } else {
          this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
        }
      } catch (error) {
        // Content script might not be loaded yet, default to "Open Sidebar"
        this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
      }
    } catch (error) {
      console.error("Error initializing sidebar button:", error);
      this.elements.sidebarToggleBtn.textContent = "Open Sidebar";
      this.elements.sidebarToggleBtn.disabled = false;
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
