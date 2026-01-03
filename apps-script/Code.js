/**************************************
 * MENU GMAIL
 **************************************/

function onGmailMessage(e) {
  return buildHomeCard(e);
}

function onGmailThread(e) {
  return buildHomeCard(e);
}



/**************************************
 * ACTION PRINCIPALE
 **************************************/

function showExtractedActions(e) {
  var threadId = e.gmail.threadId;

  var cleanThread = buildCleanThread(threadId);
  var actions = extractActionsWithLLM(cleanThread);

  return buildActionsValidationCard(actions, threadId);
}


