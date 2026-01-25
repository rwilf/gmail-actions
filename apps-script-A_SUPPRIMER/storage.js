/**************************************
 * Sauvegarde des actions
 **************************************/

function onValidateActions(e) {
  var validatedActions = [];
  var actions = JSON.parse(e.parameters.actions);

  for (var i = 0; i < actions.length; i++) {
    var field = e.formInput['action_' + i];
    if (field && field.indexOf('selected') !== -1) {
      validatedActions.push(actions[i]);
    }
  }

  saveActions(validatedActions, e.parameters.threadId);

  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Actions enregistrées')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText(validatedActions.length + ' action(s) enregistrée(s).')
        )
    )
    .build();
}

function saveActions(actions, threadId) {
  var props = PropertiesService.getUserProperties();
  var existing = props.getProperty('actions') || '[]'; // Je récupère tout ce qui existe déjà
  var all = JSON.parse(existing); // Je le mets en mémoire (tableau JS)
  
  for (var i = 0; i < actions.length; i++) {
    all.push({
      threadId: threadId,
      titre: actions[i].titre,
      responsable: actions[i].responsable,
      description: actions[i].action,
      status: 'open',
      createdAt: new Date().toISOString()
    });
  }  // J’ajoute mes nouvelles actions

  props.setProperty('actions', JSON.stringify(all)); // Je réécris la totalité dans le store
}

/**************************************
 * Récupération des actions enregistrées
 **************************************/

function getOpenActions() {
  var props = PropertiesService.getUserProperties();
  var raw = props.getProperty('actions');
  if (!raw) return [];

  var actions = JSON.parse(raw);
  var openActions = [];

  for (var i = 0; i < actions.length; i++) {
    if (actions[i].status === 'open') {
      openActions.push(actions[i]);
    }
  }
  return openActions;
}


/**************************************
 * Marquage des actions open -> done
 **************************************/

function markActionDone(e) {
  var index = parseInt(e.parameters.index, 10); // index de l'action de la liste filtrée (open only) de l'UI, converti proprement en entier décimal

  var props = PropertiesService.getUserProperties();
  var raw = props.getProperty('actions'); // liste complète des actions stockées (open + done)
  if (!raw) return;

  var actions = JSON.parse(raw);

  var openIndex = -1; // On doit rebalayer toutes les actions pour trouver la bonne car l’index affiché dans l’UI ≠ l’index réel dans le stockage.
  for (var i = 0; i < actions.length; i++) {
    if (actions[i].status === 'open') {
      openIndex++;
      if (openIndex === index) {
        actions[i].status = 'done';
        break;
      }
    }
  }

  props.setProperty('actions', JSON.stringify(actions));

  return buildOpenActionsCard();
}

