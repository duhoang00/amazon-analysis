// @ts-nocheck
const rp = require('request-promise');
const { forEachLimit } = require('async');
const { writeFile } = require('fs');
const { fromCallback } = require('bluebird');
const cheerio = require('cheerio');
const ora = require('ora');
const spinner = ora('Amazon Scraper Started');
const { Parser } = require('json2csv');
const moment = require('moment');
const { SocksProxyAgent } = require('socks-proxy-agent');

const CONST = require('./amazon_us');

class AmazonScraper {
    constructor({
        keyword,
        number,
        sponsored,
        proxy,
        cli,
        filetype,
        scrapeType,
        asin,
        sort,
        discount,
        rating,
        ua,
        timeout,
        randomUa,
        page,
        bulk,
        category,
        cookie,
        geo,
        asyncTasks,
        reviewFilter,
        referer,
        temp_asin,
    }) {
        this.asyncTasks = asyncTasks;
        this.asyncPage = 1;
        this.mainHost = `https://${geo.host}`;
        this.geo = geo;
        this.cookie = cookie;
        this.bulk = bulk;
        this.productSearchCategory = category;
        this.collector = [];
        this.keyword = keyword;
        this.number = parseInt(number, 10);
        this.searchPage = page;
        this.sponsored = sponsored;
        this.proxy = proxy;
        this.cli = cli;
        this.scrapeType = scrapeType;
        this.asin = asin;
        this.sort = sort;
        this.discount = discount;
        this.rating = rating;
        this.minRating = 1;
        this.maxRating = 5;
        this.timeout = timeout;
        this.randomUa = randomUa;
        this.totalProducts = 0;
        this.reviewMetadata = {
            total_reviews: 0,
            stars_stat: {},
        };
        this.referer = referer;
        this.fileType = filetype;
        this.jsonToCsv = new Parser({ flatten: true });
        this.initTime = Date.now();
        this.ua = ua || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36';
        this.reviewFilter = reviewFilter;
        this.temp_asin = temp_asin;
    }

    /**
     * Get user agent
     * if randomUa then user agent version will be randomized, this helps to prevent request blocking from the amazon side
     */
    get userAgent() {
        {
            const os = [
                'Macintosh; Intel Mac OS X 10_15_7',
                'Macintosh; Intel Mac OS X 10_15_5',
                'Macintosh; Intel Mac OS X 10_11_6',
                'Macintosh; Intel Mac OS X 10_6_6',
                'Macintosh; Intel Mac OS X 10_9_5',
                'Macintosh; Intel Mac OS X 10_10_5',
                'Macintosh; Intel Mac OS X 10_7_5',
                'Macintosh; Intel Mac OS X 10_11_3',
                'Macintosh; Intel Mac OS X 10_10_3',
                'Macintosh; Intel Mac OS X 10_6_8',
                'Macintosh; Intel Mac OS X 10_10_2',
                'Macintosh; Intel Mac OS X 10_10_3',
                'Macintosh; Intel Mac OS X 10_11_5',
                'Windows NT 10.0; Win64; x64',
                'Windows NT 10.0; WOW64',
                'Windows NT 10.0',
            ];

            return `Mozilla/5.0 (${os[Math.floor(Math.random() * os.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${
                Math.floor(Math.random() * 3) + 85
            }.0.${Math.floor(Math.random() * 190) + 4100}.${Math.floor(Math.random() * 50) + 140} Safari/537.36`;
        }
    }

    /**
     * Get referer method
     * {this.referer} should an array of referers
     */
    get getReferer() {
        if (Array.isArray(this.referer)) {
            return this.referer[Math.floor(Math.random() * this.referer.length)];
        }

        return '';
    }

    /**
     * Get proxy
     */
    get getProxy() {
        const selectProxy = Array.isArray(this.proxy) && this.proxy.length ? this.proxy[Math.floor(Math.random() * this.proxy.length)] : '';
        if (selectProxy.indexOf('socks4://') > -1 || selectProxy.indexOf('socks5://') > -1) {
            return {
                socks: true,
                proxy: new SocksProxyAgent(selectProxy),
            };
        }
        return {
            socks: false,
            proxy: selectProxy,
        };
    }

    /**
     * Main request method
     * @param {*} param0
     */
    httpRequest({ uri, method, qs, json, body, form }) {
        const proxy = this.getProxy;
        return new Promise(async (resolve, reject) => {
            const options = {
                uri: uri ? `${this.mainHost}/${uri}` : this.mainHost,
                method,
                ...(qs ? { qs } : {}),
                ...(body ? { body } : {}),
                ...(form ? { form } : {}),
                headers: {
                    'user-agent': this.userAgent,
                    cookie: this.cookie,
                    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-encoding': 'gzip, deflate, br',
                    ...(this.getReferer ? { referer: this.getReferer } : {}),
                    ...(Math.round(Math.random()) ? { downlink: Math.floor(Math.random() * 30) + 10 } : {}),
                    ...(Math.round(Math.random()) ? { rtt: Math.floor(Math.random() * 100) + 50 } : {}),
                    ...(Math.round(Math.random()) ? { pragma: 'no-cache' } : {}),
                    ...(Math.round(Math.random()) ? { ect: '4g' } : {}),
                    ...(Math.round(Math.random()) ? { DNT: 1 } : {}),
                },
                strictSSL: false,
                ...(json ? { json: true } : {}),
                gzip: true,
                resolveWithFullResponse: true,
                ...(proxy.proxy && proxy.socks ? { agent: proxy.proxy } : {}),
                ...(proxy.proxy && !proxy.socks ? { proxy: `http://${proxy.proxy}/` } : {}),
            };

            try {
                const response = await rp(options);
                setTimeout(() => {
                    resolve(response);
                }, this.timeout);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Start scraper
     */

    async startScraper() {
        if (this.scrapeType === 'products') {
            this.asyncPage = Math.ceil(this.number / 15);
            if (!this.keyword) {
                throw new Error('Keyword is missing');
            }
            if (this.number > CONST.limit.product) {
                throw new Error(`Wow.... slow down cowboy. Maximum you can get is ${CONST.limit.product} products`);
            }
            if (typeof this.sponsored !== 'boolean') {
                throw new Error('Sponsored can only be {true} or {false}');
            }
        }
        if (this.scrapeType === 'reviews') {
            this.asyncPage = Math.ceil(this.number / 10);
            if (!this.asin) {
                throw new Error('ASIN is missing');
            }
            if (this.number > CONST.limit.reviews) {
                throw new Error(`Wow.... slow down cowboy. Maximum you can get is ${CONST.limit.reviews} reviews`);
            }
        }
        if (this.scrapeType === 'products-reviews') {
            this.asyncPage = Math.ceil(this.number / 20);
            if (!this.keyword) {
                throw new Error('Keyword is missing');
            }
            if (this.number > CONST.limit.product) {
                throw new Error(`Wow.... slow down cowboy. Maximum you can get is ${CONST.limit.product} products`);
            }
            if (this.number > CONST.limit.reviews) {
                throw new Error(`Wow.... slow down cowboy. Maximum you can get is ${CONST.limit.reviews} reviews`);
            }
            if (typeof this.sponsored !== 'boolean') {
                throw new Error('Sponsored can only be {true} or {false}');
            }
        }
        if (!Array.isArray(this.rating)) {
            throw new Error('rating can only be an array with length of 2');
        }

        if (this.rating.length > 2) {
            throw new Error('rating can only be an array with length of 2');
        }

        if (!parseFloat(this.rating[0]) || !parseFloat(this.rating[1])) {
            throw new Error('rating can only contain 2 float values');
        }

        this.minRating = parseFloat(this.rating[0]);

        this.maxRating = parseFloat(this.rating[1]);

        if (this.minRating > this.maxRating) {
            throw new Error(`min rating can't be larger then max rating`);
        }
        if (this.cli) {
            spinner.start();
        }

        await this.mainLoop();

        this.sortAndFilterResult();

        await this.saveResultToFile();

        if (this.cli) {
            spinner.stop();
        }
        if (this.fileType && this.cli) {
            console.log(`Result was saved to: ${this.fileName}`);
        }
        return {
            ...(this.scrapeType === 'products' ? { totalProducts: this.totalProducts, category: this.productSearchCategory } : {}),
            ...(this.scrapeType === 'reviews' ? { ...this.reviewMetadata } : {}),
            ...(this.scrapeType === 'products-reviews'
                ? { totalProducts: this.totalProducts, category: this.productSearchCategory, ...this.reviewMetadata }
                : {}),
            result: this.collector,
        };
    }

    /**
     * Main loop that collects data
     */
    async mainLoop() {
        console.log('\n -running main loop');
        return new Promise((resolve, reject) => {
            forEachLimit(
                Array.from({ length: this.asyncPage }, (_, k) => k + 1),
                this.asyncTasks,
                async (item) => {
                    const body = await this.buildRequest(this.bulk ? item : this.searchPage);
                    if (this.scrapeType === 'asin') {
                        this.grapAsinDetails(body);
                        throw new Error('Done');
                    }
                    if (this.scrapeType === 'products') {
                        let totalResultCount = body.match(/"totalResultCount":\w+(.[0-9])/gm);

                        if (totalResultCount) {
                            this.totalProducts = totalResultCount[0].split('totalResultCount":')[1];
                        }
                        this.grabProduct(body, item);
                    }
                    if (this.scrapeType === 'reviews') {
                        this.grabReviews(body);
                    }
                    if (this.scrapeType === 'products-reviews') {
                        console.log('\n scrape products-reviews');
                        const productsBody = await this.buildProductsRequest(this.bulk ? item : this.searchPage);
                        this.grabProductsReviews(productsBody, item);
                    }
                    if (!this.bulk) {
                        throw new Error('Done');
                    }
                },
                (err) => {
                    if (err && err.message != 'Done') reject(err);
                    resolve();
                },
            );
        });
    }

    /**
     * Get filename
     */
    get fileName() {
        switch (this.scrapeType) {
            case 'products':
                return `${this.scrapeType}(${this.keyword})_${this.initTime}`;
            case 'reviews':
            case 'asin':
                return `${this.scrapeType}(${this.asin})_${this.initTime}`;
            case 'products-reviews':
                return `${this.scrapeType}_${this.initTime}`;
            default:
                throw new Error(`Unknow scraping type: ${this.scrapeType}`);
        }
    }
    /**
     * Save results to the file
     */
    async saveResultToFile() {
        if (this.collector.length) {
            switch (this.fileType) {
                case 'json':
                    await fromCallback((cb) => writeFile(`${this.fileName}.json`, JSON.stringify(this.collector), cb));
                    break;
                case 'csv':
                    await fromCallback((cb) => writeFile(`${this.fileName}.csv`, this.jsonToCsv.parse(this.collector), cb));
                    break;
                case 'all':
                    await Promise.all([
                        await fromCallback((cb) => writeFile(`${this.fileName}.json`, JSON.stringify(this.collector), cb)),
                        await fromCallback((cb) => writeFile(`${this.fileName}.csv`, this.jsonToCsv.parse(this.collector), cb)),
                    ]);
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * Sort and filet the result data
     */
    sortAndFilterResult() {
        if (this.scrapeType === 'reviews') {
            if (this.sort) {
                this.collector.sort((a, b) => b.rating - a.rating);
            }
        }
        if (this.scrapeType === 'products' || this.scrapeType === 'products-reviews') {
            this.collector.sort((a, b) => a.position.global_position - b.position.global_position);
            this.collector.forEach((item, index) => {
                item.position.global_position = index += 1;
            });

            if (this.sort) {
                this.collector.sort((a, b) => b.score - a.score);
            }
            if (this.discount) {
                this.collector = this.collector.filter((item) => item.discounted);
            }
            if (this.sponsored) {
                this.collector = this.collector.filter((item) => item.sponsored);
            }
        }
        if (this.scrapeType === 'products' || this.scrapeType === 'reviews') {
            this.collector = this.collector.filter((item) => this.validateRating(item));
        }
    }

    get setRequestEndpoint() {
        switch (this.scrapeType) {
            case 'products':
                return 's';
            case 'reviews':
                return `product-reviews/${this.asin}/ref=cm_cr_arp_d_viewopt_srt?formatType=${
                    CONST.reviewFilter.formatType[this.reviewFilter.formatType]
                }&sortBy=${CONST.reviewFilter.sortBy[this.reviewFilter.sortBy] ? CONST.reviewFilter.sortBy[this.reviewFilter.sortBy] : ''}${
                    this.reviewFilter.verifiedPurchaseOnly ? '&reviewerType=avp_only_reviews' : ''
                }${this.reviewFilter.filterByStar ? `&filterByStar=${CONST.reviewFilter.filterByStar[this.reviewFilter.filterByStar]}` : ''}`;
            case 'asin':
                return `dp/${this.asin}/ref=sspa_dk_detail_3&th=1&psc=1?th=1&psc=1`;
            default:
                return '';
        }
    }

    get setRequestProductEndpoint() {
        return 's';
    }

    get setRequestReviewEndpoint() {
        return `product-reviews/${this.temp_asin}/ref=cm_cr_arp_d_viewopt_srt?formatType=${
            CONST.reviewFilter.formatType[this.reviewFilter.formatType]
        }&sortBy=${CONST.reviewFilter.sortBy[this.reviewFilter.sortBy] ? CONST.reviewFilter.sortBy[this.reviewFilter.sortBy] : ''}${
            this.reviewFilter.verifiedPurchaseOnly ? '&reviewerType=avp_only_reviews' : ''
        }${this.reviewFilter.filterByStar ? `&filterByStar=${CONST.reviewFilter.filterByStar[this.reviewFilter.filterByStar]}` : ''}`;
    }

    /**
     * Create request
     */
    async buildRequest(page) {
        const options = {
            method: 'GET',
            uri: this.setRequestEndpoint,
            qs: {
                ...(this.scrapeType === 'products'
                    ? {
                          k: this.keyword,
                          ...(this.productSearchCategory ? { i: this.productSearchCategory } : {}),
                          ...(page > 1 ? { page, ref: `sr_pg_${page}` } : {}),
                      }
                    : {}),
                ...(this.scrapeType === 'reviews' ? { ...(page > 1 ? { pageNumber: page } : {}) } : {}),
            },
        };

        try {
            const response = await this.httpRequest(options);
            return response.body;
        } catch (error) {
            throw error.message;
        }
    }

    async buildProductsRequest(page) {
        console.log('buildProductsRequest');
        const options = {
            method: 'GET',
            uri: this.setRequestProductEndpoint,
            qs: {
                ...(this.scrapeType === 'products-reviews'
                    ? {
                          k: this.keyword,
                          ...(this.productSearchCategory ? { i: this.productSearchCategory } : {}),
                          ...(page > 1 ? { page, ref: `sr_pg_${page}` } : {}),
                      }
                    : {}),
                ...{},
            },
        };

        try {
            const response = await this.httpRequest(options);
            return response.body;
        } catch (error) {
            throw error.message;
        }
    }

    async buildReviewsRequest(page) {
        const options = {
            method: 'GET',
            uri: this.setRequestReviewEndpoint,
            qs: {
                ...(this.scrapeType === 'products-reviews' ? { ...(page > 1 ? { pageNumber: page } : {}) } : {}),
                ...{},
            },
        };

        try {
            const response = await this.httpRequest(options);
            return response.body;
        } catch (error) {
            throw error.message;
        }
    }

    /**
     * Collect products from html response then collect reviews of each product(asin)
     * @param {*} body
     */
    grabProductsReviews(productsBody, p) {
        console.log('\n grabProductsReviews');
        const $ = cheerio.load(productsBody.replace(/\s\s+/g, '').replace(/\n/g, ''));
        let productList = $('div[data-index]');
        const scrapingResult = {};

        console.log(`productList length ${productList.length}`);

        let position = 0;
        for (let i = 0; i < productList.length; i++) {
            if (this.cli) {
                spinner.text = `Found ${this.collector.length + productList.length} products`;
            }

            const asin = productList[i].attribs['data-asin'];

            if (!asin) {
                continue;
            }

            console.log(`asin: ${asin}`);

            scrapingResult[asin] = {
                position: {
                    page: p,
                    position: (position += 1),
                    global_position: `${p}${i}`,
                },
                asin,
                price: {
                    discounted: false,
                    current_price: 0,
                    currency: this.geo.currency,
                    before_price: 0,
                    savings_amount: 0,
                    savings_percent: 0,
                },
                reviews: {
                    total_reviews: 0,
                    rating: 0,
                },
                review: {
                    id: '',
                    review_data: '',
                    rating: '',
                    title: '',
                    review: '',
                },
                url: `${this.mainHost}/dp/${asin}`,
                score: 0,
                sponsored: false,
                amazonChoice: false,
                bestSeller: false,
                amazonPrime: false,
            };
        }

        for (let key in scrapingResult) {
            try {
                const priceSearch = $(`div[data-asin=${key}] span[data-a-size="l"]`)[0] || $(`div[data-asin=${key}] span[data-a-size="m"]`)[0];
                const discountSearch = $(`div[data-asin=${key}] span[data-a-strike="true"]`)[0];
                const ratingSearch = $(`div[data-asin=${key}] .a-icon-star-small`)[0];
                const titleThumbnailSearch = $(`div[data-asin=${key}] [data-image-source-density="1"]`)[0];
                const amazonChoice = $(`div[data-asin=${key}] span[id="${key}-amazons-choice"]`).text();
                const bestSeller = $(`div[data-asin=${key}] span[id="${key}-best-seller"]`).text();
                const amazonPrime = $(`div[data-asin=${key}] .s-prime`)[0];

                if (priceSearch) {
                    scrapingResult[key].price.current_price = this.geo.price_format($(priceSearch.children[0]).text());
                }

                if (amazonChoice) {
                    scrapingResult[key].amazonChoice = true;
                }
                if (bestSeller) {
                    scrapingResult[key].bestSeller = true;
                }
                if (amazonPrime) {
                    scrapingResult[key].amazonPrime = true;
                }

                if (discountSearch) {
                    scrapingResult[key].price.before_price = this.geo.price_format($(discountSearch.children[0]).text());

                    scrapingResult[key].price.discounted = true;

                    const savings = scrapingResult[key].price.before_price - scrapingResult[key].price.current_price;
                    if (savings <= 0) {
                        scrapingResult[key].price.discounted = false;

                        scrapingResult[key].price.before_price = 0;
                    } else {
                        scrapingResult[key].price.savings_amount = +(
                            scrapingResult[key].price.before_price - scrapingResult[key].price.current_price
                        ).toFixed(2);
                        scrapingResult[key].price.savings_percent = +(
                            (100 / scrapingResult[key].price.before_price) *
                            scrapingResult[key].price.savings_amount
                        ).toFixed(2);
                    }
                }

                if (ratingSearch) {
                    scrapingResult[key].reviews.rating = parseFloat(ratingSearch.children[0].children[0].data);

                    scrapingResult[key].reviews.total_reviews = parseInt(
                        ratingSearch.parent.parent.parent.next.attribs['aria-label'].replace(/\,/g, ''),
                    );

                    scrapingResult[key].score = parseFloat(scrapingResult[key].reviews.rating * scrapingResult[key].reviews.total_reviews).toFixed(2);
                }

                if (titleThumbnailSearch) {
                    scrapingResult[key].title = titleThumbnailSearch.attribs.alt;

                    scrapingResult[key].thumbnail = titleThumbnailSearch.attribs.src;
                }
            } catch (err) {
                continue;
            }
        }

        for (let key in scrapingResult) {
            this.collector.push(scrapingResult[key]);
        }
        if (productList.length < 10) {
            throw new Error('No more products');
        }
        return;
    }

    /**
     * Collect reviews from the html response
     * @param {} body
     */
    grabReviews(body) {
        const $ = cheerio.load(body.replace(/\s\s+/g, '').replace(/\n/g, ''));

        /**
         * Get star and star percentage
         */
        const reviewListStat = $('#histogramTable > tbody')[0];
        try {
            reviewListStat.children.forEach((item) => {
                const star = parseInt($(item.children[0]).text(), 10);
                const percentage = $(item.children[2]).text();
                this.reviewMetadata.stars_stat[star] = percentage;
            });
        } catch {
            return;
        }

        /**
         * Get total number of reviews
         */
        this.reviewMetadata.total_reviews = parseInt($('.averageStarRatingNumerical').text(), 10);

        const reviewsList = $('#cm_cr-review_list')[0].children;
        let scrapingResult = {};
        for (let i = 0; i < reviewsList.length; i++) {
            const totalInResult = Object.keys(scrapingResult).length + this.collector.length;
            if (totalInResult >= this.number && this.bulk) {
                break;
            }
            const reviewId = reviewsList[i].attribs['id'];
            if (!reviewId) {
                continue;
            }
            scrapingResult[reviewId] = { id: reviewId };
        }

        /**
         * Review date
         */
        for (let key in scrapingResult) {
            const search = $(`#${key} [data-hook="review-date"]`);

            scrapingResult[key].asin = {
                original: this.asin,
                variant: '',
            };
            try {
                scrapingResult[key].review_data = search[0].children[0].data;
                if (scrapingResult[key].review_data) {
                    scrapingResult[key].date = this.geo.review_date(scrapingResult[key].review_data);
                }
            } catch (error) {
                continue;
            }
        }

        /**
         * If product has more then one variant and {formatType} is set to {all_formats} then some reviews can be written for specific variants(ASIN)
         * We can extract those ASIN id's
         */
        for (let key in scrapingResult) {
            const search = $(`#${key} div.a-row.a-spacing-mini.review-data.review-format-strip > a`);

            try {
                const url = search[0].attribs.href;
                const asinRegex = /product-reviews\/(\w+)\//.exec(url);
                if (asinRegex) {
                    scrapingResult[key].asin.variant = asinRegex[1];
                }
            } catch (error) {
                continue;
            }
        }

        /**
         * Reviewer name
         */
        for (let key in scrapingResult) {
            const search = $(`#${key} .a-profile-name`);

            try {
                scrapingResult[key].name = search[0].children[0].data;
            } catch (error) {
                continue;
            }
        }

        /**
         * Rating
         */
        for (let key in scrapingResult) {
            const search = $(`#${key} [data-hook="review-star-rating"]`);

            try {
                scrapingResult[key].rating = parseFloat(search[0].children[0].children[0].data.split(' ')[0]);
            } catch (error) {
                continue;
            }
        }

        /**
         * Review title
         */
        for (let key in scrapingResult) {
            const search = $(`#${key} [data-hook="review-title"]`);

            try {
                scrapingResult[key].title = $(search[0]).text().toString();
            } catch (error) {
                continue;
            }
        }

        /**
         * Review text
         */
        for (let key in scrapingResult) {
            const search = $(`#${key} [data-hook="review-body"]`);

            try {
                scrapingResult[key].review = $(search[0]).text();
            } catch (error) {
                continue;
            }
        }

        /**
         * If purchase is verified
         */
        for (let key in scrapingResult) {
            const search = $(`#${key} [data-reftag="cm_cr_arp_d_rvw_rvwer"]`);
            scrapingResult[key].verified_purchase = false;

            try {
                scrapingResult[key].verified_purchase = !!search[0];
            } catch (error) {
                continue;
            }
        }

        for (let key in scrapingResult) {
            this.collector.push(scrapingResult[key]);
        }
    }

    /**
     * Collect products from html response
     * @param {*} body
     */
    grabProduct(body, p) {
        const $ = cheerio.load(body.replace(/\s\s+/g, '').replace(/\n/g, ''));
        let productList = $('div[data-index]');
        const scrapingResult = {};

        let position = 0;
        for (let i = 0; i < productList.length; i++) {
            if (this.cli) {
                spinner.text = `Found ${this.collector.length + productList.length} products`;
            }

            const asin = productList[i].attribs['data-asin'];

            if (!asin) {
                continue;
            }

            scrapingResult[asin] = {
                position: {
                    page: p,
                    position: (position += 1),
                    global_position: `${p}${i}`,
                },
                asin,
                price: {
                    discounted: false,
                    current_price: 0,
                    currency: this.geo.currency,
                    before_price: 0,
                    savings_amount: 0,
                    savings_percent: 0,
                },
                reviews: {
                    total_reviews: 0,
                    rating: 0,
                },
                url: `${this.mainHost}/dp/${asin}`,
                score: 0,
                sponsored: false,
                amazonChoice: false,
                bestSeller: false,
                amazonPrime: false,
            };
        }

        for (let key in scrapingResult) {
            try {
                const priceSearch = $(`div[data-asin=${key}] span[data-a-size="l"]`)[0] || $(`div[data-asin=${key}] span[data-a-size="m"]`)[0];
                const discountSearch = $(`div[data-asin=${key}] span[data-a-strike="true"]`)[0];
                const ratingSearch = $(`div[data-asin=${key}] .a-icon-star-small`)[0];
                const titleThumbnailSearch = $(`div[data-asin=${key}] [data-image-source-density="1"]`)[0];
                const amazonChoice = $(`div[data-asin=${key}] span[id="${key}-amazons-choice"]`).text();
                const bestSeller = $(`div[data-asin=${key}] span[id="${key}-best-seller"]`).text();
                const amazonPrime = $(`div[data-asin=${key}] .s-prime`)[0];

                if (priceSearch) {
                    scrapingResult[key].price.current_price = this.geo.price_format($(priceSearch.children[0]).text());
                }

                if (amazonChoice) {
                    scrapingResult[key].amazonChoice = true;
                }
                if (bestSeller) {
                    scrapingResult[key].bestSeller = true;
                }
                if (amazonPrime) {
                    scrapingResult[key].amazonPrime = true;
                }

                if (discountSearch) {
                    scrapingResult[key].price.before_price = this.geo.price_format($(discountSearch.children[0]).text());

                    scrapingResult[key].price.discounted = true;

                    const savings = scrapingResult[key].price.before_price - scrapingResult[key].price.current_price;
                    if (savings <= 0) {
                        scrapingResult[key].price.discounted = false;

                        scrapingResult[key].price.before_price = 0;
                    } else {
                        scrapingResult[key].price.savings_amount = +(
                            scrapingResult[key].price.before_price - scrapingResult[key].price.current_price
                        ).toFixed(2);
                        scrapingResult[key].price.savings_percent = +(
                            (100 / scrapingResult[key].price.before_price) *
                            scrapingResult[key].price.savings_amount
                        ).toFixed(2);
                    }
                }

                if (ratingSearch) {
                    scrapingResult[key].reviews.rating = parseFloat(ratingSearch.children[0].children[0].data);

                    scrapingResult[key].reviews.total_reviews = parseInt(
                        ratingSearch.parent.parent.parent.next.attribs['aria-label'].replace(/\,/g, ''),
                    );

                    scrapingResult[key].score = parseFloat(scrapingResult[key].reviews.rating * scrapingResult[key].reviews.total_reviews).toFixed(2);
                }

                if (titleThumbnailSearch) {
                    scrapingResult[key].title = titleThumbnailSearch.attribs.alt;

                    scrapingResult[key].thumbnail = titleThumbnailSearch.attribs.src;
                }
            } catch (err) {
                continue;
            }
        }

        for (let key in scrapingResult) {
            this.collector.push(scrapingResult[key]);
        }
        if (productList.length < 10) {
            throw new Error('No more products');
        }
        return;
    }

    /**
     * Filter reviews/products by required rating
     * @param {*} item
     */
    validateRating(item) {
        if (this.scrapeType === 'products') {
            if (item.reviews.rating >= this.minRating && item.reviews.rating <= this.maxRating) {
                return item;
            }
        }
        if (this.scrapeType === 'reviews') {
            if (item.rating >= this.minRating && item.rating <= this.maxRating) {
                return item;
            }
        }
        return false;
    }

    /**
     * Extract product category/subcategory
     * @param {*} $
     */
    extractProductCategories($) {
        const categories = [];
        const cateogriesss = $('#wayfinding-breadcrumbs_feature_div > ul')[0];
        if (cateogriesss && cateogriesss.children) {
            cateogriesss.children.forEach((item) => {
                try {
                    if (!item.attribs.class) {
                        const url = `${this.mainHost}${item.children[0].children[0].attribs.href}`;
                        const category = item.children[0].children[0].children[0].data;
                        categories.push({
                            category,
                            url,
                        });
                    }
                } catch {
                    // continue regardless of error
                }
            });
        }
        return categories;
    }

    async extractCategories() {
        const body = await this.buildRequest();
        const $ = cheerio.load(body.replace(/\s\s+/g, '').replace(/\n/g, ''));
        const categorySelect = $('#searchDropdownBox')[0];

        if (!Array.isArray(categorySelect.children)) {
            throw new Error("Can't find category selector");
        }

        let categories = {};
        for (let select of categorySelect.children) {
            const category = select.attribs.value.split('search-alias=')[1];
            categories[category] = {
                name: select.children[0].data,
                category,
            };
        }

        return categories;
    }
}

module.exports = AmazonScraper;
