
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


def sentiment_label(row):
    max_label = "positive"
    max_value = row["pos"]
    if (row["neg"] > max_value):
        max_label = "negative"
        max_value = row["neg"]
    if (row["neu"] > max_value):
        max_label = "neutral"
        max_value = row["neu"]

    return max_label


df = pd.read_csv('./data/10rows_demo_data.csv')

analyzer = SentimentIntensityAnalyzer()

sentiment = df['review.review'].apply(analyzer.polarity_scores)

sentiment_df = pd.DataFrame(sentiment.tolist())


label_df = df.merge(sentiment_df, left_index=True,
                    right_index=True, suffixes=[False, False])

label_df = label_df.drop(columns="compound")

label_df['sentiment'] = label_df.apply(sentiment_label, axis=1)

print("label_df")
print(label_df)

label_df.to_csv("./data/label-data.csv")
