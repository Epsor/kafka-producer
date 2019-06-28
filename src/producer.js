import kafka from 'node-rdkafka';
import uuidFactory from 'uuid';
import omit from 'lodash/fp/omit';

const ommitHeaders = omit(['headers']);

/**
 * This class encapsulate the initialization and the call of a kafka
 * library to produce a message.
 */
class Producer {
  constructor() {
    this.producer = new kafka.Producer({
      debug: 'all',
      dr_cb: true,
      'metadata.broker.list': process.env.KAFKA_HOST || 'localhost:9092',
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
    return new Promise((resole, reject) => {
      try {
        this.producer.connect();
        return this.producer.on('ready', resole);
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
   * @param {string}            message.hreader.uuid             - Message uuid. If not set, one will be set
   * @param {String}            topic                            - The targeted topic
   *
   * @throws {Error} - It throws an error if the message is not well sent
   */
  async produce(message, topic) {
    if (!this.isConnected()) {
      await this.connect();
    }
    const { date, partition, uuid, ...headers } = message.headers || {};

    const isSent = this.producer.produce(
      topic,
      partition,
      Buffer.from(JSON.stringify({ ...ommitHeaders(message), headers })),
      uuid || uuidFactory.v4(),
      date || Date.now(),
      undefined,
      headers,
    );

    if (!isSent) {
      throw new Error('Message not sent to Kafka.');
    }
  }
}

export default Producer;
