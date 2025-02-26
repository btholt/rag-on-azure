import vectorSearch from "./vectorSearch.js";

const endpoint = process.env.AZURE_AI_ENDPOINT;
const apiKey = process.env.AZURE_AI_API_KEY;
const deploymentName = process.env.AZURE_AI_DEPLOYMENT_NAME;

async function cleanupQueryWithAzureAI(query) {
  if (!endpoint || !apiKey || !deploymentName) {
    console.warn("⚠️ Azure AI credentials not found, using original query");
    return query;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "x-ms-model-mesh-model-name": deploymentName,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a query optimizer for RAG systems. Your goal is to reformulate user queries to be more effective for retrieval from a vector database. Make the query clear, specific, and focused on key information needs without changing the original intent. The vector database is a list of music reviews with embeddings generated from the text. Please wrap your final response in <query> tags. This is keyword based that is going to be querying against titles, genres, artist names, and written reviews so be sure to include the most important keywords in your query and no superfluous terms.",
          },
          {
            role: "user",
            content: `Please optimize this query for vector search: "${query}"`,
          },
        ],
        temperature: 0.3,
      }),
    });

    const responseData = await response.json();
    console.log("🔍 Azure AI response:", responseData.choices);
    const totalResponse = responseData.choices[0].message.content.trim();
    const cleanedQuery = totalResponse
      .split("<query>")
      .pop()
      .split("</query>")[0];
    console.log(`🔍 Original query: "${query}"`);
    console.log(`✨ Optimized query: "${cleanedQuery}"`);

    return cleanedQuery;
  } catch (error) {
    console.error("❌ Error cleaning up query with Azure AI:", error);
    console.log("⚠️ Falling back to original query");
    return query;
  }
}

export default async function rag(query) {
  const cleanedQuery = await cleanupQueryWithAzureAI(query);
  const similarBands = await vectorSearch(cleanedQuery);
  return similarBands;
}
