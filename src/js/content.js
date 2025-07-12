// Prompt Boost Content Script
class PromptBoost {
  constructor() {
    this.sidebar = null;
    this.prompts = [];
    this.isVisible = true;
    this.inputSelectors = [
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

    this.init();
  }

  init() {
    // Wait for page to load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log("🚀 Prompt Boost initializing on:", this.detectPlatform());
    this.loadPrompts();
    this.createSidebar();
    this.setupStorageListener();

    // Debug input field detection
    setTimeout(() => this.debugInputFields(), 2000);

    // Re-check for input fields periodically (for dynamic content)
    setInterval(() => this.updateInputFieldDetection(), 2000);
  }

  loadPrompts() {
    chrome.storage.sync.get(["prompts"], (result) => {
      this.prompts = result.prompts || [];
      this.updateSidebar();
    });
  }

  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" && changes.prompts) {
        this.prompts = changes.prompts.newValue || [];
        this.updateSidebar();
      }
    });
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
                    <span>→</span>
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

    // Initial update
    this.updateSidebar();
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
      toggleIcon.textContent = "→";
      sidebarContentHeader.style.display = "flex";
    } else {
      this.sidebar.classList.add("collapsed");
      sidebarContentHeader.style.display = "none";
      toggleBtn.style.justifyContent = "flex-start";
      toggleIcon.textContent = "←";
    }
  }

  updateSidebar() {
    if (!this.sidebar) return;

    const promptsList = this.sidebar.querySelector(".pb-prompts-list");
    const promptCount = this.sidebar.querySelector(".pb-prompt-count");

    promptCount.textContent = this.prompts.length;

    if (this.prompts.length === 0) {
      promptsList.innerHTML = `
                <div class="pb-empty-state">
                    <div class="pb-empty-icon">📝</div>
                    <p class="pb-empty-text">No prompts saved yet.<br>Use the extension popup to add prompts!</p>
                </div>
            `;
      return;
    }

    const promptsHTML = this.prompts
      .map(
        (prompt, index) => `
            <li class="pb-prompt-item" data-index="${index}">
                <div class="pb-prompt-title">${this.escapeHtml(
                  prompt.title
                )}</div>
                <div class="pb-prompt-preview">${this.escapeHtml(
                  prompt.content
                )}</div>
                <div class="pb-status-indicator"></div>
            </li>
        `
      )
      .join("");

    promptsList.innerHTML = promptsHTML;

    // Add click listeners
    this.sidebar.querySelectorAll(".pb-prompt-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        this.insertPrompt(this.prompts[index], e.currentTarget);
      });
    });
  }

  insertPrompt(prompt, itemElement) {
    const inputField = this.findInputField();

    if (!inputField) {
      this.showNotification(
        "No input field found. Please click in the chat input first.",
        "error"
      );
      return;
    }

    // Add visual feedback
    itemElement.classList.add("inserting");

    try {
      // Insert the prompt content
      this.setInputValue(inputField, prompt.content);

      // Show success feedback
      this.showNotification(`Inserted: ${prompt.title}`, "success");

      // Focus the input field
      inputField.focus();

      // Position cursor at the end
      if (inputField.setSelectionRange) {
        const length = inputField.value.length;
        inputField.setSelectionRange(length, length);
      }
    } catch (error) {
      console.error("Error inserting prompt:", error);
      this.showNotification(
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
    if (
      activeElement &&
      (activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "INPUT" ||
        activeElement.contentEditable === "true")
    ) {
      console.log("✅ Found active input field:", activeElement);
      return activeElement;
    }

    // Additional fallback: look for the largest visible textarea
    const allTextareas = Array.from(
      document.querySelectorAll("textarea")
    ).filter((el) => this.isElementVisible(el) && !el.disabled && !el.readOnly);

    if (allTextareas.length > 0) {
      // Sort by area (width * height) and take the largest
      const largestTextarea = allTextareas.sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return bRect.width * bRect.height - aRect.width * aRect.height;
      })[0];

      console.log("✅ Found largest textarea as fallback:", largestTextarea);
      return largestTextarea;
    }

    console.log("❌ No input field found");
    return null;
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

  updateInputFieldDetection() {
    // This method can be used to adapt to changes in the page structure
    // For now, it's a placeholder for future enhancements
  }

  // Detect which AI platform we're on
  detectPlatform() {
    const url = window.location.href;
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

  // Debug method to log current page and found input fields
  debugInputFields() {
    const platform = this.detectPlatform();
    console.log("🔍 Prompt Boost Debug Info:");
    console.log("Platform detected:", platform);
    console.log("Current URL:", window.location.href);
    console.log("Page title:", document.title);

    // Test each selector
    this.inputSelectors.forEach((selector, index) => {
      const elements = document.querySelectorAll(selector);
      console.log(
        `Selector ${index + 1} (${selector}):`,
        elements.length,
        "elements found"
      );

      elements.forEach((el, elIndex) => {
        const isVisible = this.isElementVisible(el);
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

    // Check active element
    console.log("Active element:", document.activeElement);

    // Look for any textarea or input on the page
    const allTextareas = document.querySelectorAll("textarea");
    const allInputs = document.querySelectorAll('input[type="text"]');
    const allContentEditable = document.querySelectorAll(
      '[contenteditable="true"]'
    );

    console.log("Total textareas on page:", allTextareas.length);
    console.log("Total text inputs on page:", allInputs.length);
    console.log(
      "Total contenteditable elements on page:",
      allContentEditable.length
    );
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

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when the script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new PromptBoost();
  });
} else {
  new PromptBoost();
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
        new PromptBoost();
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });
