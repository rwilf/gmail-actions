# Contrats de données — MVP Gmail Actions

## Action

Une action est représentée par l’objet suivant :

```json
{
  "id": "string",
  "label": "string",
  "status": "open | done",
  "threadId": "string",
  "createdAt": "ISO8601",
  "source": "llm"
}
