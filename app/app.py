from flask import Flask, request
import joblib
from flask import render_template
from sklearn.feature_extraction.text import TfidfVectorizer, TfidfTransformer, CountVectorizer
import pickle
import pandas as pd
import numpy as np


randomforest = joblib.load("../analysis/model/random_forest.joblib")

app = Flask(__name__)


@app.route("/")
def home():
    return render_template('index.html')


@app.route('/run', methods=['POST', 'GET'])
def data():
    if request.method == 'GET':
        return f"The URL /data is accessed directly. Try going to '/form' to submit form"
    if request.method == 'POST':
        form_data = request.form
        review = form_data.getlist('review')

        transformer = TfidfTransformer()
        vocab = pickle.load(open("../analysis/model/tfidf_vocab.pkl", "rb"))
        loaded_vec = CountVectorizer(
            decode_error="replace", vocabulary=vocab)
        tfidf = transformer.fit_transform(
            loaded_vec.fit_transform(np.array(review)))

        sentiment = randomforest.predict(tfidf)
        result = "Positive"
        if (sentiment == 0):
            result = "Neutral"
        if (sentiment == -1):
            result = "Negative"

        print(result)

        return render_template('index.html', result=result)
