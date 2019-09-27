import kafka from 'node-rdkafka';
import uuidFactory from 'uuid';
import omit from 'lodash/fp/omit';

const ommitHeaders = omit(['headers']);

/**
 * This class encapsulate the initialization and the call of a kafka
 * library to produce a message.
 */
class Producer {
  /**
   * Producer constructor
   *
   * @param {Object} options
   * @param {Object} options.kafkaHost
   * @param {Object} options.apiKey
   * @param {Object} options.apiSecret
   *
   * @returns {Producer}
   */
  constructor({
    kafkaHost = process.env.KAFKA_HOST,
    apiKey = process.env.KAFKA_USERNAME,
    apiSecret = process.env.KAFKA_PASSWORD,
    ...rest
  } = {}) {
    const sasl =
      apiKey && apiSecret
        ? {
            'security.protocol': 'SASL_SSL',
            'sasl.mechanisms': 'PLAIN',
            'sasl.username': apiKey,
            'sasl.password': apiSecret,
          }
        : {};

    this.producer = new kafka.HighLevelProducer({
      debug: 'all',
      dr_cb: true,
      'enable.idempotence': true,
      'metadata.broker.list': kafkaHost || 'localhost:9092',
      'api.version.request': true,
      'retry.backoff.ms': 1000,
      'message.send.max.retries': 5,
      'socket.keepalive.enable': true,
      'delivery.report.only.error': false,
      'socket.timeout.ms': 30000,
      dr_msg_cb: true,
      'log.connection.close': false,
      ...sasl,
      ...rest,
    });
  }

  /**
   * This disconnect the producer from the pool
   *
   * @async
   */
  disconnect() {
    if (!this.isConnected()) return null;

    return new Promise(resolve => {
      this.producer.on('disconnected', resolve);
      return this.producer.disconnect();
    });
  }

  /**
   * Connect the producer to the cluster
   *
   * @returns {Promise} - The callback
   *
   * @async
   */
  connect() {
    if (this.isConnected()) return null;
    return new Promise((resolve, reject) => {
      try {
        this.producer.connect();
        return this.producer.on('ready', resolve);
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * Test is the producer is connected
   *
   * @return {Boolean} - True if the producer is connected
   */
  isConnected() {
    return this.producer.isConnected();
  }

  /**
   * Produce a message to kafka cluster
   *
   * @async
   * @param {Oject}             message                          - The message to publish to the topic `topic`
   * @param {Object}            message.headers                  - Headers of the messages
   * @param {Date|undefined}    message.hreader.date             - Headers of the messages
   * @param {int|undefined}     message.hreader.partition        - Partition number (default= -1). If partition is set to -1, it will use the default partitioner
   * @param {String}            message.hreader.uuid             - Message uuid. If not set, one will be set
   * @param {String}            topic                            - The targeted topic
   *
   * @throws {Error} - It throws an error if the message is not well sent
   */
  /* istanbul ignore next */
  async produce(message, topic) {
    if (!this.isConnected()) {
      await this.connect();
    }
    const { date, partition, uuid, ...headers } = message.headers || {};

    return new Promise((resolve, reject) =>
      this.producer.produce(
        topic,
        partition,
        Buffer.from(JSON.stringify({ ...ommitHeaders(message), headers })),
        uuid || uuidFactory.v4(),
        date || Date.now(),
        (error, offset) => (error ? reject(error) : resolve(offset)),
        headers,
      ),
    );
  }
}

export default Producer;
