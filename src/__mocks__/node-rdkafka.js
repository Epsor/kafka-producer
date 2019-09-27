export const ProducerMethods = {
  send: jest.fn(),
  isConnected: jest.fn(),
  on: jest.fn(),
  produce: jest.fn(),
};

export const HighLevelProducer = jest.fn().mockImplementation(() => ProducerMethods);

module.exports = { HighLevelProducer };
