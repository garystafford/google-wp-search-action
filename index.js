// author: Gary A. Stafford
// site: https://programmaticponderings.com
// license: MIT License

'use strict';

/* CONSTANTS AND GLOBAL VARIABLES */

const Helper = require('./helper');
let helper = new Helper();

const {
    dialogflow,
    Button,
    Suggestions,
    BasicCard,
    SimpleResponse,
    List
} = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({debug: true});
app.middleware(conv => {
    conv.hasScreen =
        conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
    conv.hasAudioPlayback =
        conv.surface.capabilities.has('actions.capability.AUDIO_OUTPUT');
});

const SUGGESTION_1 = 'tell me about Docker';
const SUGGESTION_2 = 'help';
const SUGGESTION_3 = 'cancel';

/* INTENT HANDLERS */

app.intent('Welcome Intent', conv => {
    const WELCOME_TEXT_SHORT = 'What topic are you interested in reading about?';
    const WELCOME_TEXT_LONG = `You can say things like:  \n` +
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
    const FACTS_LIST = "Kubernetes, Docker, Cloud, DevOps, AWS, Spring, Azure, Messaging, and GCP";
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

    let posts = await helper.getPostsByTopic(postTopic, 1);

    if (posts !== undefined && posts.length < 1) {
        helper.topicNotFound(conv, postTopic);
        return;
    }

    let post = posts[0];
    let formattedDate = helper.convertDate(post.post_date);
    const POST_SPOKEN = `The top result for '${postTopic}' is the post, '${post.post_title}', published ${formattedDate}, with a relevance score of ${post._score.toFixed(2)}`;
    const POST_TEXT = `Description: ${post.post_excerpt}  \nPublished: ${formattedDate}  \nScore: ${post._score.toFixed(2)}`;

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
    let postCount = 6;
    let posts = await helper.getPostsByTopic(postTopic, postCount);

    if (posts !== undefined && posts.length < 1) {
        helper.topicNotFound(conv, postTopic);
        return;
    }

    const POST_SPOKEN = `Here's a list of the top ${posts.length} posts about '${postTopic}'`;

    conv.ask(new SimpleResponse({
        speech: POST_SPOKEN,
    }));

    let itemsArray = {};

    posts.forEach(function (post) {
        itemsArray[post.ID] = {
            title: `Post ID ${post.ID}`,
            description: `${post.post_title.substring(0,80)}...  \nScore: ${post._score.toFixed(2)}`,
        };
    });

    if (conv.hasScreen) {
        conv.ask(new List({
            title: 'Top Results',
            items: itemsArray
        }));

        conv.ask(new Suggestions([SUGGESTION_1, SUGGESTION_2, SUGGESTION_3]));
    }
});

app.intent('Find By ID Intent', async (conv, {topic}) => {
    let postId = topic.toString();

    let post = await helper.getPostById(postId);

    if (post === undefined) {
        helper.postIdNotFound(conv, postId);
        return;
    }

    let formattedDate = helper.convertDate(post.post_date);
    const POST_SPOKEN = `Okay, I found that post`;
    const POST_TEXT = `Description: ${post.post_excerpt}  \nPublished: ${formattedDate}`;

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

app.intent('Option Intent', async (conv, params, option) => {
    let postId = option.toString();

    let post = await helper.getPostById(postId);

    if (post === undefined) {
        helper.postIdNotFound(conv, postId);
        return;
    }

    let formattedDate = helper.convertDate(post.post_date);
    const POST_SPOKEN = `Sure, here's that post`;
    const POST_TEXT = `Description: ${post.post_excerpt}  \nPublished: ${formattedDate}`;

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


/* ENTRY POINT */

exports.functionBlogSearchAction = functions.https.onRequest(app);
