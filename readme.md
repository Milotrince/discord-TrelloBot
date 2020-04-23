# TrelloBot
A Discord bot that can manage multiple Trello boards and notify you of events through Discord.
Modified from this trellobot:  https://github.com/Angush/trellobot

## Setup
1. Clone repository.
2. Run `npm install`.
3. Configure `botconfig.json` file as desired ([see below](#botconfig.json)).
4. Generate tokens and set up `.auth` file ([see below](#auth)).
5. Run Trellobot with `node .`.

## botconfig.json

Property       | How to get the value
-------------- | ----------------------
`discordToken` | Create an app for Trellobot to work through on [Discord's developer site](https://discordapp.com/developers/applications/me/create), then create a bot user (below app description/icon) and copy the token.
`trelloKey`    | Visit [this page](https://trello.com/1/appKey/generate) to generate your public Trello API key.
`trelloToken`  | Visit `https://trello.com/1/connect?name=Trellobot&response_type=token&expiration=never&key=YOURPUBLICKEY` (replacing `YOURPUBLICKEY` with the appropriate key) to generate a token that does not expire. Remove `&expiration=never` from the URL if you'd prefer a temporary token.



# Event Types

## Supported Events:

Put any of these in the `enabledEvents` array of your `conf.json` file to utilize the event whitelist. They should all be self-explanatory.

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
