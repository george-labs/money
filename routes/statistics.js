var Configuration = require('../utils/Configuration'),
    statisticsCalculator = require('../utils/StatisticsCalculator.js'),
    statisticsUpdater = require('../utils/StatisticsUpdater.js');

var StatisticsController = {

    indexAction: function(req, res) {
        statisticsCalculator.aggregate(function (err, printable) {
            res.render('statistics', {
                config: Configuration.render(req),
                stats: printable,
                isAdmin: req.isAuthenticated()
            });
        });
    },

    housekeepingAction: function(req, res){
        statisticsUpdater.integrate();
        var resBody = { status: 'OK' };
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resBody));
        res.end();
    },

    centralExchangeAction: function(req, res){
        statisticsUpdater.centralExchange();
        var resBody = { status: 'OK' };
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resBody));
        res.end();
    }

}

module.exports = StatisticsController;