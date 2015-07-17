require('proof')(6, require('cadence/redux')(prove))

function prove (async, assert) {
    var cadence = require('cadence/redux')
    var Dispatcher = require('../../dispatcher')
    var UserAgent = require('vizsla')
    var http = require('http')
    var connect = require('connect')

    function Service () {
    }

    Service.prototype.dispatcher = function () {
        var dispatcher = new Dispatcher(this)
        dispatcher.dispatch('GET /', 'index')
        dispatcher.dispatch('GET /error', 'error')
        dispatcher.dispatch('GET /exception', 'exception')
        dispatcher.dispatch('GET /json', 'json')
        dispatcher.dispatch('GET /response', 'response')
        return dispatcher.createDispatcher()
    }

    Service.prototype.index = cadence(function () {
        return 'Service API'
    })

    Service.prototype.error = cadence(function (async, request) {
        request.raise(401, 'Forbidden')
    })

    Service.prototype.exception = cadence(function (async, request) {
        throw new Error('exception')
    })

    Service.prototype.json = cadence(function (async) {
        return { key: 'value' }
    })

    Service.prototype.response = cadence(function (async) {
        return Dispatcher.resend(200, { 'content-type': 'text/plain' }, 'responded')
    })

    var service = new Service
    var dispatcher = service.dispatcher()

    var server = http.createServer(service.dispatcher().server())
    var ua = new UserAgent, session = { url: 'http://127.0.0.1:8077' }

    async(function () {
        server.listen(8077, '127.0.0.1', async())
    }, function () {
        ua.fetch(session, async())
    }, function (body) {
        assert(body.toString(), 'Service API', 'get')
        ua.fetch(session, { url: '/error' }, async())
    }, function (body, response) {
        assert(response.statusCode, 401, 'error status code')
        assert(body, { message: 'Forbidden' }, 'error message')
        ua.fetch(session, { url: '/exception' }, async())
    }, function (body, response) {
        assert(response.statusCode, 500, 'exception status code')
        ua.fetch(session, { url: '/json' }, async())
    }, function (body, response) {
        assert(body, { key: 'value' }, 'json')
        ua.fetch(session, { url: '/response' }, async())
    }, function (body, response) {
        assert(body.toString(), 'responded', 'json')
        server.close(async())
    })
}
