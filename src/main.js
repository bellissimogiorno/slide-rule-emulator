import { createApplication } from "#ui/application.js";
export const application = createApplication(document);
document.documentElement.dataset.appReady = "true";
