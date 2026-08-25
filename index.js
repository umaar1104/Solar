const axios = require("axios");
require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/supportbot-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
app.command("/supportbot-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});
app.command("/supportbot-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text:
`${response.data.setup}

${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});
app.command('/supportbot-help', async ({ ack, body, client, logger }) => {
  await ack();

  try {
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        // Bu ID o'zgarmaydi, shuning uchun app.view qismiga tegmaysiz
        callback_id: 'help_request_modal_submit', 
        title: {
          type: 'plain_text',
          text: 'Support Request'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'topic_block',
            element: {
              type: 'plain_text_input',
              action_id: 'topic_input',
              placeholder: { type: 'plain_text', text: 'e.g., Laptop issue, software access' }
            },
            label: { type: 'plain_text', text: 'Issue Topic' }
          },
          {
            type: 'input',
            block_id: 'urgency_block',
            element: {
              type: 'static_select',
              action_id: 'urgency_input',
              placeholder: { type: 'plain_text', text: 'Select urgency level' },
              options: [
                { text: { type: 'plain_text', text: 'Low - No rush' }, value: 'low' },
                { text: { type: 'plain_text', text: 'Medium - Affects daily tasks' }, value: 'medium' },
                { text: { type: 'plain_text', text: 'High - Blocker / Critical' }, value: 'high' }
              ]
            },
            label: { type: 'plain_text', text: 'Urgency Level' }
          },
          {
            type: 'input',
            block_id: 'details_block',
            element: {
              type: 'plain_text_input',
              multiline: true,
              action_id: 'details_input',
              placeholder: { type: 'plain_text', text: 'Please describe your problem in detail...' }
            },
            label: { type: 'plain_text', text: 'Description' }
          }
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit Ticket'
        },
        close: {
          type: 'plain_text',
          text: 'Cancel'
        }
      }
    });
    logger.info(result);
  } catch (error) {
    logger.error(error);
  }
});
// Kanalga yangi foydalanuvchi qo'shilganda ishlaydigan hodisa (Event)
app.event('member_joined_channel', async ({ event, client, logger }) => {
  try {
    // Guruhga yangi qo'shilgan odamning ID-sini olamiz
    const userId = event.user;
    
    // Yangi odamga bot nomidan to'g'ridan-to'g'ri shaxsiy xabar (DM) yuboramiz
    await client.chat.postMessage({
      channel: userId,
      text: `Welcome to the workspace! 🎉`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hi <@${userId}>! Welcome to our team. 👋\n\nI am the *Support Bot*. If you ever face any technical issues or need help, just type the command below in any channel:`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👉 \`/supportbot-help\``
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'Have a great time here! 🚀'
            }
          ]
        }
      ]
    });

    logger.info(`Welcome message sent to user: ${userId}`);
  } catch (error) {
    logger.error(error);
  }
});