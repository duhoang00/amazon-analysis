const moment = require('moment');

module.exports = {
    limit: {
        product: 1000,
        reviews: 2000,
    },
    defaultItemLimit: 1,
    reviewFilter: {
        sortBy: {
            recent: 'recent',
            helpful: 'helpful',
        },
        filterByStar: {
            positive: 'positive',
            critical: 'critical',
            1: 'one_star',
            2: 'two_star',
            3: 'three_star',
            4: 'four_star',
            5: 'five_star',
        },
        formatType: {
            all_formats: 'all_formats',
            current_format: 'current_format',
        },
    },
    geo: {
        US: {
            country: 'United States of America',
            currency: 'USD',
            symbol: '$',
            host: 'www.amazon.com',
            variants: {
                split_text: 'Click to select ',
            },
            best_seller: (text) => {
                if (text) {
                    const match = text.match(/(#[\d,|]+) in[\s\n ]([\w&'\s]+)/);
                    if (match) {
                        return { rank: parseInt(match[1].replace(/[^\d]/g, '')), category: match[2].trim() };
                    }
                }
                return '';
            },
            review_date: (date) => {
                const dateRegex = /on (.+)$/.exec(date);
                if (dateRegex) {
                    return {
                        date: dateRegex[1],
                        unix: moment(new Date(`${dateRegex[1]} 02:00:00`))
                            .utc()
                            .unix(),
                    };
                }
                return '';
            },
            price_format: (price) => {
                const formatedPrice = price.replace(/[^\d+\.]/g, '');
                return parseFloat(formatedPrice);
            },
            product_information: {
                id: [
                    '#detailBullets_feature_div > ul',
                    '#productDetails_detailBullets_sections1',
                    '#productDetails_techSpec_section_1',
                    '#productDetails_techSpec_section_2',
                    '#detailBulletsWrapper_feature_div > ul:nth-child(5)',
                ],
                fields: {
                    'Amazon Best Sellers Rank': { key: '', rank: true },
                    'Best-sellers rank': { key: '', rank: true },
                    'Best Sellers Rank': { key: '', rank: true },
                    'Package Dimensions': { key: 'dimensions' },
                    'Product Dimensions': { key: 'dimensions' },
                    'Parcel Dimensions': { key: 'dimensions' },
                    'Item Weight': { key: 'weight' },
                    Manufacturer: { key: 'manufacturer' },
                    'Release date': { key: 'available_from' },
                    'Date First Available': { key: 'available_from' },
                    'Item model number': { key: 'model_number' },
                    Department: { key: 'department' },
                    Language: { key: 'language' },
                    Publisher: { key: 'publisher' },
                    'Reading level': { key: 'reading_level' },
                    'Grade Level': { key: 'grade_level' },
                    Hardcover: { key: 'hardcover' },
                    Paperback: { key: 'paperback' },
                    'ISBN-10': { key: 'ISBN-10' },
                    'ISBN-13': { key: 'ISBN-13' },
                },
            },
        },
    },
};
