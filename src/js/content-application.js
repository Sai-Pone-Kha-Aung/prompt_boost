// Open/Closed Principle: Main application class that can be extended
// Dependency Inversion: Depends on abstractions, not concrete implementations
class PromptBoost {
  constructor(
    storageService,
    messageService,
    sidebarRenderer,
    inputFieldFinder,
    platformDetector
  ) {
    this.storageService = storageService;
    this.messageService = messageService;
    this.sidebarRenderer = sidebarRenderer;
    this.inputFieldFinder = inputFieldFinder;
    this.platformDetector = platformDetector;
    this.promptInserter = new window.ContentUtils.PromptInserter(
      inputFieldFinder,
      sidebarRenderer
    );
    this.prompts = [];
  }

  async init() {
    // Wait for page to load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  async setup() {
    console.log(
      "🚀 Prompt Boost initializing on:",
      this.platformDetector.detectPlatform()
    );

    // Set up listeners
    this.setupListeners();

    // Load prompts and create UI
    await this.loadPrompts();
    this.sidebarRenderer.createSidebar();
    this.updateUI();
  }

  setupListeners() {
    // Set up message listener
    this.messageService.setupMessageListener((action) => {
      if (action === "syncPrompts") {
        this.loadPrompts();
      } else if (action === "toggleSidebar") {
        this.toggleSidebar();
      } else if (action === "getSidebarState") {
        return this.getSidebarState();
      }
    });

    // Set up storage listener
    this.messageService.setupStorageListener((action, prompts, changes) => {
      if (action === "storageChanged") {
        this.prompts = prompts;
        this.updateUI();
        this.showStorageChangeNotification(changes);
      }
    });
  }

  async loadPrompts() {
    console.log("📖 Loading prompts from local storage...");
    this.prompts = await this.storageService.loadPrompts();
    this.updateUI();
  }

  updateUI() {
    this.sidebarRenderer.updateSidebar(this.prompts);
    this.sidebarRenderer.addClickListeners(
      this.prompts,
      (prompt, itemElement) => {
        this.promptInserter.insertPrompt(prompt, itemElement);
      }
    );
  }

  showStorageChangeNotification(changes) {
    if (changes.prompts.newValue && changes.prompts.oldValue) {
      const oldCount = changes.prompts.oldValue
        ? changes.prompts.oldValue.length
        : 0;
      const newCount = changes.prompts.newValue.length;

      if (newCount > oldCount) {
        this.sidebarRenderer.showNotification(
          "✨ New prompt added!",
          "success"
        );
      } else if (newCount < oldCount) {
        this.sidebarRenderer.showNotification("🗑️ Prompt deleted", "info");
      } else {
        this.sidebarRenderer.showNotification("📝 Prompt updated", "info");
      }
    }
  }

  toggleSidebar() {
    console.log("🔄 Toggling sidebar visibility from popup...");
    if (this.sidebarRenderer && this.sidebarRenderer.sidebar) {
      this.sidebarRenderer.toggleSidebarFromPopup();
      const isVisible = this.sidebarRenderer.isVisible;
      const isCollapsed = this.sidebarRenderer.isCollapsed;

      let message = isVisible
        ? isCollapsed
          ? "Sidebar opened (collapsed)"
          : "Sidebar opened (expanded)"
        : "Sidebar closed";

      this.sidebarRenderer.showNotification(message, "info");
    } else {
      console.log("⚠️ Sidebar not found, creating it...");
      this.sidebarRenderer.createSidebar();
      this.updateUI();
      // When creating for the first time, start in collapsed state
      this.sidebarRenderer.isCollapsed = true;
      this.sidebarRenderer.sidebar.classList.add("collapsed");

      const sidebarContentHeader = this.sidebarRenderer.sidebar.querySelector(
        ".pb-sidebar-content-header"
      );
      const toggleBtn =
        this.sidebarRenderer.sidebar.querySelector(".pb-toggle-btn");
      const toggleIcon = this.sidebarRenderer.sidebar.querySelector(
        ".pb-toggle-btn span"
      );

      sidebarContentHeader.style.display = "none";
      toggleBtn.style.justifyContent = "flex-start";
      toggleIcon.textContent = "←";

      this.sidebarRenderer.showNotification(
        "Sidebar opened (collapsed)",
        "success"
      );
    }
  }

  getSidebarState() {
    if (this.sidebarRenderer && this.sidebarRenderer.sidebar) {
      return this.sidebarRenderer.getSidebarState();
    }
    return {
      isVisible: false,
      isCollapsed: false,
      exists: false,
    };
  }

  // Debug methods
  debugInputFields() {
    const platform = this.platformDetector.detectPlatform();
    console.log("🔍 Prompt Boost Debug Info:");
    console.log("Platform detected:", platform);
    console.log("Current URL:", window.location.href);
    console.log("Page title:", document.title);

    const inputSelectors = this.platformDetector.getInputSelectors();
    inputSelectors.forEach((selector, index) => {
      const elements = document.querySelectorAll(selector);
      console.log(
        `Selector ${index + 1} (${selector}):`,
        elements.length,
        "elements found"
      );

      elements.forEach((el, elIndex) => {
        const isVisible = this.inputFieldFinder.isElementVisible(el);
        const isDisabled = el.disabled;
        const isReadOnly = el.readOnly;
        console.log(`  Element ${elIndex + 1}:`, {
          tag: el.tagName,
          type: el.type,
          placeholder: el.placeholder,
          contentEditable: el.contentEditable,
          visible: isVisible,
          disabled: isDisabled,
          readOnly: isReadOnly,
          classes: Array.from(el.classList),
          id: el.id,
        });
      });
    });

    console.log("Active element:", document.activeElement);
    console.log(
      "Total textareas on page:",
      document.querySelectorAll("textarea").length
    );
    console.log(
      "Total text inputs on page:",
      document.querySelectorAll('input[type="text"]').length
    );
    console.log(
      "Total contenteditable elements on page:",
      document.querySelectorAll('[contenteditable="true"]').length
    );
  }

  checkForUpdates() {
    this.loadPrompts();
  }
}

// Export for use in other modules
window.ContentApp = window.ContentApp || {};
window.ContentApp.PromptBoost = PromptBoost;
