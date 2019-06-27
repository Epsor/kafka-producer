export const ProducerSend = jest.fn();
export const ClientClose = jest.fn();

export const KafkaClient = jest.fn().mockImplementation(() => {
  return { close: ClientClose };
});
export const Producer = jest.fn().mockImplementation(() => {
  return { send: ProducerSend };
});

module.exports = { KafkaClient, Producer };
