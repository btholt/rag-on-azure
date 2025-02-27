import { neon } from "@neondatabase/serverless";
// Fix environment variable names to be consistent
const endpoint = process.env.AZURE_AI_EMBEDDING_ENDPOINT;
const apiKey = process.env.AZURE_AI_EMBEDDING_API_KEY;
const embeddingsDeploymentName = process.env.AZURE_AI_EMBEDDING_DEPLOYMENT_NAME;

console.log("🔌 Embeddings endpoint:", endpoint);
console.log("🤖 Embeddings model:", embeddingsDeploymentName);

async function generateEmbedding(text) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "x-ms-model-mesh-model-name": embeddingsDeploymentName,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Response:", errorText);
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();
    console.log(
      "✅ Embedding generated successfully, dimensions:",
      result.data[0].embedding.length
    );
    return result.data[0].embedding;
  } catch (error) {
    console.error(`❌ Error generating embedding: ${error.message}`);
    throw error;
  }
}

async function setupDatabase() {
  const sql = neon(process.env.DATABASE_WITH_EMBEDDINGS_URL);

  // Enable pgvector extension if not already enabled
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log("🛠️ pgvector extension enabled");
  } catch (error) {
    console.error("❌ Error enabling pgvector extension:", error);
    throw error;
  }

  // Create embeddings table if it doesn't exist
  try {
    await sql`
            CREATE TABLE IF NOT EXISTS embeddings (
                reviewid TEXT PRIMARY KEY,
                embedding vector(1536),
                title TEXT,
                artist TEXT,
                score NUMERIC
            )
        `;
    console.log("📊 Embeddings table created or already exists");
  } catch (error) {
    console.error("❌ Error creating embeddings table:", error);
    throw error;
  }

  return sql;
}

async function getReviews(sql) {
  try {
    const reviews = await sql`
            SELECT r.reviewid, r.title, r.artist, r.score, c.content
            FROM reviews r
            JOIN content c ON r.reviewid = c.reviewid
            LIMIT 5000
            OFFSET 16000
        `;
    console.log(`📚 Retrieved ${reviews.length} reviews from database`);
    return reviews;
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    throw error;
  }
}

async function createEmbeddings() {
  console.log("🚀 Starting embeddings generation process...");

  try {
    const sql = await setupDatabase();
    const reviews = await getReviews(sql);

    console.log(`🔍 Processing ${reviews.length} reviews...`);

    // Check which reviews already have embeddings
    const existingReviewIds = await sql`
            SELECT reviewid FROM embeddings
        `;
    const existingIds = new Set(existingReviewIds.map((row) => row.reviewid));
    console.log(`📋 Found ${existingIds.size} existing embeddings`);

    // Filter out reviews that already have embeddings
    const reviewsToProcess = reviews.filter(
      (review) => !existingIds.has(review.reviewid)
    );
    console.log(
      `📝 Need to generate embeddings for ${reviewsToProcess.length} reviews`
    );

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < reviewsToProcess.length; i += batchSize) {
      const batch = reviewsToProcess.slice(i, i + batchSize);
      console.log(
        `📦 Processing batch ${i / batchSize + 1} of ${Math.ceil(
          reviewsToProcess.length / batchSize
        )}`
      );

      await Promise.all(
        batch.map(async (review) => {
          try {
            // Create text input for embedding
            const textForEmbedding = `Artist: ${review.artist}, Album: ${review.title}, Review: ${review.content}`;

            // Generate embedding
            const embedding = await generateEmbedding(textForEmbedding);

            // Format the embedding properly for pgvector - convert to string with brackets
            const vectorString = `[${embedding.join(",")}]`;

            // Save to database using the proper pgvector format
            await sql`
                            INSERT INTO embeddings (reviewid, embedding, title, artist, score)
                            VALUES (
                                ${review.reviewid}, 
                                ${vectorString}::vector, 
                                ${review.title}, 
                                ${review.artist}, 
                                ${review.score}
                            )
                        `;

            console.log(
              `✨ Created embedding for reviewid: ${review.reviewid}`
            );
          } catch (error) {
            console.error(
              `❌ Error processing review ${review.reviewid}:`,
              error
            );
          }
        })
      );

      // Pause between batches to avoid rate limits
      if (i + batchSize < reviewsToProcess.length) {
        console.log("⏸️ Pausing for 3 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log("🎉 Embeddings generation complete!");
  } catch (error) {
    console.error("❌ Error in createEmbeddings:", error);
  }
}

// Run the script
createEmbeddings().catch(console.error);
