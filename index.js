// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

'use strict';

/* CONSTANTS AND GLOBAL VARIABLES */

const {
    dialogflow,
    Button,
    Suggestions,
    BasicCard,
    SimpleResponse,
    List
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

const SUGGESTION_1 = 'tell me about kubernetes';
const SUGGESTION_2 = 'help';
const SUGGESTION_3 = 'cancel';

const SEARCH_API_HOSTNAME = process.env.SEARCH_API_HOSTNAME;
const SEARCH_API_PORT = process.env.SEARCH_API_PORT;
const SEARCH_API_ENDPOINT = process.env.SEARCH_API_ENDPOINT;

/* INTENT HANDLERS */

app.intent('Welcome Intent', conv => {
    const WELCOME_TEXT_SHORT = 'What post topic are you interested in?';
    const WELCOME_TEXT_LONG = `What post topic are you interested in? ` +
        `You can say things like:  \n` +
        ` _'Find a post about GCP'_  \n` +
        ` _'I'd like to read about Kubernetes'_  \n` +
        ` _'I'm interested in Docker'_`;

    conv.ask(new SimpleResponse({
        speech: WELCOME_TEXT_SHORT,
        text: WELCOME_TEXT_SHORT,
    }));

    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            text: WELCOME_TEXT_LONG,
            title: 'Programmatic Ponderings Search',
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }
});

app.intent('Fallback Intent', conv => {
    const FACTS_LIST = "GCP, AWS, Azure, Kubernetes, Docker, Kafka, PCF";
    const HELP_TEXT_SHORT = 'Need a little help?';
    const HELP_TEXT_LONG = `Some popular topics include: ${FACTS_LIST}.`;

    conv.ask(new SimpleResponse({
        speech: HELP_TEXT_LONG,
        text: HELP_TEXT_SHORT,
    }));

    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            text: HELP_TEXT_LONG,
            title: 'Programmatic Ponderings Search Help',
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }
});

app.intent('Find Post Intent', async (conv, {topic}) => {
    let postTopic = topic.toString();

    let posts = await getsPosts(postTopic, 1);

    if (posts === undefined) {
        topicNotFound(conv, postTopic);
        return;
    }

    let post = posts[0];
    let formattedDate = convertDate(post.post_date);
    const POST_SPOKEN = `The top result for '${postTopic}' is the post, '${post.post_title}', published ${formattedDate}`;
    const POST_TEXT = `_'${post.post_excerpt}'_   \nPublished: ${formattedDate}`;

    conv.ask(new SimpleResponse({
        speech: POST_SPOKEN,
        text: post.title,
    }));

    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            title: post.post_title,
            text: POST_TEXT,
            buttons: new Button({
                title: `Read Post`,
                url: post.guid,

            }),
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }
});

app.intent('Find Multiple Posts Intent', async (conv, {topic}) => {
    let postTopic = topic.toString();

    let posts = await getsPosts(postTopic, 5);

    if (posts === undefined) {
        topicNotFound(conv, postTopic);
        return;
    }

    let post = posts[0];
    let formattedDate = convertDate(post.post_date);
    const POST_SPOKEN = `The top result for '${postTopic}' is the post, '${post.post_title}', published ${formattedDate}`;

    conv.ask(new SimpleResponse({
        speech: POST_SPOKEN,
        text: post.title,
    }));

    let itemsArray = {};

    posts.forEach(function (post) {
        itemsArray[post.ID] = {
            title: post.ID.toString(),
            description: post.post_title,
        };
    });

    console.info(itemsArray.toString());

    if (conv.hasScreen) {
        conv.ask(new List({
            title: 'Top Results',
            items: itemsArray
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }
});

app.intent('actions.intent.OPTION', (conv, params, option) => {
    let response = 'You did not select any item';
    if (option) {
        response = option;
    }
    conv.ask(new SimpleResponse({
        speech: response,
        text: response,
    }));
});


/* HELPER FUNCTIONS */

function getsPosts(postTopic, responseSize = 1) {
    return new Promise((resolve, reject) => {

        const SEARCH_API_RESOURCE = `dismax-search?value=${postTopic}&start=0&size=${responseSize}&minScore=1`;
        const SEARCH_API_URL = `http://${SEARCH_API_HOSTNAME}:${SEARCH_API_PORT}/${SEARCH_API_ENDPOINT}/${SEARCH_API_RESOURCE}`;

        let posts = {};

        Request.get(SEARCH_API_URL, (error, response, body) => {
            if (error) {
                logger.log({
                    level: 'error',
                    message: `Error: ${error}`
                });
                reject(`Sorry, I don't know the topic, ${postTopic}.`)
            }
            posts = JSON.parse(body);
            posts = posts.ElasticsearchPosts;
            resolve(posts);
        });
    });
}

function convertDate(dateString) {
    let post_date = new Date(dateString);
    let options = {year: 'numeric', month: 'long', day: 'numeric'};
    return post_date.toLocaleDateString('en-EN', options);
}

function topicNotFound(conv, postTopic) {
    const NOT_FOUND_TEXT = `Sorry, I cannot find any posts for the topic '${postTopic}'`;

    conv.ask(new SimpleResponse({
        speech: NOT_FOUND_TEXT,
        text: NOT_FOUND_TEXT,
    }));

    if (conv.hasScreen) {
        conv.ask(new BasicCard({
            title: `Topic Not Found`,
            text: NOT_FOUND_TEXT,
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }

}


/* ENTRY POINT */

exports.functionBlogSearchAction = functions.https.onRequest(app);
