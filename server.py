import torch
from flask import Flask, request, jsonify

from txtai.embeddings import Embeddings
from txtai.pipeline import Labels, Summary, Extractor, Textractor

import os
os.environ["CUDA_VISIBLE_DEVICES"] = "0"

api = Flask(__name__)

@api.route('/similarity', methods=['POST'])
def main():
    opt = request.form.to_dict()

    # print(opt)
    if opt is None:
        return jsonify({"error": "no json data"})
    if "references" not in opt:
        return jsonify({"error": "no references data"})
    if "input" not in opt:
        return jsonify({"error": "no text data"})
    
    if "references" in opt:
        references = opt["references"]
        # splits by |
        references = references.split("|")
    else:
        references = []

    if "single_reference" in opt:
        currentDir = os.path.dirname(os.path.realpath(__file__))
        single_reference = opt["single_reference"]
        paragraphs = pTextractor(currentDir+"/html/"+single_reference+".html")
        for p in paragraphs:
            references.append(p)
        print(len(references))
        
    input = opt["input"]
    print(input)
    print(len(references))
    # similarity = labels(input, references)
    similarity = embeddings.similarity(input, references)
    # print(similarity)
    embedded_data = []
    for d in range(len(references)):
        embedded_data.append({
            "text": references[similarity[d][0]],
            "embedding": similarity[d][1],
            "index": similarity[d][0]
        })
    # embedded_data = sorted(embedded_data, key=lambda x: x["embedding"], reverse=True)
    # print(embedded_data[0])
    return jsonify(embedded_data)

@api.route('/labels', methods=['POST'])
def main2():
    opt = request.form.to_dict()

    print(opt)
    if opt is None:
        return jsonify({"error": "no json data"})
    if "input" not in opt:
        return jsonify({"error": "no text data"})
    
    if "references" in opt:
        references = opt["references"]
        # splits by |
        references = references.split("|")
    else:
        references = []

    if "single_reference" in opt:
        currentDir = os.path.dirname(os.path.realpath(__file__))
        single_reference = opt["single_reference"]
        paragraphs = pTextractor(currentDir+"/html/"+single_reference+".html")
        for p in paragraphs:
            references.append(p)
        print(len(references))

    input = opt["input"]
    print(input)
    print(references)
    similarity = labels(input, references)
    # similarity = embeddings.similarity(input, references)
    print(similarity)
    embedded_data = []
    for d in range(len(references)):
        embedded_data.append({
            "text": references[similarity[d][0]],
            "embedding": similarity[d][1],
            "index": similarity[d][0]
        })
    # embedded_data = sorted(embedded_data, key=lambda x: x["embedding"], reverse=True)
    # print(embedded_data[0])
    return jsonify(embedded_data)

@api.route('/query', methods=['POST'])
def main4():
    opt = request.form.to_dict()

    print(opt)
    if opt is None:
        return jsonify({"error": "no json data"})
    if "input" not in opt:
        return jsonify({"error": "no text data"})
        
    def question(text):
        return embeddings.search(f"select text, answer, score from txtai where similar('{text}') limit 1")

    input = opt["input"]
    return jsonify(question(input))
@api.route('/teach', methods=['POST'])
def main5():
    opt = request.form.to_dict()

    print(opt)
    if opt is None:
        return jsonify({"error": "no json data"})
    
    if "references" in opt:
        references = opt["references"]
        # splits by |
        references = references.split("|")
    else:
        references = []

    if "single_reference" in opt:
        currentDir = os.path.dirname(os.path.realpath(__file__))
        single_reference = opt["single_reference"]
        paragraphs = pTextractor(currentDir+"/html/"+single_reference+".html")
        for p in paragraphs:
            references.append(p)
        print(len(references))
        
    embeddings.index([(text, text, None) for uid, text in enumerate(references)])
    
    return "ok"

@api.route('/summarize', methods=['POST'])
def main3():
    opt = request.form.to_dict()

    print(opt)
    if opt is None:
        return jsonify({"error": "no json data"})
    if "input" not in opt:
        return jsonify({"error": "no text data"})
    
    input = opt["input"]
    print(input)
    sum = summary(input)
    print(sum)
    return sum

    

@api.after_request
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    header['Access-Control-Allow-Headers'] = '*'
    return response

if __name__ == "__main__":
    embeddings = Embeddings({"path": "sentence-transformers/nli-mpnet-base-v2"})
    labels = Labels()
    summary = Summary()
    extractor = Extractor(embeddings, "distilbert-base-cased-distilled-squad")
    pTextractor = Textractor(paragraphs=True, tika=False)
    print("Model loaded, server running!")
    with torch.no_grad():
        api.run(host='0.0.0.0', port=5016)