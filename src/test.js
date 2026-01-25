/**************************************
 * Log des User Properties
 * **************************************/
function showUserProperties() {
  var props = PropertiesService.getUserProperties().getProperties();
  Logger.log(JSON.stringify(props, null, 2));
}

/**************************************
 * Réinitialisation de toutes les User Properties
 **************************************/
function resetUserProperties() {
  PropertiesService.getUserProperties().deleteAllProperties();
}

/**************************************
 * Réinitialisation des actions uniquement
 **************************************/
function resetActionsOnly() {
  PropertiesService.getUserProperties().deleteProperty('ACTIONS_V1');
}

/**************************************
 * Réinitialisation des tags uniquement
 **************************************/
function resetTagsOnly() {
  PropertiesService.getUserProperties().deleteProperty('tags');
}

