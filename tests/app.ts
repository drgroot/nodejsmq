import NodeJSMQ from '../src';

const nodeMQ = new NodeJSMQ(process.env.CLOUDAMQP_URL || 'amqp://127.0.0.1/');
export default nodeMQ;
