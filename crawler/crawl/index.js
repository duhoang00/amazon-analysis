const Crawler = require('./crawler');
const { geo, defaultItemLimit } = require('./amazon_us');

const INIT_OPTIONS = {
    bulk: false,
    number: defaultItemLimit,
    filetype: '',
    rating: [1, 5],
    page: 1,
    category: '',
    cookie: '',
    asyncTasks: 1,
    sponsored: false,
    category: 'aps',
    cli: true,
    sort: false,
    discount: false,
    reviewFilter: {
        // Sort by recent/top reviews
        sortBy: 'recent',
        // Show only reviews with verified purchase
        verifiedPurchaseOnly: true,
        // Show only reviews with specific rating or positive/critical
        filterByStar: '',
        formatType: 'all_formats',
    },
    randomUa: true,
    filetype: 'csv',
};

const startCrawler = async () => {
    try {
        const listKeyWords = ['keyboard keychron k1', 'keyboard keychron k2'];

        for (let i = 0; i < listKeyWords.length; i++) {
            let options = { ...INIT_OPTIONS };
            options.geo = geo['US'];
            options.scrapeType = 'products-reviews';
            options.keyword = listKeyWords[i];

            const data = await new Crawler(options).startScraper();
        }
    } catch (e) {
        console.log(e);
    }
};

startCrawler();
