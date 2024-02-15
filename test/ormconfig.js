import * as config from '../ormconfig';

// Override config for testing
config.database = `${config.database}_test`;
config.dropSchema = true;
config.synchronize = true;

module.exports = config;
