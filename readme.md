# TrelloBot
A Discord bot that can manage multiple Trello boards and notify you of events through Discord.
Modified from this https://github.com/Angush/trellobot

## Setup
1. Clone repository.
2. Run `npm install`.
3. Set `.env` (see example.env)
4. Configure `config.json`
5. Run TrelloBot with `node .`


## .env

Property       | How to get the value
-------------- | ----------------------
`DISCORD_BOT_TOKEN` | Create an app for TrelloBot to work through on [Discord's developer site](https://discordapp.com/developers/applications/me/create), then create a bot user (below app description/icon) and copy the token.
`TRELLO_KEY`    | Visit [this page](https://trello.com/1/appKey/generate) to generate your public Trello API key.
`TRELLO_TOKEN`  | Visit `https://trello.com/1/connect?name=Trellobot&response_type=token&expiration=never&key=YOURPUBLICKEY` (replacing `YOURPUBLICKEY` with the appropriate key) to generate a token that does not expire. Remove `&expiration=never` from the URL if you'd prefer a temporary token.


## Supported Events:

* `cardCreated`
* `cardDescriptionChanged`
* `cardDueDateChanged`
* `cardPositionChanged`
* `cardListChanged`
* `cardNameChanged`
* `cardUnarchived`
* `cardArchived`
* `cardDeleted`
* `commentEdited`
* `commentAdded`
* `memberAddedToCard`
* `memberAddedToCardBySelf`
* `memberRemovedFromCard`
* `memberRemovedFromCardBySelf`
* `listCreated`
* `listNameChanged`
* `listPositionChanged`
* `listUnarchived`
* `listArchived`
* `attachmentAddedToCard`
* `attachmentRemovedFromCard`
* `checklistAddedToCard`
* `checklistRemovedFromCard`
* `checklistItemMarkedComplete`
* `checklistItemMarkedIncomplete`
