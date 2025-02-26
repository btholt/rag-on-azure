# Demos for RAG'ing on Azure Talk

[Click here for the Google Slides][slides].

## What is this?

A brief intro to RAG, what it is, and how to roll it by hand. This is designed to show off how to do RAG on Azure using Postgres and Neon, but really this could be very easily re-purposed to be done with any cloud, any vector-search tool, and with any models. Open source FTW

## Models

I chose to use DeepSeek R1 (mostly because I hadn't tried it) and text-embedding-3-small from Azure. 

## Getting it running

Be aware that even on a good internet connection, it takes a minute or so to get the full answer back.

- Have Node.js 20.15ish+ installed (so we can use `--env-file` instead of `dotenv`).
- Clone the repo
- Run `npm install`
- Copy .env.template to .env
- A Neon account, any variety of it. You can get it through Azure, AWS, Vercel, or directly from Neon.
  - I use two branches to show off one branch with vector embeddings and one without. Feel free to make it the same branch
  - Put the Postgres connection strings in the .env file
- An Azure AI Foundry account
  - Create a hub
  - Create two endpoints
    - I used DeepSeek R1 for the inference
    - I used text-embedding-3-small for the embeddings
    - I believe both of the models could be changed out for other models with minimal effort.
  - Put the connect info needed in the .env file 
- Load the Pitchfork data into Neon
  - Download the SQLite file from [Kaggle]
  - Use pgloader to load SQLite file into local Postgres (doesn't work w/ Neon at the moment)
  - Use pg_dump to dump local Postgres to dump file
  - Use psql to load dump file into Neon branch
- `npm run start` will run the main.js file - comment and uncomment which parts of the demo you want to try
- `npm run embeddings` will start doing the embeddings for you. Be warned that it batches and works fairly slowly. To complete you'll have to do it several times and reset the offset in the query in the createEmbeddings file. You end up using 10ish million tokens which will cost a dollar or so.
  - You can definitely run the sample after only doing 100 embeddings or so - it's not necessary to do the whole db.
  - Keep an eye on it as sometimes you'll get rate limited

## Credit

I took heavy inspiration from [Pamela Fox's demos][pamela] she did with Burke Holland on the VS Code channel. Pamela makes amazing demos.

[slides]: https://docs.google.com/presentation/d/1IUHl-McWjt4KWGKxGoW1LpS3QNOOsW1QMWAuhaedXw0/edit#slide=id.g3320d82e198_0_29
[kaggle]: https://kaggle.com/datasets/nolanbconaway/pitchfork-data
[pamela]: https://learn.microsoft.com/en-us/shows/visual-studio-code/building-a-rag-application-with-a-postgresql-database