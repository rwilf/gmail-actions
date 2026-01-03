# Architecture cible — MVP Gmail Actions

## Vue d’ensemble

Le MVP est organisé en 4 couches clairement séparées :

1. UI (Sidebar)
2. Orchestration (Code.js)
3. Intelligence (LLM)
4. Données (Storage)

---

## 1. UI — Sidebar.html

Responsabilités
- Afficher une page d’accueil avec 2 choix :
    - Rechercher des actions dans le thread courant
    - Afficher les actions déjà sauvegardées
- Afficher :
    - les actions proposées pour un thread (avant validation)
     - les actions sauvegardées (open / done)
- Permettre :
    - validation / rejet des actions détectées
    - marquage d’une action comme done

Ne fait PAS
- Affichage du thread ou de son contenu
- Nettoyage du thread
- Appel direct au LLM
- Logique métier ou de stockage

Communication :
- `google.script.run`

---

## 2. Orchestration — Code.js

Responsabilités :
- Point d’entrée Gmail (menu, sidebar)
- Coordination des étapes :
  A. récupération thread
  B. nettoyage
  C. extraction actions
  D. choix utilisateur
  E. stockage
- Gestion des erreurs
- Appels UI ↔ LLM ↔ Storage

Ne fait PAS :
- logique LLM
- logique de persistance complexe

---

## 3. Intelligence — llm.js

Responsabilités :
- Construire le prompt
- Appeler l’API OpenAI
- Normaliser la réponse
- Appliquer un post-traitement minimal

Ne fait PAS :
- stockage
- UI
- logique Gmail

---

## 4. Données — storage.js (ou Code.js MVP)

Responsabilités :
- Sauvegarder / charger les actions
- Marquer une action comme done
- Garantir la cohérence minimale

Contraintes MVP :
- PropertiesService
- JSON sérialisé
- Pas d’index complexe
- Pas de migration

---

## Flux principal (happy path)

1. Utilisateur ouvre un thread
2. Sidebar affichée
3. Thread nettoyé
4. LLM propose des actions
5. Utilisateur valide
6. Actions stockées
7. UI mise à jour

---

## Ce qui est volontairement hors MVP

- Priorité
- Dates / échéances
- Rappels
- Responsable différent du propriétaire
- Synchronisation multi-devices
- Déduplication inter-threads
- Notifications

Ces champs seront ajoutés dans une V2 sans casser le contrat Action.
