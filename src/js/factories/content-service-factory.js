// Factory pattern for creating content services
class ContentServiceFactory {
  static createStorageService() {
    return new window.ContentServices.ContentStorageService();
  }

  static createMessageService() {
    return new window.ContentServices.ContentMessageService();
  }

  static createSidebarRenderer() {
    return new window.ContentServices.SidebarRenderer();
  }

  static createPlatformDetector() {
    return new window.ContentUtils.PlatformDetector();
  }

  static createInputFieldFinder(platformDetector) {
    return new window.ContentUtils.InputFieldFinder(platformDetector);
  }

  static createPromptBoost() {
    const platformDetector = this.createPlatformDetector();
    const storageService = this.createStorageService();
    const messageService = this.createMessageService();
    const sidebarRenderer = this.createSidebarRenderer();
    const inputFieldFinder = this.createInputFieldFinder(platformDetector);

    return new window.ContentApp.PromptBoost(
      storageService,
      messageService,
      sidebarRenderer,
      inputFieldFinder,
      platformDetector
    );
  }
}

// Export for use in other modules
window.ContentFactories = window.ContentFactories || {};
window.ContentFactories.ContentServiceFactory = ContentServiceFactory;
