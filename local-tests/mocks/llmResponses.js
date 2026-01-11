module.exports = {
  simple: `
Voici les actions détectées :
[
  { "titre": "Envoyer le devis" },
  { "title": "Relancer vendredi" }
]
`,

  malformed: `
Voici les actions :
[
  { titre: "Répondre au client" }
]
`,

  noJson: `
Je n'ai trouvé aucune action exploitable dans ce message.
`
};
