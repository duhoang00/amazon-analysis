import csv

# read data from amazon-product-api
with open("../../amazon-product-api/crawl/demo_data.csv") as csvfile:
    spamreader = csv.reader(csvfile, delimiter=" ")
    for row in spamreader:
        print(', '.join(row))
