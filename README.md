![alt text](voice-to-notion/assets/logo-background.svg)

# Voice‑to‑Notion

We are a voice-primary web app that lets you manage your Notion workspace via natural‑language commands (voice or text)!

While Notion may be powerful on desktop, Notion's mobile application can be slow and cumbersome for quick note-taking or accessing information on the go!

With Voice-to-Notion, be able to create pages, assignments in a database, transform syllabi into structured Notion databases, generate executable code with Gemini hands-free.

# Features
* Create and update pages with content
* Add and make assignments/exams in a database 
* Upload syllabi and format key information in a database & handle missing information/differently formatted syllabi
* Create and execute generated code from user queries to perform further Notion tasks

# Setup

1. Set terminal to repository root
2. Run `npm i` in terminal
3. Make a copy of `.env.example` file
4. Rename the copy to `.env`
5. Put `Gemini API key` inside of `.env`
6. Go to [https://www.iloveapi.com/user/projects](https://www.iloveapi.com/user/projects) and get public and private keys
7. Put those keys in the `.env` file
8. Run `npm run dev` in terminal
    * Then visit [http://localhost:3000/] for the local server or use the QR code for mobile launching
9. In the website go to the settings page and put in `Notion API key`.
    * Be sure to have your Notion API connected to your home page
10. Head to Voice or Files on the app and get to creating!

# To Setup Generaeted Code Feature

1. Split terminal. In one, navigate to voice-to-notion, and in the other, navigate to scraping-notion-docs
2. Run the following commands in both terminals:
   `export GOOGLE_API_KEY="(your google api key)"`
   `export NOTION_API_KEY="(your notion api key)"`
3. run the chromadb server inside scraping-notion-docs directory with the following command:
   `chroma run --path ./chroma_db_default_embeddings_google`
4. run `npm run dev` in the voice-to-notion directory

# Key Links
GitHub: [https://github.com/TusharW4ni/cs6320-project/tree/main] 

Report: [https://docs.google.com/document/d/1QEw-iZ9I-_KUuEM1yuyjB15yypU5fCoeim_QqdWjpj8/edit?usp=sharing]

YouTube Tutorial: [https://youtu.be/bzyICtHLpZ8]

# Contributors

* Maunika Achanta
* Mir Patel
* Tushar Wani