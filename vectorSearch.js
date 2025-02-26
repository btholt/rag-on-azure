import { neon } from "@neondatabase/serverless";

const endpoint = process.env.AZURE_AI_EMBEDDING_ENDPOINT;
const apiKey = process.env.AZURE_AI_EMBEDDING_API_KEY;
const embeddingsDeploymentName = process.env.AZURE_AI_EMBEDDING_DEPLOYMENT_NAME;

async function generateEmbedding(query) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "x-ms-model-mesh-model-name": embeddingsDeploymentName,
      },
      body: JSON.stringify({
        input: query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();
    return result.data[0].embedding;
  } catch (error) {
    console.error(`Error generating embedding: ${error.message}`);
    throw error;
  }
}

async function findSimilarBandsVector(query, limit = 50) {
  try {
    const sql = neon(process.env.DATABASE_WITH_EMBEDDINGS_URL);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Search for similar reviews using cosine similarity
    const results = await sql`
      SELECT 
        reviewid, 
        title, 
        artist, 
        score, 
        1 - (embedding <=> ${vectorString}) as similarity
      FROM 
        embeddings
      ORDER BY 
        similarity DESC
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    console.error("Error in vector search:", error);
    throw error;
  }
}

export default findSimilarBandsVector;
