# Intention du MVP — Gmail Actions Tracker

## Objectif
Réduire la charge mentale liée aux emails en capturant automatiquement
les actions implicites ou explicites présentes dans un thread Gmail.

## Périmètre MVP (strict)
- Analyse d’un thread Gmail sélectionné
- Extraction d’actions via LLM
- Validation manuelle par l’utilisateur
- Stockage simple des actions ouvertes
- Marquage des actions comme terminées
- Lien vers le thread Gmail d’origine

## Hors périmètre (volontaire)
- Pas de synchronisation multi-device
- Pas de rappels / notifications
- Pas de gestion avancée des doublons
- Pas de priorisation automatique
- Pas d’analytics

## Principe clé
L’utilisateur reste toujours maître :
aucune action n’est créée sans validation explicite.

## Critère de succès
L’utilisateur ne perd plus une action importante présente dans un email.
