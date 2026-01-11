/**************************************************
 * Permet de faire fonctionner le code Apps Script
 * dans un environnement Node.js local pour tests
 *************************************************/

const fs = require('fs'); // permet de lire un fichier sur le disque
const vm = require('vm'); // permet à Node d’exécuter du code JS arbitraire dans un contexte isolé, dans une VM
const path = require('path'); // lit le texte brut du fichier Apps Script -> Aucun require, aucun import, juste du texte JS

const code = fs.readFileSync(
  path.join(__dirname, '../apps-script/llm.js'),
  'utf8'
);

const sandbox = {};
vm.createContext(sandbox); // faux environnement global
vm.runInContext(code, sandbox); // exécute le code Apps Script dans ce faux environnement comme s’il était chargé par Apps Script

module.exports = {
  extractJson: sandbox.extractJson,
  buildPrompt: sandbox.buildPrompt,
  safeParseJson: sandbox.safeParseJson,
  fallbackIfNeeded: sandbox.fallbackIfNeeded,
  containsSolicitation: sandbox.containsSolicitation
}; // Export propre vers Node
