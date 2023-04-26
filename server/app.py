from flask import Flask, request, jsonify, render_template
import openai
from openai.embeddings_utils import distances_from_embeddings
from flask_cors import CORS
import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = "xyz**"
openai.api_key = os.environ["OPENAI_API_KEY"]

CORS(app)

conversation = ""
text = ""

df = pd.read_csv('processed/embeddings.csv', index_col=0)
df['embeddings'] = df['embeddings'].apply(eval).apply(np.array)


@app.route('/', methods=["GET"])
def home():
    return render_template('base.html')


@app.route('/predict', methods=["GET", 'POST'])
def predict():
    text = request.get_json().get("message")
    response = answer_question(df, question=text)
    message = {"answer": response}
    return jsonify(message)


def create_context(question, df, max_len=1800, size="ada"):
    """
    Create a context for a question by finding the most similar context from the dataframe
    """

    # Get the embeddings for the question
    q_embeddings = openai.Embedding.create(
        input=question, engine='text-embedding-ada-002')['data'][0]['embedding']

    # Get the distances from the embeddings
    df['distances'] = distances_from_embeddings(
        q_embeddings, df['embeddings'].values, distance_metric='cosine')

    returns = []
    cur_len = 0

    # Sort by distance and add the text to the context until the context is too long
    for i, row in df.sort_values('distances', ascending=True).iterrows():

        # Add the length of the text to the current length
        cur_len += row['n_tokens'] + 4

        # If the context is too long, break
        if cur_len > max_len:
            break

        # Else add it to the text that is being returned
        returns.append(row["text"])

    # Return the context
    return "\n\n###\n\n".join(returns)


def answer_question(
    df,
    # model="text-davinci-003",
    model="gpt-4",
    question="",
    max_len=1800,
    size="ada",
    debug=False,
    max_tokens=5000,
    stop_sequence=None
):
    """
    Answer a question based on the most similar context from the dataframe texts
    """
    context = create_context(
        question,
        df,
        max_len=max_len,
        size=size,
    )
    # If debug, print the raw model response
    if debug:
        print("Context:\n" + context)
        print("\n\n")

    try:
        COMPANY = "Castleberry"
        # prompt = f"You can say hi when the user says hi, be conversational, say thank you and be helpful to the user.\
        #           Be as kind as possible.\nAnswer questions as if you worked at {COMPANY}.\n\n"

        prompt = f"""You are an AI assistant from {COMPANY} providing helpful advice. You have been given information about Castleberry’s products and services.
                    The user will ask you questions and demand requests. 
                    Provide a conversational answer based on the context provided.
                    You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.
                    If you can't find the answer in the context below, just say "Hmm, I'm not sure." Don't try to make up an answer.
                    Respond in the language that the user uses"""

        messages = [
            {"role": "assistant", "content": f"{prompt}"}
        ]
        #conversation = "Context: " + context + '\n\n --- \n\n' + "Question: " + question + "\n\n --- \n\n"
        conversation = "Context: " + context + '\n\n --- \n\n' + "Question: " + question + "\n\n --- \n\n"

        messages.append({"role": "user", "content": conversation})
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.3,
            frequency_penalty=0.1,
            presence_penalty=0,
            top_p=1,
            stop=stop_sequence,
        )
        answer = response["choices"][0]["message"]["content"]
        #conversation += answer
        return answer
    except Exception as e:
        print(e)
        return ""


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
