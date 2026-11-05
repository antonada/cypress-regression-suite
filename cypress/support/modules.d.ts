// The reporter's plugin entry ships without types
declare module 'cypress-mochawesome-reporter/plugin' {
  const plugin: (on: Cypress.PluginEvents) => void;
  export default plugin;
}
