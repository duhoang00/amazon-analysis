import pandas as pd

# loading data
data = pd.read_csv("../amazon-product-api/crawl/demo_data.csv")
print(data)
print(data["review.id"])
print(data["review.title"])
