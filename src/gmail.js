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
