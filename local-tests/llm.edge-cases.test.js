/**************************************************
 * Test local de la fonction extractActionsWithLLM
 * via OpenAI API dans un environnement Node.js
 *************************************************/

const { buildPrompt, extractJson } = require('./llm.node');
const { callOpenAI } = require('./openai.client');

/**************************************************
 * TEST 1 — Action implicite dans le mail
 * Succès si : au moins 1 action / verbe à l’infinitif / pas une question brute
 *************************************************/
async function testImplicitAction() {
  const thread = `
Bonjour,

Pouvez-vous me dire si le planning vous convient ?
Merci d’avance
`;

  const raw = await callOpenAI(buildPrompt(thread));
  const json = extractJson(raw);
  const actions = JSON.parse(json);

  console.log('\n===== TEST 1 =====\n');
  console.log(actions);
}
testImplicitAction().catch(console.error);

/**************************************************
 * TEST 2 — Multilingue mélangé
 * Succès si : actions distinctes / pas de fusion absurde / langue OK ou neutre
 *************************************************/
async function testMultilang() {
  const thread = `
Please review the document.
Merci de me faire un retour.
Bitte senden Sie eine Bestätigung.
`;

  const raw = await callOpenAI(buildPrompt(thread));
  const actions = JSON.parse(extractJson(raw));

  console.log('\n===== TEST 2 =====\n');  
  console.log(actions);
}
testMultilang().catch(console.error);

/**************************************************
 * TEST 3 — Bruit / politesse / phrases inutiles
 * Succès si : tableau vide OU aucune action artificielle
 *************************************************/
async function testNoise() {
  const thread = `
Bonjour,
J’espère que vous allez bien.
Merci pour votre email.
Bien cordialement.
`;

  const raw = await callOpenAI(buildPrompt(thread));
  const actions = JSON.parse(extractJson(raw));

  console.log('\n===== TEST 3 =====\n');  
  console.log(actions);
}
testNoise().catch(console.error);

/**************************************************
 * TEST 4 — Thread long avec redondance
 * Succès si : 1 seule action / pas 2–3 doublons
 *************************************************/
async function testLongThread() {
  const thread = `
Peux-tu m’envoyer le document ?
--- 
Oui je m’en occupe.
---
Relance : as-tu pu envoyer le document ?
---
Je vais le faire.
`;

  const raw = await callOpenAI(buildPrompt(thread));
  const actions = JSON.parse(extractJson(raw));

  console.log('\n===== TEST 4 =====\n');    
  console.log(actions);
}
testLongThread().catch(console.error);

