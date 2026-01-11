/**************************************************
 * Test local de la fonction extractActionsWithLLM
 * via OpenAI API dans un environnement Node.js
 *************************************************/

 const { buildPrompt, extractJson, safeParseJson, fallbackIfNeeded, containsSolicitation } =
  require('./llm.node'); // expose les vraies fcts appscript

const { callOpenAI } =
  require('./openai.client'); // expose la fct node.js équivalente à extractActionsWithLLM

async function testLLM() {
  const cleanThread = `
Bonjour,

Je reviens vers vous pour avoir vos retours sur la formation Numérique Responsable :
- les objectifs ont-ils été atteints ?
- le timing ?
- give me your feedback!

Darüber hinaus senden Sie eine E-Mail mit demselben Feedback an den Marketingleiter.

Grazie per aver annaffiato le tue piante.

Merci d’avance
`;

  const prompt = buildPrompt(cleanThread);

  console.log('===== PROMPT =====\n');
  console.log(prompt);

  const raw = await callOpenAI(prompt);

  console.log('\n===== RAW LLM =====\n');
  console.log(raw);

  const cleaned = extractJson(raw);
  //var actions = safeParseJson(jsonText);
  //actions = fallbackIfNeeded(actions, cleanThread);

  console.log('\n===== Fixed LLM =====\n');
  console.log(cleaned);

  let result = JSON.parse(cleaned);

  if (!result.length && containsSolicitation(cleanThread)) {
    result = [{
      titre: 'Formation Numérique Responsable',
      action: 'Donner ses retours sur la formation',
      responsable: null,
      urgence: 'normal',
      source: 'fallback'
    }];
  }

  console.log('\n===== FINAL RESULT =====\n');
  console.log(JSON.stringify(result, null, 2));
}

testLLM().catch(console.error);
