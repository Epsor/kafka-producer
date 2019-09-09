import { Producer as KafkaProducer, KafkaClient } from 'kafka-node';

import Producer from '../producer';

const env = { ...process.env };

describe('Producer', () => {
  afterEach(() => {
    KafkaProducer.mockClear();
    KafkaClient.mockClear();
    process.env = env;
  });

  describe('Constructor', () => {
    it('should call kafka-node.Producer with default kafkaHost', () => {
      if (process.env.KAFKA_HOST) {
        delete process.env.KAFKA_HOST;
      }

      expect(KafkaClient).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(KafkaClient).toHaveBeenCalledTimes(1);
      expect(KafkaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          kafkaHost: 'localhost:9092',
        }),
      );
    });

    it('should call kafka-node.Producer with default kafkaHost', () => {
      process.env.KAFKA_HOST = 'myNewHostValue';

      expect(KafkaClient).toHaveBeenCalledTimes(0);
      expect(new Producer()).toBeTruthy();
      expect(KafkaClient).toHaveBeenCalledTimes(1);
      expect(KafkaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          kafkaHost: 'myNewHostValue',
        }),
      );
    });

    it('should call kafka-node.Producer with given kafkaHost', () => {
      expect(KafkaClient).toHaveBeenCalledTimes(0);
      expect(
        new Producer({
          kafkaHost: 'PaulDevOps4Ever',
        }),
      ).toBeTruthy();
      expect(KafkaClient).toHaveBeenCalledTimes(1);
      expect(KafkaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          kafkaHost: 'PaulDevOps4Ever',
        }),
      );
    });

    it('should call KafkaStreams with api credentials', () => {
      expect(
        new Producer({
          apiKey: 'apiKey',
          apiSecret: 'apiSecret',
        }),
      ).toBeTruthy();

      expect(KafkaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          sasl: expect.objectContaining({
            username: 'apiKey',
            password: 'apiSecret',
          }),
        }),
      );
    });

    it('should call KafkaStreams with api credentials', () => {
      expect(
        new Producer({
          apiKey: 'apiKey',
        }),
      ).toBeTruthy();

      expect(KafkaClient).toHaveBeenCalledWith(
        expect.not.objectContaining({
          sasl: expect.objectContaining({
            username: 'apiKey',
            password: 'apiSecret',
          }),
        }),
      );
    });
  });

  describe('disconnect', () => {
    it('should not return a promise if not connected', () => {
      const producer = new Producer();
      expect(producer.disconnect()).toBe(null);
    });

    it('should resolve', () => {
      const producer = new Producer();
      producer.isConnected = () => true;
      expect(producer.disconnect()).resolves.toMatch(/implemented/);
    });
  });

  describe('connect', () => {
    it('should not connect if connected', async () => {
      const mockOn = jest.fn((event, cb) => (event === 'ready' ? cb() : null));
      const mockContructor = jest.fn(() => ({
        on: mockOn,
      }));
      KafkaProducer.mockImplementation(mockContructor);

      const producer = new Producer();
      producer.isConnected = () => true;
      await producer.connect();
      expect(mockOn).toHaveBeenCalledTimes(0);
    });

    it('should connect', async () => {
      const mockOn = jest.fn((event, cb) => (event === 'ready' ? cb() : null));
      const mockContructor = jest.fn(() => ({
        on: mockOn,
      }));
      KafkaProducer.mockImplementation(mockContructor);

      const producer = new Producer();
      await producer.connect();

      expect(mockOn).toHaveBeenCalledWith('ready', expect.any(Function));
    });

    it('should reject on error', async () => {
      const producer = new Producer();
      const mockOn = jest.fn((event, cb) => (event === 'error' ? cb('err') : null));
      const mockContructor = jest.fn(() => ({
        on: mockOn,
      }));
      KafkaProducer.mockImplementation(mockContructor);

      expect(producer.connect()).rejects.toEqual('err');

      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle and reject on error', async () => {
      const producer = new Producer();
      const mockOn = jest.fn(() => {
        throw new Error('ok');
      });
      const mockContructor = jest.fn(() => ({
        on: mockOn,
      }));
      KafkaProducer.mockImplementation(mockContructor);

      expect(producer.connect()).rejects.toThrow(/ok/);

      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('produce', () => {
    it('should await connected', async () => {
      const sendMock = jest.fn((message, cb) => cb());

      KafkaProducer.mockImplementation(() => ({
        on: (e, cb) => e === 'ready' && cb(),
        send: sendMock,
      }));

      const producer = new Producer();

      producer.connect = jest.fn(producer.connect);
      await producer.produce({ a: 1, b: 2, c: false }, 'myTopic');

      expect(producer.connect).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        [{ topic: 'myTopic', messages: '{"a":1,"b":2,"c":false}' }],
        expect.any(Function),
      );
    });

    it('should send a message', async () => {
      const sendMock = jest.fn((message, cb) => cb());

      KafkaProducer.mockImplementation(() => ({
        on: (e, cb) => e === 'ready' && cb(),
        send: sendMock,
      }));

      const producer = new Producer();

      await producer.connect();
      await producer.produce({ a: 1, b: 2, c: false }, 'myTopic');

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        [{ topic: 'myTopic', messages: '{"a":1,"b":2,"c":false}' }],
        expect.any(Function),
      );
    });

    it('should send a default topic if not given', async () => {
      delete process.env.KAFKA_TOPIC;

      const sendMock = jest.fn((message, cb) => cb());

      KafkaProducer.mockImplementation(() => ({
        on: (e, cb) => e === 'ready' && cb(),
        send: sendMock,
      }));

      const producer = new Producer();

      await producer.connect();
      await producer.produce({ a: 1, b: 2, c: false });

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        [{ topic: 'epsor', messages: '{"a":1,"b":2,"c":false}' }],
        expect.any(Function),
      );
    });

    it('should reject if error passed to callback', async () => {
      process.env.KAFKA_TOPIC = 'defaultTopic';

      const sendMock = jest.fn((message, cb) => cb(new Error()));

      KafkaProducer.mockImplementation(() => ({
        on: (e, cb) => e === 'ready' && cb(),
        send: sendMock,
      }));

      const producer = new Producer();

      await producer.connect();
      expect(producer.produce({ a: 1, b: 2, c: false })).rejects.toThrow();

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        [{ topic: 'defaultTopic', messages: '{"a":1,"b":2,"c":false}' }],
        expect.any(Function),
      );
    });
  });
});
