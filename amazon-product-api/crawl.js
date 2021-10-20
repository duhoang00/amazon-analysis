const Crawler = require('./lib/Amazon');
const { geo, defaultItemLimit } = require('./lib/constant');

const INIT_OPTIONS = {
    bulk: true,
    number: defaultItemLimit,
    filetype: '',
    rating: [1, 5],
    page: 1,
    category: '',
    cookie: '',
    asyncTasks: 5,
    sponsored: false,
    category: 'aps',
    cli: false,
    sort: false,
    discount: false,
    reviewFilter: {
        // Sort by recent/top reviews
        sortBy: 'recent',
        // Show only reviews with verified purchase
        verifiedPurchaseOnly: false,
        // Show only reviews with specific rating or positive/critical
        filterByStar: '',
        formatType: 'all_formats',
    },
};

const productCrawlOptions = () => {
    let options = { ...INIT_OPTIONS };
    options.geo = geo['US'];
    options.scrapeType = 'products';
    options.asyncTasks = 1;
    options.keyword = 'xbox-one';
    return options;
};

const reviewCrawlOptions = () => {
    let options = { ...INIT_OPTIONS };
    options.geo = geo['US'];
    options.scrapeType = 'reviews';
    options.asyncTasks = 1;
    options.keyword = 'xbox-one';
    return options;
};

const startCrawler = async () => {
    try {
        // console.log('...Crawling product');
        // const productOptions = productCrawlOptions();
        // console.log(productOptions);
        // const productData = await new Crawler(productOptions).startScraper();
        // console.log(productData);

        console.log('...Crawling reviews');
        const reviewOptions = reviewCrawlOptions();
        console.log(reviewOptions);
        const reviewData = await new Crawler(reviewOptions).startScraper();
        console.log(reviewData);
    } catch (e) {
        console.log(e);
    }
};

startCrawler();
