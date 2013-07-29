/**
Utility functions on top of the mongodb node module, to work with mongo collections

@module MongoConnection
**/

/**
Utility class for managing connections to MongoDB.

@class MongoConnection
@constructor
@param {String} dbName name of the database to connect to.
@param {function} callback the method to invoke when the connection is established.
                The method will receive two parameters: (err, connection). err will be
        null if no error occurred; the second will be non-null if no error occurred.
*/
function MongoConnection(dbName, callback) {
        this.mongo = require("mongodb");
        var server = new this.mongo.Server('localhost', 27017, {auto_reconnect: true}, {});
        var db = new this.mongo.Db(dbName, server, {w:0});
        var self = this;
        db.open(function(err, openedDB) {
                if (!err) {
                        self.db = openedDB;
                        callback(err, self);
                }
        });
};

/**
 * Create a new ObjectID using the current time
 *
 * @method generateID
 * @return {mongo.ObjectID} newly created MongoDB ObjectID
 */
MongoConnection.prototype.generateID = function() {
        var timestamp = Math.floor(new Date().getTime()/1000);
        return this.mongo.ObjectID(timestamp);
};

/**
Get a single collection, returning a promise for getting it.

@method getOneCollection
@api private
@param {String} name the name of the collection
@return {promise} a promise that is resolved or rejected when the collection is gotten or not
**/
MongoConnection.prototype.getOneCollection = function(name) {
        var q = require('q');
        var defer = q.defer();
        this.db.collection(name, function(error, collection) {
                if (error) {
                        defer.reject(error);
                } else
                        defer.resolve(collection);
        });
        return defer.promise;
};

/**
Get one or more collections, calling the callback when they're all gotten.

If the first parameter is a string, it calls the callback when it gets the colliection

@method getCollection
@api public
@param {String or Array} name the name of the collection to get, or an array of names.
@param {function(resultObj)} callback called with a structure for the result, with two of three properties:

* success: true for success, false for failure
* collection: (only on success) a collection (for one name string) or an array of collections (for an array of names)
* err: (only on !success) the error that was thrown

**/
MongoConnection.prototype.getCollection = function(name, callback) {
        var self = this;
        var q = require('q');

        // Make it into an array
        var names;
        if (typeof name === "string") {
                names = [ name ];
        } else {
                names = name;
        }

        // Assume success.
        var resultData = { success: true };

        // The array of promises will eventually resolve/reject.
        var promises = [];
        for (var i = 0, len = names.length; i < len; i++)
                promises.push(self.getOneCollection(names[i]));
        q.all(promises)
                .then(function(results) {
                        // "then" is not called unless all succeeded, and the
                        // result is an array of the results.
                        if (typeof name === "string")
                                resultData.collection = results[0];
                        else
                                resultData.collection = results;
                        callback(resultData);
                })
                .fail(function(err) {
                        // Called on first failure, so err is not an array.
                        resultData.success = false;
                        result.err = err;
                        callback(resultData);
                });
};

module.exports = MongoConnection;