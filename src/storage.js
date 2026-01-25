var STORAGE_KEY = 'ACTIONS_V1';

/**************************************
 * Lecture / Sauvegarde de toutes les actions
 **************************************/
function getAllActions() {
  var raw = PropertiesService.getUserProperties().getProperty(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAllActions(actionMap) {
  PropertiesService.getUserProperties()
    .setProperty(STORAGE_KEY, JSON.stringify(actionMap));
}

/**************************************
 * Récupération des actions déjà existantes d’un thread donné
 **************************************/
function getActionsByThread(threadId) {
  var all = getAllActions();
  var result = [];

  for (var id in all) {
    if (all[id].threadId === threadId) {
      result.push(all[id]);
    }
  }
  return result;
}

/**************************************
 * Fusion des actions extraites avec les actions existantes
 * - évite les doublons
 **************************************/
function mergeExtractedWithExisting(extracted, existing) {
  var existingByFp = {}; // index des actions existantes par fingerprint

  existing.forEach(function (a) {
    existingByFp[a.fingerprint] = a;
  }); // construction de l’index

  return extracted.map(function (a) {
    if (existingByFp[a.fingerprint]) { // action déjà existante
      var saved = existingByFp[a.fingerprint];

      return {
        fingerprint: a.fingerprint,
        threadId: a.threadId,
        action: saved.action,          // libellé utilisateur
        originalAction: saved.originalAction || a.originalAction,
        responsable: saved.responsable,
        urgence: saved.urgence,
        tags: saved.tags || [],
        status: saved.status            // open / done / etc
      };
    }

    return a; // nouvelle action
  });
}


/*****************A SUPPRIMER*********************
 * Validation d'une action par l'utilisateur (via son ID)
 **************************************/
function validateActionsOLD(fingerprints) {
  var all = getAllActions();
  var now = new Date().toISOString();

  fingerprints.forEach(function (id) {
    if (all[id]) {
      all[id].status = 'validated';
      all[id].updatedAt = now;
    }
  });

  saveAllActions(all);
}

/**************************************
 * Persistance des actions validées
 **************************************/
function persistValidatedActions(validatedActions) {
  var allActions = getAllActions();
  var now = Date.now();
  
  validatedActions.forEach(function (action) {
    var existing = allActions.find(a => a.fingerprint === action.fingerprint); //

    if (existing) {
      // mise à jour complète
      existing.action = action.action;
      existing.responsable = action.responsable;
      existing.urgence = action.urgence;
      existing.tags = action.tags || [];
      existing.status = 'open';
      existing.updatedAt = now;
    } else {
      //action.subject = getThreadSubject(threadId);
      action.createdAt = now;
      action.updatedAt = now;
      action.status = 'open';
      allActions.push(action);
    }
  });

  saveAllActions(allActions);
}


/* A CONSTRUIRE
 function getOpenActions(e)
*/

/**************************************
 * Marquage d’une action comme done
 **************************************/
function markActionDone(fingerprint) {
  var all = getAllActions();
  if (all[fingerprint]) {
    all[fingerprint].status = 'done';
    all[fingerprint].updatedAt = new Date().toISOString();
    saveAllActions(all);
  }
}

// REGROUPEMENTS
/**************************************
 * Regroupement des actions par thread
 **************************************/
function groupActionsByThread(actions) {
  var map = {};
  actions.forEach(function (a) {
    if (!map[a.threadId]) map[a.threadId] = [];
    map[a.threadId].push(a);
  });
  return map;
}
