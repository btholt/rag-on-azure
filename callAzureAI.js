const endpoint = process.env.AZURE_AI_ENDPOINT;
const apiKey = process.env.AZURE_AI_API_KEY;
const deploymentName = process.env.AZURE_AI_DEPLOYMENT_NAME;

// Use String.fromCharCode(27) to create the actual escape character
const ESC = String.fromCharCode(27);
let systemPrompt = `You are a helpful music recommendation assistant. Use the provided music review information to answer questions about music, artists, and albums. You must give at least five recommendations. Use ANSI terminal coloring for emphasis - here are examples:
- Blue text: ${ESC}[34mBlue Text${ESC}[0m
- Bold red text: ${ESC}[1;31mBold Red Text${ESC}[0m
- Artist names should be ${ESC}[1;36mcyan and bold${ESC}[0m 
- Album names should be ${ESC}[1;33myellow and bold${ESC}[0m
- Scores should be ${ESC}[1;31mbold and red${ESC}[0m
- Make use of emojis to make your responses more engaging and fun! 🎵🎶
`;

async function callAzureAI(userQuery, ragResults) {
  try {
    console.log("calling Azure AI service, please wait a while...");

    // Format RAG results into a readable context
    let formattedResults = "";
    let formattedSystemPrompt = systemPrompt;
    if (ragResults && ragResults.length > 0) {
      formattedSystemPrompt += `\n- You will be provided a list of music reviews from Pitchfork to help you answer questions.`;
      formattedResults =
        "Based on your query, here are some relevant music reviews:\n\n";
      ragResults.forEach((result, index) => {
        formattedResults += `${index + 1}. Artist: ${result.artist}, Album: ${
          result.title
        }, Score: ${result.score}/10\n`;
      });
    }

    const messages = [
      {
        role: "system",
        content: formattedSystemPrompt,
      },
      {
        role: "user",
        content: `${formattedResults}\n\nMy question is: ${userQuery}`,
      },
    ];

    console.log(
      "Sending the following messages to AI:",
      JSON.stringify(messages, null, 2)
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: messages,
        model: deploymentName,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${
          response.status
        }: ${await response.text()}`
      );
    }

    const result = await response.json();
    console.log("Response from AI service received");

    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content;
    }
    return "No response generated by the AI service.";
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    return `Error: ${error.message}`;
  }
}

export default callAzureAI;
