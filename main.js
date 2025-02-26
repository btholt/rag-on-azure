// you need this one every time
import callAzureAI from "./callAzureAI.js";

// do this block for naive
// import getRagResults from "./naive.js";
// const content = "death cab";
// const ragResults = [];

// do this one for just vector search and no llm cleanup of the rag search term
// import getRagResults from "./vectorSearch.js";

// do this one for llm cleanup of the rag search term
import getRagResults from "./llmCleanup.js";

// do one of these (or your own query) for either of the vector search methods
// const content =
//   "Oh my god I love Death Cab for Cutie. So much. They are the best band ever. I love their music so much. It's so good. Can you recommend me some bands that are similar to Death Cab that have indie rock vibes and have interesting beats and good emotional lyrics?";
// const content =
// "Recommend bands in the vein of CHVRCHES, Purity Ring, BANKS, The xx, Phantogram and Sylvan Esso. I like good beats, electronica, melodic, and sometimes dark and moody music.";

// comment these two lines out for naive, otherwise leave them in
const ragResults = await getRagResults(content);
console.log(ragResults);

// always do these two
const result = await callAzureAI(content, ragResults);
console.log(result);
