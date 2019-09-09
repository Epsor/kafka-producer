import kafkaNode from 'kafka-node';

/**
 * This class encapsulate the initialization and the call of a kafka
 * library to produce a message.
 */
class Producer {
  /**
   * @param {Object} options         - Stream options
   * @param {String} options.groupId - Stream group identifier
   */
  constructor({
    requireAcks = 1,
    ackTimeoutMs = 100,
    kafkaHost = undefined,
    apiKey = undefined,
    apiSecret = undefined,
    ...opts
  } = {}) {
    this.client = new kafkaNode.KafkaClient({
      kafkaHost: kafkaHost || process.env.KAFKA_HOST || 'localhost:9092',
      fromOffset: 'earliest',
      protocol: ['roundrobin'],
      ...(apiKey && apiSecret
        ? {
            sasl: {
              mechanism: 'plain',
              username: apiKey,
              password: apiSecret,
            },
          }
        : {}),
      ...opts,
    });

    this.opts = {
      requireAcks,
      ackTimeoutMs,
    };
  }

  /**
   * This disconnect the producer from the pool
   *
   * @async
   */
  disconnect() {
    if (!this.isConnected()) return null;

    return new Promise(resolve => {
      resolve('not implemented by kafka-node');
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
        this.producer = new kafkaNode.Producer(this.client, this.opts);
        this.producer.on('error', reject);
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
    return !!this.producer;
  }

  /**
   * Produce a message to kafka cluster
   *
   * @async
   * @param {Oject}             message                          - The message to publish to the topic `topic`
   * @param {Object}            message.headers                  - Headers of the messages
   * @param {int|undefined}     message.headers.partition        - Partition number (default= -1). If partition is set to -1, it will use the default partitioner
   * @param {String}            topic                            - The targeted topic
   *
   * @throws {Error} - It throws an error if the message is not well sent
   */
  async produce(message, topic) {
    if (!this.isConnected()) {
      await this.connect();
    }

    const { partition } = message.headers || {};

    return new Promise((resolve, reject) =>
      this.producer.send(
        [
          {
            topic: topic || process.env.KAFKA_TOPIC || 'epsor',
            messages: JSON.stringify(message),
            partition,
          },
        ],
        (err, data) => (err ? reject(err) : resolve(data)),
      ),
    );
  }
}

export default Producer;
