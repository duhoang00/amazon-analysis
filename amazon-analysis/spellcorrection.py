# https://github.com/barrust/pyspellchecker
from spellchecker import SpellChecker
import pandas as pd

spell = SpellChecker()

# USAGE
# find those words that may be misspelled
# misspelled = spell.unknown(['tabel', 'is', 'hapenning', 'here'])
# for word in misspelled:
# Get the one `most likely` answer
# print(spell.correction(word))
# Get a list of `likely` options
# print(spell.candidates(word))

# Load data
df = pd.read_csv("../amazon-product-api/crawl/10rows_demo_data.csv")
# Validate
df = df[df["review.title"].notnull()]

# Correct review title
for label, sentence in df["review.title"].items():
    new_sentence = ""
    arr_sentence = sentence.split()
    for word in arr_sentence:
        new_sentence += spell.correction(word) + " "
    df.loc[label, "review.title"] = new_sentence
print(df["review.title"])

# Correct review review
for label, sentence in df["review.review"].items():
    new_sentence = ""
    arr_sentence = sentence.split()
    for word in arr_sentence:
        new_sentence += spell.correction(word) + " "
    df.loc[label, "review.review"] = new_sentence
print(df["review.review"])
