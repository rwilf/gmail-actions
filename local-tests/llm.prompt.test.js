/**************************************************
 * Tests rapides des fonctions LLM en local (sans appel OpenAI api) :
 * - extractJson, avec des réponses simulées (mocks)
 * - buildPrompt
 * - containsSolicitation, avec 3 exemples simples 
 *************************************************/

const llm = require('./llm.node');
console.log(llm);

const { extractJson, buildPrompt, containsSolicitation } =
  require('./llm.node'); // charge ce fichier et ce qu’il expose = lis le fichier llm.js et donne-moi ce qu’il a exporté

const responses = require('./mocks/llmResponses');

// Test 1 — JSON valide
console.log('TEST JSON VALIDE');
console.log(extractJson(responses.simple));

// Test 2 — JSON mal formé
console.log('\nTEST JSON MAL FORMÉ');
console.log(extractJson(responses.malformed));

// Test 3 — Pas de JSON
console.log('\nTEST PAS DE JSON');
console.log(extractJson(responses.noJson));

// Test 4 — Prompt
console.log('\nTEST PROMPT');
console.log(
  buildPrompt(`
Bonjour,

Peux-tu m’envoyer le devis aujourd’hui ?
Merci
`)
);

// Test 5 — Détection sollicitation
console.log('\nTEST SOLICITATION');

[
  "Peux-tu m'envoyer le devis ?",
  "Merci pour ton retour",
  "Je te tiens au courant"
].forEach(t => {
  console.log(t, '=>', containsSolicitation(t));
});
