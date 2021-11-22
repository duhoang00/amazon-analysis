
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

df = pd.read_csv('./data/data-no-cr.csv')
print(df['review.review'])

analyzer = SentimentIntensityAnalyzer()

sentiment = df['review.title'].apply(analyzer.polarity_scores)

sentiment_df = pd.DataFrame(sentiment.tolist())

print(sentiment_df)

sentiment_df.to_csv("test.csv")