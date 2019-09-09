const Producer = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  on: jest.fn((event, cb) => {
    if (event === 'ready') cb();
  }),
}));
const KafkaClient = jest.fn();

module.exports = {
  Producer,
  KafkaClient,
};
