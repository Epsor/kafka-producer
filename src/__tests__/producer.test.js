import uuidMock from 'uuid';
import kafka from 'node-rdkafka';

import Producer from '../producer';

const defaultEnv = process.env;
let dateNowSpy;
let beforeEnv;

describe('Producer', () => {
  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000);
    beforeEnv = { ...process.env };
  });

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore();
    process.env = beforeEnv;
  });

  describe('Constructor', () => {
    beforeEach(() => {
      process.env = defaultEnv;
      kafka.HighLevelProducer.mockClear();
    });

    it('should call kafka.HighLevelProducer with default kafkaHost', () => {
      if (process.env.KAFKA_HOST) {
        delete process.env.KAFKA_HOST;
      }

      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(1);
      expect(kafka.HighLevelProducer).toHaveBeenCalledWith(
        expect.objectContaining({
          dr_cb: true,
          'metadata.broker.list': 'localhost:9092',
        }),
      );
    });

    it('should call kafka.HighLevelProducer without username', () => {
      if (!process.env.KAFKA_USERNAME) {
        process.env.KAFKA_USERNAME = 'username';
        process.env.KAFKA_PASSWORD = 'password';
      }

      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(1);
      expect(kafka.HighLevelProducer).toHaveBeenCalledWith(
        expect.objectContaining({
          dr_cb: true,
          'sasl.username': 'username',
        }),
      );
    });

    it('should call kafka.HighLevelProducer without password', () => {
      if (!process.env.KAFKA_PASSWORD) {
        process.env.KAFKA_PASSWORD = 'password';
      }

      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(1);
      expect(kafka.HighLevelProducer).toHaveBeenCalledWith(
        expect.objectContaining({
          dr_cb: true,
          'sasl.password': 'password',
        }),
      );
    });

    it('should call node-rdkafka.HighLevelProducer with KAFKA_HOST', () => {
      process.env.KAFKA_HOST = 'myNewHostValue';

      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(kafka.HighLevelProducer).toHaveBeenCalledTimes(1);
      expect(kafka.HighLevelProducer).toHaveBeenCalledWith(
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
      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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
      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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
      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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
      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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
      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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
    it('should connect if not connected', async () => {
      const isConnected = jest.fn(() => false);
      const on = jest.fn(() => null);
      const connect = jest.fn();

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        on,
      }));

      const producer = new Producer();
      expect(connect).toHaveBeenCalledTimes(0);
      producer.produce({ headers: {}, config: {} });
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('should not connect if connected', async () => {
      const isConnected = jest.fn(() => true);
      const connect = jest.fn();
      const produce = jest.fn(() => true);

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        produce,
      }));

      const producer = new Producer();
      expect(connect).toHaveBeenCalledTimes(0);
      producer.produce({ headers: {}, config: {} });
      expect(connect).toHaveBeenCalledTimes(0);
    });

    it('should call produce', async () => {
      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
        isConnected,
        produce,
      }));

      const producer = new Producer();
      expect(produce).toHaveBeenCalledTimes(0);
      producer.produce({ headers: {}, config: {} });
      expect(produce).toHaveBeenCalledTimes(1);
    });

    it('should generate an uuid v4 if messageId is not given', async () => {
      uuidMock.v4 = jest.fn(() => '');
      const isConnected = jest.fn(() => true);
      const connect = jest.fn();
      const produce = jest.fn(() => true);

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        produce,
      }));

      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
      const producer = new Producer();
      producer.produce({}, 'topic');
      expect(uuidMock.v4).toHaveBeenCalledTimes(1);
    });

    it('should generate an uuid v4 if messageId is not given', async () => {
      uuidMock.v4 = jest.fn(() => '');
      const isConnected = jest.fn(() => true);
      const connect = jest.fn();
      const produce = jest.fn(() => true);

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
        isConnected,
        connect,
        produce,
      }));

      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
      const producer = new Producer();
      producer.produce({ headers: { uuid: 'given' } });
      expect(uuidMock.v4).toHaveBeenCalledTimes(0);
    });

    /*
    it('should call with default values', async () => {
      uuidMock.v4 = jest.fn(() => 'uuid');

      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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

    it('should call with good values', async () => {
      uuidMock.v4 = jest.fn(() => 'uuid');

      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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

    it('should call with partition', async () => {
      uuidMock.v4 = jest.fn(() => 'uuid');

      const isConnected = jest.fn(() => true);
      const produce = jest.fn(() => true);

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
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

      kafka.HighLevelProducer = jest.fn().mockImplementation(() => ({
        isConnected,
        produce,
      }));

      const producer = new Producer();
      await expect(producer.produce({}, 'topic')).rejects.toEqual(
        new Error('Message not sent to Kafka.'),
      );
    });
    */
  });
});
