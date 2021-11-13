import pandas as pd
from stop_words import get_stop_words
from spellchecker import SpellChecker as spell_checker
import string
from nltk.stem import *


# Initialization
spell = spell_checker()
stop_words = get_stop_words('english')
stemmer = SnowballStemmer("english")

# Loading data
df = pd.read_csv("../crawler/crawl/data.csv")

# Remove null
df = df[df["review.title"].notnull()]

# Correct review title
for label, sentence in df["review.title"].items():
    new_sentence = ""
    # Filter Out Punctuation
    punctuated_sentence = sentence.translate(
        str.maketrans('', '', string.punctuation))
    # Split into words
    arr_sentence = punctuated_sentence.split()
    for word in arr_sentence:
        # Spelling correctionz
        correct_word = spell.correction(word).lower()
        # Stem word with filter out stop words
        stemed_word = stemmer.stem(correct_word)
        # Word correction one more time cause stem word library is not that good
        validated_word = spell.correction(stemed_word).lower()
        # Filter out stop words one more time
        if not validated_word in stop_words:
            # Remove duplicate word
            if new_sentence.find(validated_word) == -1:
                new_sentence += validated_word + ", "
    df.loc[label, "review.title"] = new_sentence

# Review
print(df["review.title"])
