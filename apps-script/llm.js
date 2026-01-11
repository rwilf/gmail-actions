/**************************************
 * LLM
 **************************************/

function extractActionsWithLLM(cleanThread) {
  var rawText = callLLM(cleanThread);

  Logger.log('===== RAW LLM =====\n' + rawText);

  var jsonText = extractJson(rawText);

  var actions = safeParseJson(jsonText);

  actions = fallbackIfNeeded(actions, cleanThread);

  return actions;
}

/***************************************
* Appel au LLM OpenAI
* **************************************/

function callLLM(cleanThread) {
  var apiKey = getOpenAIApiKey();
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

  var response = UrlFetchApp.fetch(
    'https://api.openai.com/v1/chat/completions',
    options
  );

  if (response.getResponseCode() !== 200) {
    throw new Error(response.getContentText());
  }

  var data = JSON.parse(response.getContentText());
  return data.choices[0].message.content;
}

/***************************************
* Construction du prompt pour le LLM
* **************************************/

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

/***************************************
* Cleanning de la réponse LLM 
* pour obtenir un JSON bien formaté
* **************************************/

function extractJson(text) {
  if (!text) throw new Error('Réponse LLM vide');

  text = text.replace(/```json/i, '');
  text = text.replace(/```/g, '');
  text = text.trim();

  // Cas fréquent : "}},{"
  text = text.replace(/}\s*},\s*{/g, '},{');

  // Supprimer virgules finales avant ] ou }
  text = text.replace(/,\s*]/g, ']');
  text = text.replace(/,\s*}/g, '}');

  return text;
}

function safeParseJson(text) {
  try {
    var parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    Logger.log('JSON invalide après correction');
    Logger.log(text);
    return [];
  }
}

/***************************************
* Fallback si aucune action détectée
* **************************************/

function fallbackIfNeeded(actions, cleanThread) {
  if (actions.length > 0) return actions;

  if (containsSolicitation(cleanThread)) {
    return [{
      titre: 'Demande implicite',
      action: 'Répondre à la sollicitation présente dans le message',
      responsable: null,
      urgence: 'normal',
      source: 'Email'
    }];
  }

  return [];
}

/***************************************
* Code pour détecter si le texte contient
* une sollicitation implicite (en Français)
* **************************************/

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

/***************************************
* Récupération de la clé API OpenAI
* **************************************/

function getOpenAIApiKey() {
  return PropertiesService
    .getScriptProperties()
    .getProperty('OPENAI_API_KEY_GMAIL_MVP');
}
