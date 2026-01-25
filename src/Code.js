/**************************************
 * MENU GMAIL (handler)
 **************************************/
function onGmailMessage(e) {
  return buildHomeCard(e);
}

function onGmailThread(e) {
  return buildHomeCard(e);
}

/**************************************
 * Report des modifications d’une action individuelle
 **************************************/
function saveEditedAction(e) {
  var actions = JSON.parse(e.parameters.actions);
  var fingerprint = e.parameters.fingerprint;

  var action = actions.find(function (a) {
    return a.fingerprint === fingerprint;
  });

  if (!action) {
    throw new Error('Action introuvable');
  }

  // Mise à jour depuis le formulaire
  action.threadId = e.parameters.threadId;
  action.action = e.formInput.action || action.action;
  action.responsable = e.formInput.responsable || action.responsable;
  action.urgence = e.formInput.urgence || action.urgence;
  action.tags = e.formInput.tags
    ? e.formInput.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  action._autoSelected = true; // Checkbox cochée par défaut, prêt pour validation

  // Retour à l’écran 1 (sans persister)
  return renderExtractedActions(actions, e.parameters.threadId);
}

/**************************************
 * ACTION PRINCIPALE
 * Affichage des actions extraites pour validation
 **************************************/
function showExtractedActions(e) {
  var threadId = e.gmail.threadId;

  var cleanThread = buildCleanThread(threadId); // corps nettoyé de l’email
  var llmResult = extractActionsWithLLM(cleanThread); // appel LLM pour extraction

  var extracted = postProcessExtractedActions(llmResult, threadId); // post-traitement
  var existing = getActionsByThread(threadId); // actions existantes pour ce thread

  var actions = mergeExtractedWithExisting(extracted, existing); // fusion
  return renderExtractedActions(actions, threadId);
}

/**************************************
 * Affichage des actions enregistrées et open
 **************************************/
function showOpenActions() {
  //var actions = getOpenActions();
  return renderOpenActions();
}


/**************************************
 * Validation des actions sélectionnées (après clic sur "Valider les actions")
 **************************************/
function onValidateSelectedActions(e) {
  //var threadId = e.parameters.threadId;
  Logger.log('FORM INPUT RAW = ' + JSON.stringify(e.formInput, null, 2)); // e.formInput contient les valeurs des champs du formulaire
  Logger.log('PARAMETERS = ' + JSON.stringify(e.parameters, null, 2));    // e.parameters contient les paramètres passés lors de la création de la carte (ici, la liste des actions au format JSON)

  // 1. récupérer toutes les actions affichées
  var allScreenActions = JSON.parse(e.parameters.actions);

  // 2. récupérer les fingerprints cochés
  var selected = Object.keys(e.formInput)
  .filter(k => k.startsWith('select_'))
  .map(k => e.formInput[k]);

  // 3. récupérer les actions validées
  var validatedActions = allScreenActions.filter(a => selected.includes(a.fingerprint));

  // 4. persister
  persistValidatedActions(validatedActions);

  // 5. retour UI
  return buildConfirmationCard(validatedActions.length);
}



