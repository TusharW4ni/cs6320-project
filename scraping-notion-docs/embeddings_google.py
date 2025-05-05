import os
import chromadb 
import chromadb.utils.embedding_functions as embedding_functions

# use directly
google_ef  = embedding_functions.GoogleGenerativeAiEmbeddingFunction(api_key="AIzaSyAV78tO-c4G5fav6dgHcTYAvSRf2-eixgs")

docs_directory = 'notion-docs'
persist_directory = 'chroma_db_default_embeddings_google' 

client = chromadb.PersistentClient(path=persist_directory)

#collection = client.get_or_create_collection("notion_api_docs_default_google")

documents = []
metadatas = []
ids = []

for i, filename in enumerate(os.listdir(docs_directory)):
    if filename.endswith(".txt"):
        filepath = os.path.join(docs_directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            documents.append(content)
            metadatas.append({"source": filename})
            ids.append(f"doc_{i}")

google_ef(documents)

# pass documents to query for .add and .query
collection = client.create_collection(name="notion_api_docs_default_google", embedding_function=google_ef)
collection = client.get_collection(name="notion_api_docs_default_google", embedding_function=google_ef)

collection.add(
    documents=documents,
    metadatas=metadatas,
    ids=ids
)

print(f"Successfully added {collection.count()} documents to Chroma using the default embedding function (direct).")


query = "How do I update a database?"
results = collection.query(
    query_texts=[query],
    n_results=3
)

print(f"\nQuery: {query}")
print(f"Results: {results['documents']}")