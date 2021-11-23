from re import U
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import classification_report
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

df = pd.read_csv("./data/label-data.csv")

# min_df -> dưới số này thì ko lấy, max_df -> trên tỉ lệ % này thì ko lấy, max_features -> số lượng từ
tfidf = TfidfVectorizer(min_df=50, max_df=0.8, max_features=40000,
                        sublinear_tf=True)
tfidf.fit(df['review.review'])

X = tfidf.transform(df['review.review'])
y = df['sentiment']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=10, shuffle=True)

# 81%
svm = SVC()
svm.fit(X_train, y_train)
y_pred_svm = svm.predict(X_test)
print("Classification report SVM:\n",
      classification_report(y_test, y_pred_svm))

# 72%
logisticreg = LogisticRegression()
logisticreg.fit(X_train, y_train)
y_pred_lore = logisticreg.predict(X_test)
print("Classification report Logistic Regression:\n",
      classification_report(y_test, y_pred_lore))

# 79%
decisiontree = DecisionTreeClassifier(
    criterion='gini', random_state=10).fit(X_train, y_train)
y_pred_detr = decisiontree.predict(X_test)
print("Classification report Decision Tree:\n",
      classification_report(y_test, y_pred_detr))

# 82%
randomforest = RandomForestClassifier(
    criterion='gini', random_state=10).fit(X_train, y_train)
y_pred_rafo = randomforest.predict(X_test)
print("Classification report Random Forest:\n",
      classification_report(y_test, y_pred_rafo))
