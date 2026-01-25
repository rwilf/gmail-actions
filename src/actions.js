/**************************************
 * ACTIONS – logique métier centrale
 **************************************/

/**************************************
 * Validation des actions sélectionnées
 **************************************/
function validateSelectedActionsOLD(selectedFingerprints, allScreenActions) {
    var now = Date.now();

    return allScreenActions
      .filter(function (action) {
        return selectedFingerprints.indexOf(action.fingerprint) !== -1;
      })
      .map(function (action) {
        return Object.assign({}, action, {
          status: 'open',
          validatedAt: now
        });
      });
  }

/**************************************
 * Normalisation d’une action issue de l’UI
 * – garantit la présence des champs attendus
 * – initialise le statut
 **************************************/
function normalizeActionOLD(action, threadId) {
  var now = new Date().toISOString();

  return {
    fingerprint: action.fingerprint,
    threadId: threadId,

    action: action.action,
    originalAction: action.originalAction || action.action, // conserve l’original si pré-existant

    responsable: action.responsable || null,
    urgence: action.urgence || 'normal', // la valeur par défaut est 'normal'
    tags: action.tags || [], // tableau de tags est vide par défaut

    status: action.status || 'draft', // le statut initial est 'draft'
    createdAt: action.createdAt || now,
    updatedAt: now
  };
}

/***************A SUPPRIMER***********************
 * Fusion d’une action nouvelle avec une action existante
 * - préserve les données existantes si non fournies dans la nouvelle
 * - conserve l’ID immuable (fingerprint) pour garder la traçabilité
 * - met à jour la date de mise à jour
 **************************************/
function mergeWithExistingActionOLD(incoming, existing) {
  return {
    fingerprint: existing.fingerprint,
    threadId: existing.threadId,

    action: incoming.action || existing.action, // on privilégie la nouvelle description si fournie
    originalAction: existing.originalAction,

    responsable: incoming.responsable ?? existing.responsable, // on privilégie la nouvelle valeur si fournie (même null)
    urgence: incoming.urgence || existing.urgence, // on privilégie la nouvelle valeur si fournie
    tags: incoming.tags.length ? incoming.tags : existing.tags, // on privilégie les nouveaux tags si fournis

    status: existing.status,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };
}

/**************************************
 * Génération d’une empreinte unique pour une action donnée dans un thread donné
 * qui servira à éviter les doublons en cas de modification manuelle du libellé de l’action
 **************************************/
function generateFingerprint(threadId, actionText) {
  var base = threadId + '|' + actionText.toLowerCase().trim();
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    base
  );
  return Utilities.base64Encode(digest).substring(0, 12);
}

/**************************************
 * Post-traitement des actions extraites
 **************************************/
function postProcessExtractedActions(rawActions, threadId) {
  var now = new Date().toISOString();

  //Logger.log('Thread ID : ' + threadId);
  //Logger.log('Sujet : ' + getThreadSubject(threadId));

  return rawActions.map(function (raw) {
    var actionText = raw.action || raw.title || '';

    return {
      fingerprint: generateFingerprint(threadId, actionText),
      threadId: threadId,
      subject: getThreadSubject(threadId),

      action: actionText,
      originalAction: actionText,

      responsable: raw.responsable || null,
      urgence: raw.urgence || 'normal',
      tags: raw.tags || [],

      status: 'draft',
      createdAt: now,
      updatedAt: now
    };
  });
}

/**************************************
 * Récupération du sujet d’un thread Gmail
 **************************************/
function getThreadSubject(threadId) {
  var thread = GmailApp.getThreadById(threadId);
  return thread.getFirstMessageSubject();
}