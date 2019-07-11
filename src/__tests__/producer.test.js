import uuidMock from 'uuid';
import kafka from 'node-rdkafka';

import Producer from '../producer';

const defaultEnv = process.env;
let dateNowSpy;

describe('Producer', () => {
  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000);
  });

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore();
  });

  describe('Contructor', () => {
    beforeEach(() => {
      process.env = defaultEnv;
      kafka.Producer.mockClear();
    });

    it('should call kafka-node.Producer with default kafkaHost', () => {
      if (process.env.KAFKA_HOST) {
        delete process.env.KAFKA_HOST;
      }

      expect(kafka.Producer).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafka.Producer).toHaveBeenCalledTimes(1);
      expect(kafka.Producer).toHaveBeenCalledWith(
        expect.objectContaining({
          dr_cb: true,
          'metadata.broker.list': 'localhost:9092',
        }),
      );
    });

    it('should call node-rdkafka.Producer with KAFKA_HOST', () => {
      process.env.KAFKA_HOST = 'myNewHostValue';

      expect(kafka.Producer).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafka.Producer).toHaveBeenCalledTimes(1);
      expect(kafka.Producer).toHaveBeenCalledWith(
        expect.objectContaining({
          dr_cb: true,
          'metadata.broker.list': 'myNewHostValue',
        }),
      );
    });
  });

  describe('disconnect', () => {
    it('should call Producer.isConnected', () => {
      const isConnected = jest.fn(() => false);
      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
      }));
      const producer = new Producer();
      expect(isConnected).toHaveBeenCalledTimes(0);
      producer.disconnect();
      expect(isConnected).toHaveBeenCalledTimes(1);
    });

    it('should return a promise if allready connected', () => {
      const isConnected = jest.fn(() => true);
      const on = jest.fn(() => null);
      const disconnect = jest.fn(() => null);
      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        on,
        disconnect,
      }));
      const producer = new Producer();
      expect(disconnect).toHaveBeenCalledTimes(0);
      const promise = producer.disconnect();
      expect(typeof promise.then).toBe('function');
      expect(disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('connect', () => {
    it('should call Producer.isConnected', () => {
      const isConnected = jest.fn(() => false);
      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
      }));
      const producer = new Producer();
      expect(isConnected).toHaveBeenCalledTimes(0);
      producer.disconnect();
      expect(isConnected).toHaveBeenCalledTimes(1);
    });

    it('should throw then connect throw', async () => {
      const isConnected = jest.fn(() => false);
      const connect = jest.fn(() => {
        throw new Error('tested');
      });
      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
      }));
      const producer = new Producer();
      expect(isConnected).toHaveBeenCalledTimes(0);
      expect(connect).toHaveBeenCalledTimes(0);
      await expect(producer.connect()).rejects.toEqual(new Error('tested'));
      expect(isConnected).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('should not connect if connected', async () => {
      const isConnected = jest.fn(() => true);
      const connect = jest.fn();
      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
      }));
      const producer = new Producer();
      expect(isConnected).toHaveBeenCalledTimes(0);
      expect(connect).toHaveBeenCalledTimes(0);
      await producer.connect();
      expect(isConnected).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledTimes(0);
    });
  });

  describe('produce', () => {
    it('should connect if not connected', () => {
      const isConnected = jest.fn(() => false);
      const on = jest.fn(() => null);
      const connect = jest.fn();

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        on,
      }));

      const producer = new Producer();
      expect(connect).toHaveBeenCalledTimes(0);
      producer.produce({ headers: {}, config: {} });
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('should not connect if connected', () => {
      const isConnected = jest.fn(() => true);
      const connect = jest.fn();
      const produce = jest.fn(() => true);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        produce,
      }));

      const producer = new Producer();
      expect(connect).toHaveBeenCalledTimes(0);
      producer.produce({ headers: {}, config: {} });
      expect(connect).toHaveBeenCalledTimes(0);
    });

    it('should call produce', () => {
      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        produce,
      }));

      const producer = new Producer();
      expect(produce).toHaveBeenCalledTimes(0);
      producer.produce({ headers: {}, config: {} });
      expect(produce).toHaveBeenCalledTimes(1);
    });

    it('should generate an uuid v4 if messageId is not given', () => {
      uuidMock.v4 = jest.fn(() => '');
      const isConnected = jest.fn(() => true);
      const connect = jest.fn();
      const produce = jest.fn(() => true);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        produce,
      }));

      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
      const producer = new Producer();
      producer.produce({}, 'topic');
      expect(uuidMock.v4).toHaveBeenCalledTimes(1);
    });

    it('should generate an uuid v4 if messageId is not given', () => {
      uuidMock.v4 = jest.fn(() => '');
      const isConnected = jest.fn(() => true);
      const connect = jest.fn();
      const produce = jest.fn(() => true);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        produce,
      }));

      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
      const producer = new Producer();
      producer.produce({ headers: { uuid: 'given' } });
      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
    });

    it('should call with default values', () => {
      uuidMock.v4 = jest.fn(() => 'uuid');

      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        produce,
      }));

      const producer = new Producer();
      expect(produce).toHaveBeenCalledTimes(0);
      producer.produce({ headers: {} }, 'topic');
      expect(produce).toHaveBeenCalledTimes(1);
      expect(produce).toHaveBeenCalledWith(
        'topic',
        undefined,
        Buffer.from('{"headers":{}}'),
        'uuid',
        1487076708000,
        undefined,
        {},
      );
    });

    it('should call with good values', () => {
      uuidMock.v4 = jest.fn(() => 'uuid');

      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        produce,
      }));

      const producer = new Producer();
      expect(produce).toHaveBeenCalledTimes(0);
      producer.produce({ key: 'value', headers: {} }, 'topic');
      expect(produce).toHaveBeenCalledTimes(1);
      expect(produce).toHaveBeenCalledWith(
        'topic',
        undefined,
        Buffer.from('{"key":"value","headers":{}}'),
        'uuid',
        1487076708000,
        undefined,
        {},
      );
    });

    it('should call with partition', () => {
      uuidMock.v4 = jest.fn(() => 'uuid');

      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        produce,
      }));

      const producer = new Producer();
      expect(produce).toHaveBeenCalledTimes(0);
      producer.produce({ headers: { partition: 123 } }, 'topic');
      expect(produce).toHaveBeenCalledTimes(1);
      expect(produce).toHaveBeenCalledWith(
        'topic',
        123,
        Buffer.from('{"headers":{}}'),
        'uuid',
        1487076708000,
        undefined,
        {},
      );
    });

    it('should throw when produce fails', async () => {
      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => false);

      kafka.Producer = jest.fn().mockImplementation(() => ({
        isConnected,
        produce,
      }));

      const producer = new Producer();
      await expect(producer.produce({}, 'topic')).rejects.toEqual(
        new Error('Message not sent to Kafka.'),
      );
    });
  });
});
