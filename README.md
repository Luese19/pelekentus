![CD'sFUSION Team Banner](https://i.ibb.co/K0ZSt89/XaviaFCB.png)

# CD'sFUSION Team

CD'sFUSION Team is a Telegram bot built for IT and Audio-Visual operations.
It uses the official Telegram Bot API and requires only a Telegram bot token.

![illustration](https://i.ibb.co/5MCXJkX/309961956-852941662506289-2438726751602905775-n.png)

<hr />

## Requirements

• [NodeJS](https://nodejs.org/en/) v16.x

## Installation

• [Install CD'sFUSION Team bot on Replit](https://www.youtube.com/watch?v=WUva_shyMqM)

• Import to [Replit](https://replit.com/github/XaviaTeam/XaviaBot) / [Glitch](https://glitch.com/edit/#!/import/github/XaviaTeam/XaviaBot)

**OR**

• Download Zip or Clone Project using

```bash
git clone https://github.com/XaviaTeam/XaviaBot.git
```

• Move to xavia directory

```bash
cd xavia
```

• Install dependencies and run the Telegram bot

```bash
npm install
npm start
```

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy its token.
2. Copy `.env.example` to `.env`, then set `TELEGRAM_BOT_TOKEN` in `.env`.
3. Start the Telegram runtime:

```bash
npm run start
```

The bot uses long polling by default. To use a webhook, set
`TELEGRAM_WEBHOOK_URL`; the bot token must still be provided. Commands keep the
configured `/` prefix and group permissions are mapped to Telegram
administrators.

#### Render test deployment

The repository includes a Render Blueprint in `render.yaml` for a separate
Telegram background worker named `cdsfusion-telegram-test`. Create a test Git
branch, push it to the repository, then create a Render Blueprint from that
branch. Set `TELEGRAM_BOT_TOKEN` as a secret environment variable in Render.
Keep only one bot instance running for a token; do not run the same token
locally while the Render worker is active.

#### Work-hours logging

In a work group, send a photo with the exact caption `In` to clock in and
another photo captioned `Out` to clock out. The bot calculates total, regular,
and overtime hours using `WORK_SHIFT_START`, `WORK_SHIFT_END`,
`WORK_BREAK_MINUTES`, and `timezone` from `config/config.main.json`.

Before clocking in, create your employee profile:

```text
/profile set John|IT|Technician|direct|hour|800
/profile view
```

Allowed employment types are `direct`, `agency`, and `oncall`. Allowed rate
units are `hour`, `day`, and `fixed`. Employees can edit their own profile,
but only IDs listed in `MODERATORS` can change rates:

```text
/profile rate USER_ID hour 900
```

Use `/work today`, `/work week`, or `/work export week` to view or export your
own records. Work logs are stored in `core/var/data/worklogs.json`.

In Telegram, send `/menu` or `/start` to display the persistent button menu.
Telegram does not allow bots to open the camera automatically from a button.
Use the clock-in/out buttons for instructions, then send a photo with the
caption `In` or `Out`.

## Documentations

• See: [CD'sFUSION Team bot documentation](https://github.com/XaviaTeam/XaviaBot/blob/main/DOCS.md)

## Contributing

• Pull requests are welcome.<br/>
• For major changes, please open an issue first to discuss what you would like to change.

## Authors

• **RFS-ADRENO** (Lead Author):
[Github](https://github.com/RFS-ADRENO) -
[Facebook](https://www.facebook.com/Dungto213) -
[Discord](https://discord.gg/a5uKHKSPww) -
[Youtube](https://www.youtube.com/channel/UCmL-430tKfEJYJ1rzBOCOjA) -
[Mail](mailto:xaviateam@protonmail.com)<br />

## Supporters?

• **TruongMini**:
[Github](https://github.com/truong9c2208) -
[Facebook](https://www.facebook.com/shibasama.dev)
<br /><br />
• Many thanks to TesterTeam for all the testing, feedbacks and the other Bot Projects ([c3cbot](https://github.com/c3cbot/legacy-c3cbot) - [miraibot](https://github.com/miraiPr0ject/miraiv2) - [kb2abot](https://github.com/kb2ateam/kb2abot-client)) that inspired me to create this bot

## Translators

• **Vietnamese** (Main Language): RFS-ADRENO<br />
• **English**: RFS-ADRENO<br />
• **Arabic**: Malk: [Facebook](https://www.facebook.com/profile.php?id=100070177323616)<br />

## Like our work?

• Give us a star!<br />
• Support us via:<br />
&nbsp;&nbsp;&nbsp;» [Paypal](https://www.paypal.com/paypalme/dungto213)<br />
&nbsp;&nbsp;&nbsp;» [Momo](https://me.momo.vn/gMIMulsaUqsbf6iAiXt3)<br />
&nbsp;&nbsp;&nbsp;» [Buy me a Coffee!](https://ko-fi.com/xaviateam)

## License

• This project is licensed under the MIT License<br />
• Go to [LICENSE](https://github.com/XaviaTeam/XaviaBot/blob/main/LICENSE) file
