import pandas as pd
from stop_words import get_stop_words
from spellchecker import SpellChecker as spell_checker
import string
from nltk.stem import *
import numpy as np
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer  # giai thich thu vien nay

# Initialization
spell = spell_checker()
stop_words = get_stop_words('english')
stemmer = SnowballStemmer("english")
ps = PorterStemmer()

df = pd.read_csv("./data/data-no-cr.csv")

df = df[df["review.title"].notnull()]

df = df[df["review.title"].notna()]

df.fillna(df.mean(), inplace=True)

for label, sentence in df["review.title"].items():
    new_sentence = ""
    # Filter Out Punctuation
    punctuated_sentence = sentence.translate(
        str.maketrans('', '', string.punctuation))
    # Split into words
    arr_sentence = punctuated_sentence.split()
    for word in arr_sentence:
        # Spelling correction
        correct_word = spell.correction(word).lower()

        # Stem word with filter out stop words # NO using stem
        stemed_word = ps.stem(correct_word)

        # Word correction one more time cause stem word library is not that good
        validated_word = spell.correction(correct_word).lower()

        # Filter out stop words one more time
        if not validated_word in stop_words:
            # Remove duplicate word
            if new_sentence.find(validated_word) == -1:
                # validated_word là 1 từ đủ điều kiện để label --> không càn bỏ vô sentence hay update review.title (2 dòng dưới sẽ được sửa)
                new_sentence += validated_word + " "
    df.loc[label, "review.title"] = new_sentence

    print(df['review.title'])

    # giai thich TFidfVectorizer
    tfidf = TfidfVectorizer(min_df=10, max_df=1.0,
                            max_features=40000, sublinear_tf=True)
# min_df -> dưới số này thì ko lấy, max_df -> trên tỉ lệ % này thì ko lấy, max_features -> số lượng từ
tfidf.fit(df['review.title'])
X = tfidf.transform(df['review.title'])

vocab = tfidf.get_feature_names()  # lay ten cac tu
print(vocab[:])

print("Vocabulary length:", len(vocab))  # dem so luong tu

dist = np.sum(X, axis=0)
checking = pd.DataFrame(dist, columns=vocab)  # tao bang

checking  # show bang
