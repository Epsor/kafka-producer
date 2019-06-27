import kafka from 'kafka-node';
import uuid from 'uuid';

const DEFAULT_OPTIONS = {
  requireAcks: 'all',
};

/**
 * This class encapsulate the initialization and the call of a kafka
 * library to produce a message.
 */
class Producer {
  constructor() {
    this.client = new kafka.KafkaClient({
      kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
    });

    this.producer = new kafka.Producer(this.client);
  }

  /**
   * This call close the connection to the kafka cluster
   */
  close() {
    this.client.close();
  }

  /**
   * Produce a message to kafka cluster
   *
   * @async
   * @param {String} message    - The message to publish to the topic `topic`
   * @param {String} topic      - The targeted topic
   * @param {Object} opts       - The overried options
   * @return {Promise<Object>}  - Response of kafka
   */
  produce(message, topic, opts = {}) {
    const payload = {
      ...DEFAULT_OPTIONS,
      ...opts,
      topic,
      messages: message,
    };
    if (!opts.uuid) {
      payload.uuid = uuid.v4();
    }
    return new Promise((resolve, reject) =>
      this.producer.send([payload], (error, data) => (error ? reject(error) : resolve(data))),
    );
  }
}

export default Producer;
