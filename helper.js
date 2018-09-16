// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

'use strict';

/* CONSTANTS AND GLOBAL VARIABLES */

const {
    dialogflow,
    BasicCard,
    SimpleResponse,
} = require('actions-on-google');

const app = dialogflow({debug: true});
app.middleware(conv => {
    conv.hasScreen =
        conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    conv.hasAudioPlayback =
        conv.surface.capabilities.has('actions.capability.AUDIO_OUTPUT');
});

const SEARCH_API_HOSTNAME = process.env.SEARCH_API_HOSTNAME;
const SEARCH_API_PORT = process.env.SEARCH_API_PORT;
const SEARCH_API_ENDPOINT = process.env.SEARCH_API_ENDPOINT;

const rpn = require('request-promise-native');

const winston = require('winston');
const Logger = winston.Logger;
const Console = winston.transports.Console;
const {LoggingWinston} = require('@google-cloud/logging-winston');
const loggingWinston = new LoggingWinston();
const logger = new Logger({
    level: 'info', // log at 'info' and above
    transports: [
        new Console(),
        loggingWinston,
    ],
});


/* HELPER FUNCTIONS */

module.exports = class Helper {
    /**
     * Returns an collection of ElasticsearchPosts objects based on a topic
     * @param postTopic topic to search for
     * @param responseSize
     * @returns {Promise<any>}
     */
    getPostsByTopic(postTopic, responseSize = 1) {
        return new Promise((resolve, reject) => {
            const SEARCH_API_RESOURCE = `dismax-search?value=${postTopic}&start=0&size=${responseSize}&minScore=1`;
            const SEARCH_API_URL = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE}`;
            logger.info(`getPostsByTopic API URL: ${SEARCH_API_URL}`);

            let options = {
                uri: SEARCH_API_URL,
                json: true
            };

            rpn(options)
                .then(function (posts) {
                    posts = posts.ElasticsearchPosts;
                    logger.info(`getPostsByTopic Posts: ${JSON.stringify(posts)}`);
                    resolve(posts);
                })
                .catch(function (err) {
                    logger.error(`Error: ${err}`);
                    reject(err)
                });
        });
    }

    /**
     * Returns a single result based in the Post ID
     * @param postId ID of the Post to search for
     * @returns {Promise<any>}
     */
    getPostById(postId) {
        return new Promise((resolve, reject) => {
            const SEARCH_API_RESOURCE = `${postId}`;
            const SEARCH_API_URL = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE}`;
            logger.info(`getPostById API URL: ${SEARCH_API_URL}`);

            let options = {
                uri: SEARCH_API_URL,
                json: true
            };

            rpn(options)
                .then(function (post) {
                    post = post.ElasticsearchPosts;
                    logger.info(`getPostById Post: ${JSON.stringify(post)}`);
                    resolve(post);
                })
                .catch(function (err) {
                    logger.error(`Error: ${err}`);
                    reject(err)
                });
        });
    }

    convertDate(dateString) {
        let post_date = new Date(dateString);
        let options = {year: 'numeric', month: 'long', day: 'numeric'};
        return post_date.toLocaleDateString('en-EN', options);
    }

    topicNotFound(conv, postTopic) {
        const NOT_FOUND_TEXT = `Sorry, I can't find any posts for the topic '${postTopic}'`;

        conv.ask(new SimpleResponse({
            speech: NOT_FOUND_TEXT,
            text: NOT_FOUND_TEXT,
        }));

        if (conv.hasScreen) {
            conv.ask(new BasicCard({
                title: `Topic Not Found`,
                text: NOT_FOUND_TEXT,
            }));
        }
    }

    postIdNotFound(conv, postId) {
        const NOT_FOUND_TEXT = `Sorry, I can't find post ID ${postId}'`;

        conv.ask(new SimpleResponse({
            speech: NOT_FOUND_TEXT,
            text: NOT_FOUND_TEXT,
        }));

        if (conv.hasScreen) {
            conv.ask(new BasicCard({
                title: `Post Not Found`,
                text: NOT_FOUND_TEXT,
            }));
        }
    }
};
