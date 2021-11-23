import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import classification_report, plot_confusion_matrix
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
import joblib
import pickle

df = pd.read_csv("./data/label-data.csv")

# min_df -> dưới số này thì ko lấy, max_df -> trên tỉ lệ % này thì ko lấy, max_features -> số lượng từ
tfidf = TfidfVectorizer(min_df=50, max_df=0.8, max_features=40000,
                        sublinear_tf=True)
tfidf.fit(df['review.review'])

X = tfidf.transform(df['review.review'])
y = df['sentiment']
# pickle.dump(tfidf.vocabulary_, open("./model/tfidf_vocab.pkl", "wb"))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=10, shuffle=True)

svm = SVC()
svm.fit(X_train, y_train)
y_pred_svm = svm.predict(X_test)
print("Classification report SVM:\n",
      classification_report(y_test, y_pred_svm))
plot_confusion_matrix(svm, X_test, y_test, display_labels=[
    'Negative', 'Neural', 'Positive'], cmap='Blues', xticks_rotation='vertical')
plt.savefig('./model-figure/confusion_matrix_svm.png',
            dpi=400, bbox_inches='tight')

logisticreg = LogisticRegression()
logisticreg.fit(X_train, y_train)
y_pred_lore = logisticreg.predict(X_test)
print("Classification report Logistic Regression:\n",
      classification_report(y_test, y_pred_lore))
plot_confusion_matrix(logisticreg, X_test, y_test, display_labels=[
                      'Negative', 'Neural', 'Positive'], cmap='Greens', xticks_rotation='vertical')
plt.savefig('./model-figure/confusion_matrix_logistic_regression.png',
            dpi=400, bbox_inches='tight')

decisiontree = DecisionTreeClassifier(
    criterion='gini', random_state=10).fit(X_train, y_train)
y_pred_detr = decisiontree.predict(X_test)
print("Classification report Decision Tree:\n",
      classification_report(y_test, y_pred_detr))
plot_confusion_matrix(decisiontree, X_test, y_test, display_labels=[
                      'Negative', 'Neural', 'Positive'], cmap='Oranges', xticks_rotation='vertical')
plt.savefig('./model-figure/confusion_matrix_decision_tree.png',
            dpi=400, bbox_inches='tight')

randomforest = RandomForestClassifier(
    criterion='gini', random_state=10).fit(X_train, y_train)
y_pred_rafo = randomforest.predict(X_test)
print("Classification report Random Forest:\n",
      classification_report(y_test, y_pred_rafo))
plot_confusion_matrix(randomforest, X_test, y_test, display_labels=[
                      'Negative', 'Neural', 'Positive'], cmap='Reds', xticks_rotation='vertical')
plt.savefig('./model-figure/confusion_matrix_random_forest.png',
            dpi=400, bbox_inches='tight')

# save model
# joblib.dump(randomforest, "./model/random_forest.joblib")
