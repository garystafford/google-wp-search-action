// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

'use strict';

/* CONSTANTS AND GLOBAL VARIABLES */

const Request = require("request");

const SEARCH_API_HOSTNAME = process.env.SEARCH_API_HOSTNAME || 'api.chatbotzlabs.com';
const SEARCH_API_PORT = process.env.SEARCH_API_PORT || '80';
const SEARCH_API_ENDPOINT = process.env.SEARCH_API_ENDPOINT || 'blog/api/v1/elastic/';

const SEARCH_API_RESOURCE1 = process.env.SEARCH_API_RESOURCE1 || '';
const SEARCH_API_URL1 = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE1}`;

const SEARCH_API_RESOURCE2 = process.env.SEARCH_API_RESOURCE2 || 'dismax-search?value=azure&start=0&size=10&minScore=1.5';
const SEARCH_API_URL2 = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE2}`;

const SEARCH_API_RESOURCE3 = process.env.SEARCH_API_RESOURCE3 || 'dismax-search/hits?value=azure&minScore=1.5';
const SEARCH_API_URL3 = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE3}`;

console.info(SEARCH_API_URL1);
console.info(SEARCH_API_URL2);
console.info(SEARCH_API_URL3);

let posts = {};

Request.get(SEARCH_API_URL1, (error, response, body) => {
    if (error) {
        return console.dir(error);
    }
    posts = JSON.parse(body);
    posts = posts.ElasticsearchPosts;
    posts.forEach(function (post) {
        console.log(post.post_title);
    });
});

Request.get(SEARCH_API_URL2, (error, response, body) => {
    if (error) {
        return console.dir(error);
    }
    posts = JSON.parse(body);
    posts = posts.ElasticsearchPosts;
    posts.forEach(function (post) {
        console.log(`${post.post_title} (${post._score.toFixed(2)})`);
        let post_date = new Date(post.post_date);
        let options = {year: 'numeric', month: 'long', day: 'numeric'};
        post_date = post_date.toLocaleDateString('en-EN', options);
        console.log(post_date);

    });
});

