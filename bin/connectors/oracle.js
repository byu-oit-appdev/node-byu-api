"use strict";
var connector           = require('../modules/connector');
var oracledb 	        = {};//require('oracledb');
var Promise             = require('bluebird');

oracledb.outFormat = oracledb.OBJECT;

connector.define('oracle', connect, disconnect, [
    {
        type: 'input',
        name: 'username',
        message: 'Username:'
    },
    {
        type: 'password',
        name: 'password',
        message: 'Password:'
    },
    {
        type: 'input',
        name: 'connection_string',
        message: 'Connection String:'
    }
]);

/*connector.define('oracle', connect, disconnect, {
    description: 'An oracle relational database connector.',
    examples: [
        {
            title: 'Example',
            body: '{\n' +
            '  "name":       "userX",\n' +
            '  "password":   "1-secret",\n' +
            '  "connection": "host=..."\n}'
        }
    ],
    groups: {
        property: 'Property Descriptions'
    },
    options: {
        name: {
            description: 'The user name to use to authenticate with.',
            type: String,
            required: true,
            group: 'property'
        },
        password: {
            description: 'The password to use to authenticate with.',
            type: String,
            required: true,
            group: 'property'
        },
        connection: {
            description: 'The oracle connection string.',
            type: String,
            required: true,
            group: 'property'
        }
    }
});*/

function connect(configuration) {
    return new Promise(function(resolve, reject) {
        oracledb.getConnection(configuration, function(err, conn) {
            if (err) return reject(err);
            var factory = {
                break: promiseOption(oracledb, conn.break),
                commit: promiseOption(oracledb, conn.commit),
                execute: promiseOption(oracledb, conn.execute),
                rollback: promiseOption(oracledb, conn.rollback)
            };
            factory.executeWithCommit = executeWithCommit(factory);
            return resolve(factory);
        });
    });
}

function disconnect(connection) {
    return Promise.promisify(connection.release);
}




function executeWithCommit(factory) {
    return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        var callback;

        //callback paradigm
        if (typeof args[args.length - 1] === 'function') {

            //remove final callback from args
            callback = args.pop();

            //add intermediate callback to args that will commit
            args.push(function (err, data) {
                if (err) return callback(err, data);
                factory.commit(callback);
            });

            //execute the query
            factory.execute.apply(factory, args);

        //promise paradigm
        } else {
            return factory.execute.apply(factory, args)
                .then(function(data) {
                    return factory.commit();
                });
        }
    };
}

function promiseOption(scope, callback) {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0);

        //if using callback paradigm
        if (typeof args[args.length - 1] === 'function') {
            return callback.apply(scope, args);

        //using the promise paradigm
        } else {
            return new Promise(function(resolve, reject) {
                args.push(function(err, data) {
                    if (err) return reject(err);
                    return resolve(data);
                });
                return callback.apply(scope, args);
            });
        }
    }
}