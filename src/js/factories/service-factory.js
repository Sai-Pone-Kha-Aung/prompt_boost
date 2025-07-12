// Factory pattern for creating services
class ServiceFactory {
  static createStorageService() {
    return new window.PopupServices.ChromeStorageService();
  }

  static createBoosterService() {
    return new window.PopupServices.PromptBoosterService();
  }

  static createUIRenderer(elements) {
    return new window.PopupServices.UIRenderer(elements);
  }

  static createPromptManager(storageService, boosterService, uiRenderer) {
    return new window.PopupManagers.PromptManager(
      storageService,
      boosterService,
      uiRenderer
    );
  }
}

// Export for use in other modules
window.PopupFactories = window.PopupFactories || {};
window.PopupFactories.ServiceFactory = ServiceFactory;
