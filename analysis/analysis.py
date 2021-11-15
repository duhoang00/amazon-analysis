import pandas as pd
from stop_words import get_stop_words
from spellchecker import SpellChecker as spell_checker
import string
from nltk.stem import *
import numpy as np
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize


# Initialization
spell = spell_checker()
stop_words = get_stop_words('english')
stemmer = SnowballStemmer("english")
ps = PorterStemmer()


# Loading data
df = pd.read_csv("../crawler/crawl/10rows_demo_data.csv")

# Remove null
df = df[df["review.title"].notnull()]

# Replace -,?,#,*,etc. with np.nan form
for col in df.columns:
    df[col].replace({'?': np.nan}, inplace=True)

# Take only row if they have review title & review rating & review data & review
df = df[df["review.title"].notna()]
df = df[df["review.review"].notna()]
df = df[df["review.rating"].notna()]
df = df[df["review.review_data"].notna()]

# Replace missing numeric values with mean
df.fillna(df.mean(), inplace=True)

# Correct review title
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

# Review
print(df["review.title"])
