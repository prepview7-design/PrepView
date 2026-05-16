import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()
llm = ChatGroq(model='llama-3.1-8b-instant').bind(response_format={'type': 'json_object'})
print(llm.invoke('Return JSON. {"test": 1}'))
