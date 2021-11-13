# Import lib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


def save_figure_missing_value(figureName):
    heat_map_missing_value = sns.heatmap(
        df.isnull(), cbar=False, cmap='viridis')
    figure_missing_value = heat_map_missing_value.get_figure()
    figure_missing_value.savefig(figureName, dpi=400)


DF_COLUMNS = ["review.id", "review.review_data", "review.rating",
              "review.title", "review.verified_purchase", "product.position.page", "product.position.position", "product.position.global_position", "product.asin", "product.keyword", "product.price.discounted", "product.price.current_price", "product.price.currency", "product.price.before_price", "product.price.savings_amount", "product.price.savings_percent", "product.reviews.total_reviews", "product.reviews.rating", "product.url", "product.score", "product.sponsored", "product.amazonChoice", "product.bestSeller", "product.amazonPrime", "product.title", "product.thumbnail"]


# Load dataset
df = pd.read_csv("./data/data-no-cr.csv")


# Check for missing columns names
# print(df.head())

# Check for missing values
# print(df.isnull().sum())

save_figure_missing_value("./eda-figure/figure_missing_value.png")

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

# print("saving eda missing value")
save_figure_missing_value("./eda-figure/figure_NO_missing_value.png")

# Relation
# Scatter - Product rating and price
plt.figure(figsize=(10, 10))
plt.scatter(x="review.rating", y="product.price.current_price", data=df, )
plt.title("Review rating and product price")
plt.xlabel('Rating')
plt.ylabel('Price')
plt.savefig("./eda-figure/Figure_scatter_rating_price.png")

dropped_df = df.drop_duplicates(subset=["product.asin"], keep="first")

print(dropped_df["product.asin"])

# Line - Product price and global position
# plt.figure(figsize=(10, 10))
# plt.plot(dropped_df["product.position.global_position"],
#          dropped_df["product.price.current_price"])
# plt.title("Product global position and price")
# plt.xlabel("Global position")
# plt.ylabel("Price")
# plt.savefig("./eda-figure/Figure_line_position_price.png")

# Bar - Product rating and price
# plt.figure(figsize=(10, 10))
# plt.bar(df["review.rating"], df["product.position.global_position"])
# plt.title("Product rating and global position")
# plt.xlabel('Rating')
# plt.ylabel('Global position')
# plt.savefig("./eda-figure/Figure_bar_rating_global_position.png")
