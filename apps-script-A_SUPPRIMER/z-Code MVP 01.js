/**************************************
 * MENU GMAIL
 **************************************/

function onGmailMessage(e) {
  return buildAddon(e);
}

function onGmailThread(e) {
  return buildAddon(e);
}

function buildAddon(e) {
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
 * ACTION PRINCIPALE test
 **************************************/

function showCleanThread(e) {
  var threadId = e.gmail.threadId;
  var cleanThread = buildCleanThread(threadId);

  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Thread nettoyé')
        .setSubtitle('Prêt pour extraction d’actions')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<pre>' + escapeHtml(cleanThread) + '</pre>')
        )
    )
    .build();

  return card;
}

/**************************************
 * ACTION PRINCIPALE
 **************************************/

function showExtractedActions(e) {
  var threadId = e.gmail.threadId;

  var cleanThread = buildCleanThread(threadId);
  var actions = extractActionsWithLLM(cleanThread);

  // MVP n°1 
  // return buildActionsCard(actions);

  // MVP n°2
  return buildActionsValidationCard(actions, threadId);
}

/**************************************
 * CONSTRUCTION DU THREAD
 **************************************/

function buildCleanThread(threadId) {
  var thread = GmailApp.getThreadById(threadId);
  var messages = thread.getMessages();

  var output = [];
  var index = 1;

  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    var cleanedBody = cleanEmailBody(msg.getPlainBody());

    if (!cleanedBody) {
      continue;
    }

    var block = '';
    block += 'Message ' + index + '\n';
    block += 'From: ' + msg.getFrom() + '\n';
    block += 'Date: ' + msg.getDate().toISOString() + '\n';

    if (index === 1) {
      block += 'Subject: ' + msg.getSubject() + '\n';
    }

    block += 'Content:\n';
    block += cleanedBody;

    output.push(block);
    index++;
  }

  return output.join('\n\n---\n\n');
}

/**************************************
 * NETTOYAGE EMAIL (MVP)
 **************************************/

function cleanEmailBody(body) {
  if (!body) return '';

  var text = body;

  // Supprimer réponses citées (FR / EN)
  text = text.split(/(\nOn .* wrote:|\nLe .* a écrit :|\nFrom: .*|\nDe : .*)/i)[0];

  // Supprimer signatures courantes
  text = text.split(/(\n--\s*\n|\n__+\n|\nSent from my)/i)[0];

  // Nettoyage des espaces
  text = text.replace(/\r/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}


/**************************************
 * LLM
 **************************************/

function extractActionsWithLLM(cleanThread) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY_GMAIL_MVP');
  if (!apiKey) throw new Error('Clé API manquante');

  var payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Tu es un assistant spécialisé en extraction d’actions.' },
      { role: 'user', content: buildPrompt(cleanThread) }
    ],
    temperature: 0
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  if (response.getResponseCode() !== 200) {
    throw new Error(response.getContentText());
  }

  var data = JSON.parse(response.getContentText());
  var rawContent = data.choices[0].message.content;

  // 🔍 DEBUG pour voir EXACTEMENT ce que le LLM renvoie
  Logger.log('RAW LLM RESPONSE:\n' + rawContent);

  var cleanedJson = extractJson(rawContent);
  var result;

  try {
    result = JSON.parse(cleanedJson);
  } catch (e) {
    throw new Error(
      'JSON invalide retourné par le LLM:\n' + cleanedJson
    );
  }

  if (!result.actions || result.actions.length === 0) {
    if (containsSolicitation(cleanThread)) {
      result.actions = [{
        title: 'Répondre à la demande',
        description: 'Donner un retour ou une réponse au message',
        confidence: 'fallback'
      }];
    }
  }

  return result;
}

function extractJson(text) {
  if (!text) {
    throw new Error('Réponse LLM vide');
  }

  // Supprimer blocs ```json ... ```
  text = text.replace(/```json/i, '');
  text = text.replace(/```/g, '');

  return text.trim();
}

function buildPrompt(cleanThread) {
  return (
    'Tu lis un thread d’emails professionnels, déjà nettoyé (sans signatures ni citations).\n\n' +
    'Ta mission est d’identifier UNIQUEMENT les actions concrètes encore à effectuer.\n\n' +

    'Règles importantes :\n' +
    '- Une action = quelque chose qu’une personne doit faire après la fin de ce thread\n' +
    '- Ignore les discussions, confirmations, remerciements, validations\n' +
    '- Ignore les actions déjà réalisées ou annulées\n' +
    '- Déduplique les actions même si elles sont répétées ou reformulées\n' +
    '- Chaque phrase ou question du thread pouvant impliquer une action doit être transformée en action concrète. Question, demande ou suggestion → action à effectuer.Par exemple : "Je reviens vers vous pour avoir vos retours sur...", alors action = "Donner ses retours sur ...".\n' +
    '- Le thread peut contenir plusieurs langues\n\n' +

    'Pour chaque action, indique :\n' +
    '- titre du thread\n' +
    '- action\n' +
    '- responsable (ou null)\n' +
    '- urgence : low | normal | high\n' +
    '- source\n\n' +

    'Retourne UNIQUEMENT le corps JSON valide, sans inclure aucun texte, aucun commentaire, aucun backtick, sous la forme :\n' +
    '[{ "titre":"...","action": "...", "responsable": null, "urgence": "normal", "source": "..." }]\n\n' +
    'THREAD:\n' +
    cleanThread
  );
}

function containsSolicitation(text) {
  var patterns = [
    /\bretour(s)?\b/i,
    /\bavis\b/i,
    /\bremarque(s)?\b/i,
    /\bsuggestion(s)?\b/i,
    /\bcomment(s)?\b/i,
    /\bqu’en pensez[- ]vous\b/i,
    /\bpouvez[- ]vous\b/i,
    /\bmerci de\b/i,
    /\bquestion(s)?\b/i,
    /\?/  // fallback large
  ];

  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(text)) {
      return true;
    }
  }
  return false;
}

/**************************************
 * UI RESULT MVP n°1
 **************************************/

function buildActionsCard(actions) {
  var section = CardService.newCardSection();

  if (!actions || !actions.length) {
    section.addWidget(
      CardService.newTextParagraph().setText('Aucune action détectée 🎉')
    );
  } else {
    for (var i = 0; i < actions.length; i++) {
      var a = actions[i];
      section.addWidget(
        CardService.newTextParagraph().setText(
          '<b>' + escapeHtml(a.action) + '</b><br>' +
          'Responsable : ' + (a.responsable || '—') + '<br>' +
          'Urgence : ' + a.urgence + '<br>' +
          'Source : ' + a.source
        )
      );
    }
  }

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Actions détectées'))
    .addSection(section)
    .build();
}


/**************************************
 * UI RESULT MVP n°2
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
 * UTILITAIRE HTML
 **************************************/

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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
 * Affichage et traitement des actions
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