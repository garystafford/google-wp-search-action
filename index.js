// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

'use strict';

/* CONSTANTS AND GLOBAL VARIABLES */

const Request = require("request");

const SEARCH_API_HOSTNAME = process.env.SEARCH_API_HOSTNAME || 'api.chatbotzlabs.com';
const SEARCH_API_PORT = process.env.SEARCH_API_PORT || '80';

const SEARCH_API_ENDPOINT1 = process.env.SEARCH_API_ENDPOINT1 || 'blog/api/v1/elastic/';
const SEARCH_API_URL1 = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT1}/`;

const SEARCH_API_ENDPOINT2 = process.env.SEARCH_API_ENDPOINT2 || 'blog/api/v1/elastic/dismax-search?value=gke&size=1';
const SEARCH_API_URL2 = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT2}`;

console.info(SEARCH_API_URL2);

let posts = {};

Request.get(SEARCH_API_URL1, (error, response, body) => {
    if(error) {
        return console.dir(error);
    }
    posts = JSON.parse(body);
    posts = posts.ElasticsearchPosts;
    posts.forEach(function(post) {
        console.log(post.post_title);
    });
});

Request.get(SEARCH_API_URL2, (error, response, body) => {
    if(error) {
        return console.dir(error);
    }
    posts = JSON.parse(body);
    posts = posts.ElasticsearchPosts;
    posts.forEach(function(post) {
        console.log(`${post.post_title} (${post._score.toFixed(2)})`);
    });
});

