class IStorageService {
  async loadPrompts() {
    throw new Error("Method not implemented");
  }
}

class IMessageService {
  setupMessageListener(callback) {
    throw new Error("Method not implemented");
  }
  setupStorageListener(callback) {
    throw new Error("Method not implemented");
  }
}

class ISidebarRenderer {
  createSidebar() {
    throw new Error("Method not implemented");
  }
  updateSidebar(prompts) {
    throw new Error("Method not implemented");
  }
  toggleSidebar() {
    throw new Error("Method not implemented");
  }
  showNotification(message, type) {
    throw new Error("Method not implemented");
  }
}

class IInputFieldFinder {
  findInputField() {
    throw new Error("Method not implemented");
  }
  setInputValue(element, value) {
    throw new Error("Method not implemented");
  }
}

class IPlatformDetector {
  detectPlatform() {
    throw new Error("Method not implemented");
  }
  getInputSelectors() {
    throw new Error("Method not implemented");
  }
}

// Single Responsibility Principle: Handle storage operations
class ContentStorageService extends IStorageService {
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

// Single Responsibility Principle: Handle messaging
class ContentMessageService extends IMessageService {
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

// Single Responsibility Principle: Platform detection and input selectors
class PlatformDetector extends IPlatformDetector {
  getInputSelectors() {
    return [
      // ChatGPT selectors
      'textarea[data-id="root"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      "#prompt-textarea",
      'textarea[data-testid="textbox"]',
      '[contenteditable="true"]',

      // Gemini selectors
      'div[contenteditable="true"]',
      '.ql-editor[contenteditable="true"]',

      // DeepSeek/Grok selectors
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Type"]',
      'textarea[placeholder*="Enter"]',
      'div[role="textbox"]',
      '[role="textbox"]',

      // Generic selectors (fallback)
      "textarea",
      'input[type="text"]',
      ".input-field",
      ".chat-input",
      ".message-input",
      "[data-role='textbox']",
      "[contenteditable='true']",
    ];
  }

  detectPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes("chat.openai.com")) {
      return "ChatGPT";
    } else if (hostname.includes("gemini.google.com")) {
      return "Gemini";
    } else if (hostname.includes("deepsider.ai")) {
      return "DeepSeek";
    } else if (hostname.includes("x.ai")) {
      return "Grok";
    } else {
      return "Unknown";
    }
  }
}

// Single Responsibility Principle: Find and manipulate input fields
class InputFieldFinder extends IInputFieldFinder {
  constructor(platformDetector) {
    super();
    this.platformDetector = platformDetector;
    this.inputSelectors = platformDetector.getInputSelectors();
  }

  findInputField() {
    console.log("🔍 Looking for input field...");

    // Try each selector until we find a visible input field
    for (const selector of this.inputSelectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of elements) {
        if (
          this.isElementVisible(element) &&
          !element.disabled &&
          !element.readOnly
        ) {
          console.log("✅ Found input field with selector:", selector, element);
          return element;
        }
      }
    }

    // Fallback: look for any focused input
    const activeElement = document.activeElement;
    if (activeElement && this.isValidInputElement(activeElement)) {
      console.log("✅ Found active input field:", activeElement);
      return activeElement;
    }

    // Additional fallback: look for the largest visible textarea
    const largestTextarea = this.findLargestTextarea();
    if (largestTextarea) {
      console.log("✅ Found largest textarea as fallback:", largestTextarea);
      return largestTextarea;
    }

    console.log("❌ No input field found");
    return null;
  }

  isValidInputElement(element) {
    return (
      element.tagName === "TEXTAREA" ||
      element.tagName === "INPUT" ||
      element.contentEditable === "true"
    );
  }

  findLargestTextarea() {
    const allTextareas = Array.from(
      document.querySelectorAll("textarea")
    ).filter((el) => this.isElementVisible(el) && !el.disabled && !el.readOnly);

    if (allTextareas.length === 0) return null;

    // Sort by area (width * height) and take the largest
    return allTextareas.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return bRect.width * bRect.height - aRect.width * aRect.height;
    })[0];
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  setInputValue(element, value) {
    if (element.contentEditable === "true") {
      // For contenteditable elements (like Gemini)
      element.textContent = value;
      // Trigger input events
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      // For textarea and input elements
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        element.constructor.prototype,
        "value"
      ).set;

      nativeInputValueSetter.call(element, value);

      // Trigger events that modern frameworks expect
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    }
  }
}

// Single Responsibility Principle: Handle sidebar UI rendering
class SidebarRenderer extends ISidebarRenderer {
  constructor() {
    super();
    this.sidebar = null;
    this.isVisible = true;
  }

  createSidebar() {
    // Remove existing sidebar if it exists
    const existingSidebar = document.getElementById("prompt-boost-sidebar");
    if (existingSidebar) {
      existingSidebar.remove();
    }

    // Create sidebar container
    this.sidebar = document.createElement("div");
    this.sidebar.id = "prompt-boost-sidebar";
    this.sidebar.innerHTML = `
      <div class="pb-sidebar-header">
        <div class="pb-sidebar-content-header">
          <h3 class="pb-sidebar-title">
            ⚡ Prompts
            <span class="pb-prompt-count">0</span>
          </h3>
        </div>
        <button class="pb-toggle-btn" title="Toggle Sidebar">
          <span style="text-align: center; padding-bottom: 2px; background: transparent; border: none; cursor: pointer;">
            →
          </span>
        </button>
      </div>
      <div class="pb-sidebar-content">
        <ul class="pb-prompts-list"></ul>
      </div>
    `;

    // Add toggle functionality
    const toggleBtn = this.sidebar.querySelector(".pb-toggle-btn");
    toggleBtn.addEventListener("click", () => this.toggleSidebar());

    // Add to page
    document.body.appendChild(this.sidebar);
  }

  updateSidebar(prompts) {
    if (!this.sidebar) {
      console.log("⚠️ Sidebar not found, cannot update");
      return;
    }

    console.log(`🔄 Updating sidebar with ${prompts.length} prompts`);

    const promptsList = this.sidebar.querySelector(".pb-prompts-list");
    const promptCount = this.sidebar.querySelector(".pb-prompt-count");

    promptCount.textContent = prompts.length;

    if (prompts.length === 0) {
      promptsList.innerHTML = `
        <div class="pb-empty-state">
          <div class="pb-empty-icon">📝</div>
          <p class="pb-empty-text">No prompts saved yet.<br>Use the extension popup to add prompts!</p>
        </div>
      `;
      return;
    }

    const promptsHTML = prompts
      .map(
        (prompt, index) => `
          <li class="pb-prompt-item" data-index="${index}">
            <div class="pb-prompt-title">${this.escapeHtml(prompt.title)}</div>
            <div class="pb-prompt-preview">${this.escapeHtml(
              prompt.content
            )}</div>
            <div class="pb-status-indicator"></div>
          </li>
        `
      )
      .join("");

    promptsList.innerHTML = promptsHTML;
  }

  toggleSidebar() {
    this.isVisible = !this.isVisible;
    const toggleIcon = this.sidebar.querySelector(".pb-toggle-btn span");
    const toggleBtn = this.sidebar.querySelector(".pb-toggle-btn");
    const sidebarContentHeader = this.sidebar.querySelector(
      ".pb-sidebar-content-header"
    );

    if (this.isVisible) {
      this.sidebar.classList.remove("collapsed");
      sidebarContentHeader.style.display = "flex";
      toggleIcon.textContent = "→";
    } else {
      this.sidebar.classList.add("collapsed");
      sidebarContentHeader.style.display = "none";
      toggleBtn.style.justifyContent = "flex-start";
      toggleIcon.textContent = "←";
    }
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 300px !important;
      background: ${type === "error" ? "#ff4757" : "#2ed573"} !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 6px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      z-index: 2147483648 !important;
      opacity: 0 !important;
      transform: translateY(-10px) !important;
      transition: all 0.3s ease !important;
      max-width: 300px !important;
      word-wrap: break-word !important;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-10px)";

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  addClickListeners(prompts, onPromptClick) {
    if (!this.sidebar) return;

    this.sidebar.querySelectorAll(".pb-prompt-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        onPromptClick(prompts[index], e.currentTarget);
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Single Responsibility Principle: Handle prompt insertion logic
class PromptInserter {
  constructor(inputFieldFinder, sidebarRenderer) {
    this.inputFieldFinder = inputFieldFinder;
    this.sidebarRenderer = sidebarRenderer;
  }

  insertPrompt(prompt, itemElement) {
    const inputField = this.inputFieldFinder.findInputField();

    if (!inputField) {
      this.sidebarRenderer.showNotification(
        "No input field found. Please click in the chat input first.",
        "error"
      );
      return;
    }

    // Add visual feedback
    itemElement.classList.add("inserting");

    try {
      // Insert the prompt content
      this.inputFieldFinder.setInputValue(inputField, prompt.content);

      // Show success feedback
      this.sidebarRenderer.showNotification(
        `Inserted: ${prompt.title}`,
        "success"
      );

      // Focus the input field
      inputField.focus();

      // Position cursor at the end
      if (inputField.setSelectionRange) {
        const length = inputField.value.length;
        inputField.setSelectionRange(length, length);
      }
    } catch (error) {
      console.error("Error inserting prompt:", error);
      this.sidebarRenderer.showNotification(
        "Failed to insert prompt. Please try again.",
        "error"
      );
    } finally {
      // Remove visual feedback
      setTimeout(() => {
        itemElement.classList.remove("inserting");
      }, 1000);
    }
  }
}

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
    this.promptInserter = new PromptInserter(inputFieldFinder, sidebarRenderer);
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

// Factory pattern for creating services
class ContentServiceFactory {
  static createStorageService() {
    return new ContentStorageService();
  }

  static createMessageService() {
    return new ContentMessageService();
  }

  static createSidebarRenderer() {
    return new SidebarRenderer();
  }

  static createPlatformDetector() {
    return new PlatformDetector();
  }

  static createInputFieldFinder(platformDetector) {
    return new InputFieldFinder(platformDetector);
  }

  static createPromptBoost() {
    const platformDetector = this.createPlatformDetector();
    const storageService = this.createStorageService();
    const messageService = this.createMessageService();
    const sidebarRenderer = this.createSidebarRenderer();
    const inputFieldFinder = this.createInputFieldFinder(platformDetector);

    return new PromptBoost(
      storageService,
      messageService,
      sidebarRenderer,
      inputFieldFinder,
      platformDetector
    );
  }
}

// Initialize when the script loads
function initializePromptBoost() {
  const promptBoost = ContentServiceFactory.createPromptBoost();
  promptBoost.init();
  return promptBoost;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePromptBoost);
} else {
  initializePromptBoost();
}

// Handle dynamic page changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      // Reinitialize if needed
      if (!document.getElementById("prompt-boost-sidebar")) {
        initializePromptBoost();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
