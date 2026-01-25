/**************************************
 * Affichage de la page principale (choix des actions)
 **************************************/
function buildHomeCard(e) {
  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Email Actions Extractor')
    );

  var section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextButton()
      .setText('✨ Extraire les actions')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('showExtractedActions')
      )
  )

  section.addWidget(
  CardService.newTextButton()
    .setText('📋 Voir mes actions')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('showOpenActions')
    )
  )

  card.addSection(section);
  return card.build();
}

/******************************************************************

/**************************************
 * Affichage des actions extraites du thread
 **************************************/
// Merger les 2 fonctions ci-dessous
function renderExtractedActionsOLD(actions, threadId) {
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Actions détectées')
      .setSubtitle(actions.length + ' action(s)')
  );

  var section = CardService.newCardSection();

  if (!actions || !actions.length) {
    section.addWidget(
      CardService.newTextParagraph().setText('Aucune action détectée')
    );
  } else {

    actions.forEach(function (action) {
      card.addSection(buildActionCard(action));
    });
    
    section.addWidget(buildActionFooter());  
  }

  return card.build();
}


function renderExtractedActions(actions, threadId) {
  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Actions détectées')
    );

  actions.forEach(function (action) {
    card.addSection(buildActionListRow(action, actions, threadId));
  });

  card.addSection(buildActionFooter(actions, threadId));

  return card.build();
}


/**************************************
* Construction d’une action individuelle en lecture seule
 **************************************/
function buildActionListRow(action, actions, threadId) {
  var section = CardService.newCardSection();

  // Checkbox
  var isChecked = action._autoSelected === true || action.status === 'open'; // action déjà validée

  section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.CHECK_BOX)
      .setFieldName('select_' + action.fingerprint)
      .addItem(
        action.responsable + ' . ' + urgenceIcon(action.urgence),
        action.fingerprint,
        isChecked
      )
  );

  // Libellé et Tags
  var tagsValue = (action.tags || []).join(', ');
  var tagsValue = tagsValue ? '🏷️ ' + tagsValue : '🏷️ (aucun tag)';

  section.addWidget(
    CardService.newDecoratedText()
  .setText(action.action)
  .setBottomLabel(tagsValue)
  .setWrapText(true)
  );

  // Bouton modifier
  section.addWidget(
    CardService.newTextButton()
      .setText('Modifier')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('showEditAction')
          .setParameters({
            fingerprint: action.fingerprint,
            actions: JSON.stringify(actions),
            threadId: threadId
          })
      )
  );

  //section.addWidget(CardService.newDivider());
  return section;
}

/**************************************
 * Footer au bas de la liste des actions
 **************************************/
function buildActionFooter(actions) {
  var action = CardService.newAction()
    .setFunctionName('onValidateSelectedActions')
    .setParameters({
      actions: JSON.stringify(actions)
    }); 
    // Apps Script fournit TOUJOURS un event object (e)
    // setParameters() ajoute des champs dans e.parameters
    // ici, on passe donc l'event e + la liste complète des actions en paramètre

  var button = CardService.newTextButton()
    .setText('✅ Valider les actions sélectionnées')
    .setOnClickAction(action)
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED);

  return CardService.newCardSection()
    .addWidget(button);
}

/**************************************
 * Bouton pour lancer l’édition d’une action individuelle
 **************************************/
function showEditAction(e) {
  var actions = JSON.parse(e.parameters.actions);
  var action = actions.find(function (a) {
    return a.fingerprint === e.parameters.fingerprint;
  });

  return buildEditActionCard(action, actions, e.parameters.threadId);
  // CardService est stateless. Après modification d'une action, il faut réinjecter la liste complète des actions avant de revenir à l’écran précédent
}

/**************************************
 * Affichage de l’édition d’une action individuelle
 **************************************/
function buildEditActionCard(action, actions, threadId) {
  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('✏️ Modifier l’action')
    );

  var section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('responsable')
      .setTitle('👉 Responsable')
      .setValue(action.responsable || '')
  );

  section.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setFieldName('urgence')
      .setTitle('🔥 Urgence')
      .addItem('↗ haute', 'high', action.urgence === 'high')
      .addItem('➡ normale', 'normal', action.urgence === 'normal')
      .addItem('↘ basse', 'low', action.urgence === 'low')
  );

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('action')
      .setTitle('⚡ Action')
      .setValue(action.action)
  );  

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('tags')
      .setTitle('🏷️ Tags (séparés par des virgules)')
      .setValue((action.tags || []).join(', '))
  );

  card.addSection(section);

  card.addSection(buildEditFooter(action, actions, threadId));

  return card.build();
}

/**************************************
 * Footer pour l’édition d’une action individuelle
 **************************************/
function buildEditFooter(action, actions, threadId) {
  var save = CardService.newTextButton()
    .setText('✅ Enregistrer')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('saveEditedAction')
        .setParameters({
          fingerprint: action.fingerprint,
          actions: JSON.stringify(actions),
          threadId: threadId
        })
    );

  var cancel = CardService.newTextButton()
    .setText('↩ Annuler')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('backToList')
        .setParameters({
          actions: JSON.stringify(actions),
          threadId: threadId
        })
    );

  var section = CardService.newCardSection();
  section.addWidget(
    CardService.newButtonSet()
    .addButton(save)
    .addButton(cancel));
  
  return section;
}

/**************************************
 * Retour à la liste des actions sans persister
 **************************************/
function backToList(e) {
  var actions = JSON.parse(e.parameters.actions);
  return renderExtractedActions(actions, e.parameters.threadId);
}

/**************************************
 * Carte de confirmation après validation des actions
 **************************************/
function buildConfirmationCard(count) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Actions enregistrées')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText(count + ' action(s) enregistrée(s).')
        )
    )
    .build();
}

/**********************************************************************

/***************A SUPPRIMER ou MODIFIER avec action.id***********************
 * Affichage et traitement des actions enregistrées et open
 **************************************/
function buildOpenActionsCardOLD(actions) {

  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Actions ouvertes')
    );

  var section = CardService.newCardSection();

  if (actions.length === 0) {
    section.addWidget(
      CardService.newTextParagraph()
        .setText('🎉 Aucune action ouverte.')
    );
  }

  for (var i = 0; i < actions.length; i++) {
    var action = actions[i];

    section.addWidget(
      CardService.newTextParagraph()
        .setText(
          '<b>' + action.responsable + '</b> - ' +
          action.titre + '<br/>' +
          (action.description || '')
        )
    );

    section.addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('📧 Voir l’email')
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl('https://mail.google.com/mail/u/0/#inbox/' + action.threadId)
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('✅ Fait')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('markActionDone')
                .setParameters({ index: String(i) }) // Les paramètres venant de l’UI (e.parameters) sont toujours des chaînes (string) et sont sérialisés (clé / valeur)
            )
        )
    );
  }

  card.addSection(section);
  return card.build();
}

/**************************************
 * Affichage des actions ouvertes groupées par thread
 **************************************/
function renderOpenActions() {
  var actions = getAllActions().filter(a => a.status === 'open');
  var grouped = groupActionsByThread(actions);

  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Mes actions'));

  Object.keys(grouped).forEach(function (threadId) {
    var subject = getThreadSubject(threadId);

    var section = CardService.newCardSection()
      .setHeader('▶ ' + subject);

    grouped[threadId].forEach(function (action) {
      section.addWidget(buildOpenActionWidget(action));
    });

    card.addSection(section);
  });

  return card.build();
}

/**************************************
 * Construction d’un widget compact d’action ouverte
 **************************************/
function buildOpenActionWidget(action) {
  return CardService.newDecoratedText()
    .setText(action.action)
    .setBottomLabel(
      action.responsable + ' · ' + action.urgence
    )
    .setWrapText(true);
}

// ************************************************************************

/**************************************
 * Utilitaires
 **************************************/
/* Cleaning HTML simple */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* Remplacement du texte Urgence par une icône */
function urgenceIcon(level) {
  if (level === 'high') return '🔴';
  if (level === 'low') return '🟢';
  return '🟠';
}

/* Construction d’un champ de saisie texte */
function buildTextInput(name, value, label, hint) {
  var input = CardService.newTextInput()
    .setFieldName(name)
    .setTitle(label || '')
    .setValue(value || '');

  if (hint) {
    input.setHint(hint);
  }

  return input;
}
