import { neon } from "@neondatabase/serverless";

async function findSimilarBands(searchTerm) {
  const sql = neon(process.env.DATABASE_URL);

  const rows = await sql`
        SELECT
            r.reviewid, 
            r.title, 
            r.artist, 
            r.score
        FROM reviews r
        JOIN content c ON r.reviewid = c.reviewid
        WHERE
            CONCAT(r.artist, ' ', r.title, ' ', c.content) ILIKE '%' || ${searchTerm} || '%'
        ORDER BY
            r.score DESC
        LIMIT 10
    `;

  return rows;
}

export default findSimilarBands;
