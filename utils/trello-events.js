var Trello = require('node-trello'),
    EventEmitter = require('events').EventEmitter,
    extend = require('extend'),
    config, trello, timer, e;

module.exports = function(options) {
    var defaults = {
        pollFrequency: 1000 * 60,
        minId: 0,
        trello: {
            key: '',
            token: '',
            boards: []
        },
        start: true
    };
    e = new EventEmitter();
    config = extend(true, defaults, options);
    trello = new Trello(config.trello.key, config.trello.token);
    if (config.start) {
        process.nextTick(function() {
            start(config.pollFrequency, true);
        });
    }

    var self = {
        on: function(event, listener) {
            e.on(event, listener);
            return self;
        },
        start: function(frequency, immediate) {
            start(frequency, immediate);
            return self;
        },
        stop: function() {
            stop();
            return self;
        },
        poll: function() {
            poll()
        },
        api: trello
    };
    return self;
};

//=================================================

function start(frequency, immediate) {
    if (timer) {
        return;
    }
    frequency = frequency || config.pollFrequency;
    timer = setInterval(poll, frequency);
    if (immediate) {
        poll();
    }
}

function stop() {
    clearInterval(timer);
    timer = null;
}

function poll() {
    config.trello.boards.forEach(function(boardId) {
        getBoardActivity(boardId);
    });
}

function getBoardActivity(boardId) {
    trello.get('/1/boards/' + boardId + '/actions', function(err, resp) {
        if (err) {
            return e.emit('trelloError', err);
        }

        var boardActions = resp.reverse();
        var actionId;
        for (var ix in boardActions) {
            var date = boardActions[ix].hasOwnProperty(`date`) ? boardActions[ix].date : new Date()
            var withinHour = new Date() - new Date(date) < 60 * 60 * 1000

            //skip seen events
            actionId = parseInt(boardActions[ix].id, 16);
            if (actionId <= config.minId || !withinHour) {
                continue;
            }

            var eventType = boardActions[ix].type;
            e.emit(eventType, boardActions[ix], boardId);
        }

        config.minId = Math.max(config.minId, actionId);
        e.emit('maxId', config.minId);
    });
}