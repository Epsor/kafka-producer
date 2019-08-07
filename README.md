[![CircleCI](https://circleci.com/gh/Epsor/kafka-producer.svg?style=svg)](https://circleci.com/gh/Epsor/kafka-producer) [![npm version](https://img.shields.io/npm/v/@epsor/kafka-producer.svg)](https://npmjs.org/package/@epsor/kafka-producer.svg "View this project on npm")

# `@epsor/kafka-producer`

The is the packet which has the responsability to encode/decode mesages for/to the event store.

## Usage

- [`@epsor/kafka-producer`](#epsorkafka-producer)
  - [Produce a message](#Produce-a-message)

### Produce a message

```js
import producer from '@epsor/kafka-producer';
import uuid from 'uuid';

const message = {
  headers: {
    version: 'v1.0',
    type: 'user.created',
    uuid: uuid.v4(),
  },
  uuid: uuid.v4(),
  email: 'ok',
  firstname: 'Jean',
  lastname: 'Michel',
};

(async () => {
  try {
    await producer.produce(message, process.env.EVENT_TOPIC);
  } finally {
    await producer.disconnect();
  }
})();
```
