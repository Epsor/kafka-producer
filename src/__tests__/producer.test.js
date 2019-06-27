import uuidMock from 'uuid';
import kafkaNode from 'kafka-node';

import Producer from '../producer';

const defaultEnv = process.env;

describe('Producer', () => {
  beforeEach(() => {
    uuidMock.v4.mockClear();
    kafkaNode.KafkaClient.mockClear();
    kafkaNode.Producer.mockClear();
  });

  describe('Contructor', () => {
    beforeEach(() => {
      process.env = defaultEnv;
    });

    it('should call kafka-node.kafkaClient with default kafkaHost', () => {
      if (process.env.KAFKA_HOST) {
        delete process.env.KAFKA_HOST;
      }

      expect(kafkaNode.KafkaClient).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafkaNode.KafkaClient).toHaveBeenCalledTimes(1);
      expect(kafkaNode.KafkaClient).toHaveBeenCalledWith({
        kafkaHost: 'localhost:9092',
      });
    });

    it('should call kafka-node.kafkaClient with KAFKA_HOST', () => {
      process.env.KAFKA_HOST = 'myNewHostValue';
      expect(kafkaNode.KafkaClient).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafkaNode.KafkaClient).toHaveBeenCalledTimes(1);
      expect(kafkaNode.KafkaClient).toHaveBeenCalledWith({
        kafkaHost: 'myNewHostValue',
      });
    });

    it('should call kafka-node.Producer', () => {
      expect(kafkaNode.Producer).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafkaNode.Producer).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    it('should call kafka-node.Client.close', () => {
      const ClientClose = jest.fn();
      kafkaNode.KafkaClient = jest.fn().mockImplementation(() => ({
        close: ClientClose,
      }));
      const producer = new Producer();
      expect(ClientClose).toHaveBeenCalledTimes(0);
      producer.close();
      expect(ClientClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('produce', () => {
    it('should call kafka-node.send', () => {
      const send = jest.fn();
      kafkaNode.Producer = jest.fn().mockImplementation(() => ({
        send,
      }));
      const producer = new Producer();
      expect(send).toHaveBeenCalledTimes(0);
      producer.produce('coucou', 'topic');
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('should generate an uuid v4 if messageId is not given', () => {
      uuidMock.v4 = jest.fn(() => '');

      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
      const producer = new Producer();
      producer.produce('coucou', 'topic');
      expect(uuidMock.v4).toHaveBeenCalledTimes(1);
    });

    it('should generate an uuid v4 if messageId is not given', () => {
      uuidMock.v4 = jest.fn(() => '');

      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
      const producer = new Producer();
      producer.produce('coucou', 'topic', { uuid: 'given' });
      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
    });

    it('should returns a promise', () => {
      const producer = new Producer();
      const promise = producer.produce('coucou', 'topic');
      expect(typeof promise.then).toBe('function');
    });

    it('should throw when send calls callback with error', async () => {
      const error = new Error('myError');
      const send = jest.fn((args, cb) => {
        return cb(error);
      });

      kafkaNode.Producer = jest.fn().mockImplementation(() => ({
        send,
      }));
      const producer = new Producer();
      await expect(producer.produce('coucou', 'error')).rejects.toEqual(error);
    });

    it('should not throw when send calls callback without error', async () => {
      const response = { key: 'value' };
      const send = jest.fn((args, cb) => {
        return cb(null, response);
      });

      kafkaNode.Producer = jest.fn().mockImplementation(() => ({
        send,
      }));
      const producer = new Producer();
      await expect(producer.produce('coucou', 'error')).resolves.toEqual(response);
    });
  });
});
