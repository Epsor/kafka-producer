# `@epsor/kafka-producer`

The is the packet which has the responsability to encode/decode mesages for/to the event store.

## Usage

- [`@epsor/kafka-producer`](#epsorkafka-producer)
  - [Produce a message](#Produce-a-message)

### Produce a message

```js
import producer from '@epsor/kafka-producer';

const message = {
  version: 'v1.0',
  type: 'user.create',
  fields: {
    uuid: '530c512d-6eb3-4367-a0c1-19938d9b6ff9',
    email: 'ok',
    firstname: 'Jean',
    lastname: 'Michel',
  },
};

(async () => {
  try {
    await producer.produce(message, 'events-v1.0.1');
  } finally {
    producer.close();
  }
})();
```
