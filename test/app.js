import nodejsmq from '../src';

const nodeMQ = nodejsmq(process.env.CLOUDAMQP_URL);
export default nodeMQ;
