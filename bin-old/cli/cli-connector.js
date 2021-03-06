var chalk           = require('chalk');
var clc             = require('./clc');
var cliError        = require('./cli-error');
var connector       = require('../../bin/database/connector');
var format          = require('cli-format');
var pool            = require('../modules/connection-pool');

clc.define('connector', handler, {
    description: 'Get information about defined connectors.',
    help: 'If this stuff about connectors confuses you, just use the ' +
        chalk.italic('connection') + ' command to get an interactive terminal application ' +
        'that will help you define your connector configurations. If you must enter a connector ' +
        'configuration through the command line then you\'ll have to understand this stuff.\n\n' +
        'A connector takes a configuration and uses it to connect to a database. Each connector will ' +
        'connect to a specific database type (as defined by the connector itself). Each connector has a' +
        'specific configuration that it accepts. To see that configuration information, you can add' +
        'the name of the connector of interest after this command (or add it through the --name option).',
    defaultOption: 'name',
    options: {
        name: {
            alias: 'n',
            type: String,
            description: 'The name of the connector to get detailed instructions for.',
            multiple: true
        }
    }
});

function getConnectorDetails(name) {
    var config;
    var keys;
    var width;
    var result = format.wrap(chalk.underline.bold('Connector: ' + name)) + '\n\n';

    if (!connector.exists(name)) {
        result += format.wrap(chalk.italic('No connector with this name exists.'));
    } else {
        result += format.wrap('The ' + name + ' connector requires a configuration object that defines the following properties:') + '\n\n';

        config = connector.get(name).configuration;
        keys = Object.keys(config);
        width = keys.reduce(function(prev, curr) { return prev > curr.length ? prev : curr.length }, 0);
        keys.forEach(function(key, index) {
            var item = config[key];
            var title = chalk.bold(key);
            var description = item.description || '';
            var attributes = [];
            if (item.type.name) attributes.push('[Type: ' + item.type.name + ']');
            if (item.required) attributes.push('[Required]');
            attributes = chalk.dim(attributes.join('\n'));
            description += (description.length > 0 ? '\n' : '') + attributes;
            if (index > 0) result += '\n';
            result += clc.formatter('item-description', { title: title, body: description, width: width });
        });
    }
    return result;
}

function handler(err, options) {
    connector.load()
        .then(function() {
            var result = '';
            if (!options.name) {
                result += clc.getCommandUsage('connector') + '\n';
                result += listConnectors();
            } else {
                options.name.forEach(function(name, index) {
                    if (index > 0) result += '\n' + format.wrap('', { filler: '-'}) + '\n\n';
                    result += getConnectorDetails(name);
                });
            }
            console.log(result);
        });
}

function listConnectors() {
    var connectors = connector.list();
    var result = '';

    if (connectors.length === 0) {
        result += format.wrap('There are no defined connectors.');
    } else {
        result += format.wrap('\u001b[1;4mAvailable Connectors\u001b[0m', { hangingIndent: '  ' }) + '\n\n';
        connectors.sort();
        connectors.forEach(function(name) {
            var description = connector.get(name).configuration.description || '';
            result += format.columns(chalk.bold(name), description, { width: [15, null], paddingLeft: '  ' }) + '\n';
        });
    }

    return result;
}