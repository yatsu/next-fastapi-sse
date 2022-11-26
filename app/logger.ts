import debug from 'debug';

const log = debug('nf:main');

log.log = console.log.bind(console);

export default log;
