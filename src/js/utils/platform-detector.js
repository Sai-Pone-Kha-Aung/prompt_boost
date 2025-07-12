// Single Responsibility Principle: Platform detection and input selectors
class PlatformDetector extends window.ContentInterfaces.IPlatformDetector {
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

// Export for use in other modules
window.ContentUtils = window.ContentUtils || {};
window.ContentUtils.PlatformDetector = PlatformDetector;
