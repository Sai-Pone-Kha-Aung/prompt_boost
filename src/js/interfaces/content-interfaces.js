// Interface definitions for Content Script following Interface Segregation Principle

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

// Export interfaces for use in other modules
window.ContentInterfaces = {
  IStorageService,
  IMessageService,
  ISidebarRenderer,
  IInputFieldFinder,
  IPlatformDetector,
};
