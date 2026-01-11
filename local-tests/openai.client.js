/**************************************************
 * Equivalent de la fonction extractActionsWithLLM
 * (qui ne fonctionne que dans Apps Script)
 * pour environnement Node.js local
 *************************************************/

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY manquante (env var)');
}

async function callOpenAI(prompt) {
  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un assistant spécialisé en extraction d’actions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data, null, 2));
  }

  return data.choices[0].message.content;
}

module.exports = { callOpenAI };
