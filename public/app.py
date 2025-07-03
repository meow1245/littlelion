import os
import json
from flask import Flask, request, jsonify, send_file, send_from_directory
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from openai import OpenAI

app = Flask(__name__)

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("❌ 請在 .env 檔中設置 OPENAI_API_KEY")

client = OpenAI(api_key=api_key)

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=api_key
)

vectorstore = FAISS.load_local("faiss_index", embedding_model, allow_dangerous_deserialization=True)

filename_to_title = {
    "1_chunks.txt": "國立中央大學學則",
    "13-1_chunks.txt": "國立中央大學學分抵免辦法",
    "15_chunks.txt": "國立中央大學博士班、碩士班研究生學位考試細則",
    "36_chunks.txt": "國立中央大學精進學位論文品質實施要點",
    "國立中央大學資訊管理學系碩士班研究生修業辦法-1131001法規小組修正_chunks.txt": "國立中央大學資訊管理學系碩士班研究生修業辦法"
}

@app.route("/pictures/<path:filename>")
def send_picture(filename):
    return send_from_directory("pictures", filename)

@app.route("/")
def home():
    return send_from_directory(".", "ask.html")

@app.route("/ask.css")
def send_css():
    return send_file("ask.css")

@app.route("/ask", methods=["POST"])
def ask():
    user_question = request.json.get("question")
    if not user_question:
        return jsonify({"error": "沒有輸入問題"}), 400

    docs = vectorstore.similarity_search(user_question, k=10)

    law_chunks = []
    law_sources = []
    for doc in docs:
        raw_source = doc.metadata.get("source", "未知來源")
        readable_source = filename_to_title.get(raw_source, raw_source)
        content = doc.page_content.strip()
        law_chunks.append(f"【{readable_source}】\n{content}")
        law_sources.append({
            "source": readable_source,
            "content": content
        })

    context = "\n\n".join([f"【{s['source']}】\n{s['content']}" for s in law_sources])

    full_prompt = f"""你是大學內部的法規、規則助理，請根據下列法條段落，做出兩段回應，第一段是用正式的方式回答問題。如果無相關資料，請誠實回應。第二段是整合全部有用、相關的資料後，用類似大學助教的建議幫忙學生解決問題。

【法條段落】：
{context}

【員工問題】：
{user_question}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[
            {"role": "system", "content": "你是一個負責回答法規問題的助手，請以正式的語氣回答。"},
            {"role": "user", "content": full_prompt}
        ],
        temperature=0.3
    )

    answer = response.choices[0].message.content.strip()

    return jsonify({
        "answer": answer,
        "sources": law_sources
    })

if __name__ == "__main__":
    app.run(debug=True)
