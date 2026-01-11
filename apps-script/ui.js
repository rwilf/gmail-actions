/**************************************
 * Affichage des la page principale (choix des actions)
 **************************************/

function buildHomeCard(e) {
  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Email Actions Extractor')
    );

  var section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextButton()
      .setText('Extraire les actions')
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
          .setFunctionName('buildOpenActionsCard')
      )
  )

  card.addSection(section);
  return card.build();
}


/**************************************
 * Affichage des actions détectées
 **************************************/

function buildActionsValidationCard(actions, threadId) {
  var card = CardService.newCardBuilder();
  card.setHeader(
    CardService.newCardHeader().setTitle('Actions détectées')
  );

  var section = CardService.newCardSection();

  if (!actions || !actions.length) {
    section.addWidget(
      CardService.newTextParagraph().setText('Aucune action détectée 🎉')
    );
  } else {

    for (var i = 0; i < actions.length; i++) {
      var action = actions[i];

      var checkbox = CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.CHECK_BOX)
        .setTitle(action.source)
        .setFieldName('action_' + i)
        .addItem(action.action || '', 'selected', true);

      section.addWidget(checkbox);
    }

    card.addSection(section);

    var button = CardService.newTextButton()
      .setText('Valider les actions')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onValidateActions')
          .setParameters({
            threadId: threadId,
            actions: JSON.stringify(actions)
          })
      );

    card.addSection(
      CardService.newCardSection().addWidget(button)
    );
  
  }

  return card.build();
}


/**************************************
 * Affichage et traitement des actions ouvertes
 **************************************/

function buildOpenActionsCard() {
  var actions = getOpenActions();

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
 * Confirmation du nbre d'actions entegistrées
 **************************************/
// A déplacer : actuellement dans storage.js, fonction onValidateActions


/**************************************
 * Utilitaire HTML
 **************************************/

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}