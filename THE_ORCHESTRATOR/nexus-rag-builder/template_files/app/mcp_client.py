import os
import google.generativeai as genai
from qdrant_client import QdrantClient
from supabase import create_client, Client
from unstructured.partition.auto import partition
from typing import List

# --- MCP (Micro-Component Proxies) ---
# Detta är vår "Tool-API" / funktionslager.

# --- Anslutningar (Singleton-mönster) ---
_supabase: Client = None
_qdrant: QdrantClient = None
_gemini_embed: genai.GenerativeModel = None
_gemini_generate: genai.GenerativeModel = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.environ.get("SUPABASE_URL"),
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        )
    return _supabase

def get_qdrant() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(
            host=os.environ.get("QDRANT_HOST"),
            port=int(os.environ.get("QDRANT_PORT"))
        )
    return _qdrant

def get_gemini_model(type: str = "generate") -> genai.GenerativeModel:
    """Hämtar en Gemini-modell, 'generate' eller 'text' (för embeddings)"""
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    
    if type == "text":
        global _gemini_embed
        if _gemini_embed is None:
            _gemini_embed = genai.GenerativeModel(os.environ.get("GEMINI_EMBEDDING_MODEL", "{{GEMINI_EMBEDDING_MODEL}}"))
        return _gemini_embed
    else:
        global _gemini_generate
        if _gemini_generate is None:
            _gemini_generate = genai.GenerativeModel(os.environ.get("GEMINI_GENERATION_MODEL", "{{GEMINI_GENERATION_MODEL}}"))
        return _gemini_generate

# --- Parsing & Chunking ---
def parse_document_content(file_path: str) -> List[str]:
    """Använder 'unstructured' för att parsa filen till textelement."""
    try:
        elements = partition(filename=file_path)
        # Enkel chunking-strategi: bara returnera texten från varje element.
        # En bättre strategi vore att slå ihop små element.
        return [str(el) for el in elements if str(el).strip()]
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return []

# --- LLM & Vektor-funktioner ---
def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Skapar embeddings för en lista av text-chunks."""
    model = get_gemini_model("text")
    embedding_model = os.environ.get("GEMINI_EMBEDDING_MODEL", "{{GEMINI_EMBEDDING_MODEL}}")
    
    # Gemini API:et kan hantera batchar upp till 100
    batch_size = 100
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        result = model.embed_content(
            model=embedding_model,
            content=batch,
            task_type="RETRIEVAL_DOCUMENT"
        )
        all_embeddings.extend(result['embedding'])
    return all_embeddings

def get_context_from_query(query: str, collection_name: str, top_k: int = None) -> (str, List[str]):
    """Skapar embedding för en fråga och hämtar de bästa resultaten från Qdrant."""
    if top_k is None:
        top_k = int(os.environ.get("SEARCH_TOP_K", "{{SEARCH_TOP_K}}"))
    
    model = get_gemini_model("text")
    embedding_model = os.environ.get("GEMINI_EMBEDDING_MODEL", "{{GEMINI_EMBEDDING_MODEL}}")
    
    # 1. Skapa embedding för frågan
    result = model.embed_content(
        model=embedding_model,
        content=query,
        task_type="RETRIEVAL_QUERY"
    )
    query_vector = result['embedding']
    
    # 2. Sök i Qdrant
    hits = get_qdrant().search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=top_k,
        with_payload=True # För att få tillbaka texten och källan
    )
    
    # 3. Filtrera baserat på relevans-tröskel
    relevance_threshold = float(os.environ.get("RELEVANCE_THRESHOLD", "{{RELEVANCE_THRESHOLD}}"))
    
    context = ""
    sources = set()
    for hit in hits:
        if hit.score > relevance_threshold:
            context += hit.payload['text'] + "\n---\n"
            sources.add(hit.payload['source'])
            
    return context, list(sources)

def generate_answer_from_context(context: str, query: str) -> str:
    """Använder den hämtade kontexten för att generera ett svar med Gemini."""
    model = get_gemini_model("generate")
    
    # Ladda anpassad prompt (om angiven) eller använd default
    prompt_template = os.environ.get("RAG_SYSTEM_PROMPT", """{{RAG_SYSTEM_PROMPT}}""")
    
    # Ersätt platshållare
    prompt = prompt_template.replace("{{context_variable}}", context).replace("{{query_variable}}", query)
    
    # Fallback till strukturerad prompt om ingen anpassning gjorts
    if "{{context_variable}}" in prompt:  # Om platshållare fortfarande finns
        prompt = f"""
Du är en hjälpsam assistent. Svara på användarens fråga baserat ENDAST på följande kontext.
Om svaret inte finns i kontexten, säg "Jag kunde inte hitta information om detta i de angivna dokumenten."
Citera inte kontexten direkt, utan formulera ett eget svar.

KONTEXT:
{context}

FRÅGA:
{query}

SVAR:
"""
    
    response = model.generate_content(prompt)
    return response.text