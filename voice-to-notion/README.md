<!-- insert logo here -->
<div align="center">
<img src="./assets/logo-background.svg"  />
</div>

# Setup

1. Set terminal to repository root
1. Run `npm i` in terminal
1. Make a copy of `.env.example` file
1. Rename the copy to `.env`
1. Put `Gemini API key` inside of `.env`
1. Go to [https://www.iloveapi.com/user/projects](https://www.iloveapi.com/user/projects) and get public and private keys
1. Put those keys in the `.env` file
1. Run `npm run dev`
1. In the website go to the settings page and put in `Notion API key`.

# To Access Generaeted Code

1. Split terminal. In one, navigate to voice-to-notion, and in the other, navigate to scraping-notion-docs
1. Run the following commands in both terminals:
   `export GOOGLE_API_KEY="(your google api key)"`
   `export NOTION_API_KEY="(your notion api key)"`
1. run the chromadb server inside scraping-notion-docs directory with the following command
   `chroma run --path ./chroma_db_default_embeddings_google`
1. run `npm run dev` in the voice-to-notion directory
