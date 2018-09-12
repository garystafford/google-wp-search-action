// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

'use strict';

/* CONSTANTS AND GLOBAL VARIABLES */

const {
    dialogflow,
    Suggestions,
    BasicCard,
    SimpleResponse,
    Image,
} = require('actions-on-google');
const Request = require("request");
const functions = require('firebase-functions');
const {createLogger, format, transports} = require('winston');
const app = dialogflow({debug: true});

app.middleware(conv => {
    conv.hasScreen =
        conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    conv.hasAudioPlayback =
        conv.surface.capabilities.has('actions.capability.AUDIO_OUTPUT');
});

// Setup Logging
const logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [
        new transports.Console()
    ]
});

const SUGGESTION_1 = 'tell me about GCP';
const SUGGESTION_2 = 'help';
const SUGGESTION_3 = 'cancel';

const SEARCH_API_HOSTNAME = process.env.SEARCH_API_HOSTNAME || 'api.chatbotzlabs.com';
const SEARCH_API_PORT = process.env.SEARCH_API_PORT || '80';
const SEARCH_API_ENDPOINT = process.env.SEARCH_API_ENDPOINT || 'blog/api/v1/elastic/';

/* INTENT HANDLERS */

app.intent('Welcome Intent', conv => {
    const WELCOME_TEXT_SHORT = 'What post topic are you interested in?';
    const WELCOME_TEXT_LONG = `What post topic are you interested in? ` +
        `You can say things like:  \n` +
        ` _'Find a post about GCP'_  \n` +
        ` _'I'd like to read about Kubernetes'_  \n` +
        ` _'I'm interested in Docker'_`;
    const WELCOME_IMAGE = '192x192-gstafford.png';

    conv.ask(new SimpleResponse({
        speech: WELCOME_TEXT_SHORT,
        text: WELCOME_TEXT_SHORT,
    }));

    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            text: WELCOME_TEXT_LONG,
            title: 'Programmatic Ponderings Search',
            image: new Image({
                url: `${WELCOME_IMAGE}`,
                alt: 'Programmatic Ponderings Search',
            }),
            display: 'WHITE',
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }
});

app.intent('Fallback Intent', conv => {
    const FACTS_LIST = "GCP, AWS, Azure, Kubernetes, Docker, Kafka, PCF";
    const HELP_TEXT_SHORT = 'Need a little help?';
    const HELP_TEXT_LONG = `Some popular topics include: ${FACTS_LIST}.`;
    const HELP_IMAGE = '192x192-gstafford.png';

    conv.ask(new SimpleResponse({
        speech: HELP_TEXT_LONG,
        text: HELP_TEXT_SHORT,
    }));

    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            text: HELP_TEXT_LONG,
            title: 'Programmatic Ponderings Search Help',
            image: new Image({
                url: `${HELP_IMAGE}`,
                alt: 'Programmatic Ponderings Search',
            }),
            display: 'WHITE',
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }
});

app.intent('Find Post Intent', async (conv, {topic}) => {
    let postTopic = topic.toString();

    const SEARCH_API_RESOURCE = `dismax-search?value=${postTopic}&start=0&size=1&minScore=1`;
    const SEARCH_API_URL = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE}`;
    let posts = {};

    Request.get(SEARCH_API_URL, (error, response, body) => {
        if (error) {
            logger.log({
                level: 'error',
                message: `Error: ${error}`
            });
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


    // const AZURE_TEXT_SHORT = `Sure, here's a fact about ${fact.title}`;
    //
    // conv.ask(new SimpleResponse({
    //     speech: fact.response,
    //     text: AZURE_TEXT_SHORT,
    // }));
    //
    // if (conv.hasScreen) {
    //     conv.ask(new BasicCard({
    //         text: fact.response,
    //         title: fact.title,
    //         image: new Image({
    //             url: `${IMAGE_BUCKET}/${fact.image}`,
    //             alt: fact.title,
    //         }),
    //         display: 'WHITE',
    //     }));
    //
    //     conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    // }
});

app.intent('Find Multiple Posts Intent', async (conv, {topic}) => {
    let postTopic = topic.toString();

    const SEARCH_API_RESOURCE = `dismax-search?value=${postTopic}&start=0&size=3&minScore=1`;
    const SEARCH_API_URL = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE}`;
    let posts = {};

    Request.get(SEARCH_API_URL, (error, response, body) => {
        if (error) {
            logger.log({
                level: 'error',
                message: `Error: ${error}`
            });
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


    // const AZURE_TEXT_SHORT = `Sure, here's a fact about ${fact.title}`;
    //
    // conv.ask(new SimpleResponse({
    //     speech: fact.response,
    //     text: AZURE_TEXT_SHORT,
    // }));
    //
    // if (conv.hasScreen) {
    //     conv.ask(new BasicCard({
    //         text: fact.response,
    //         title: fact.title,
    //         image: new Image({
    //             url: `${IMAGE_BUCKET}/${fact.image}`,
    //             alt: fact.title,
    //         }),
    //         display: 'WHITE',
    //     }));
    //
    //     conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    // }
});

/* HELPER FUNCTIONS */

// function buildFactResponse(factToQuery) {
//     return new Promise((resolve, reject) => {
//         if (factToQuery.toString().trim() === 'random') {
//             factToQuery = selectRandomFact();
//         }
//
//         const query = datastore
//             .createQuery('AzureFact')
//             .filter('__key__', '=', datastore.key(['AzureFact', factToQuery]));
//
//         datastore
//             .runQuery(query)
//             .then(results => {
//                 logger.log({
//                     level: 'info',
//                     message: `Entity: ${results[0][0]}`
//                 });
//                 resolve(results[0][0]);
//             })
//             .catch(err => {
//                 logger.log({
//                     level: 'info',
//                     message: `Error: ${err}`
//                 });
//                 reject(`Sorry, I don't know the fact, ${factToQuery}.`);
//             });
//     });
// }


/* ENTRY POINT */

exports.dialogflowBlogSearchFulfillment = functions.https.onRequest(app);
