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
    type: 'user.create',
    uuid: uuid.v4(),
  },
  uuid: uuid.v4(),
  email: 'ok',
  firstname: 'Jean',
  lastname: 'Michel',
};

(async () => {
  try {
    await producer.produce(message, 'events-v1.0.2');
  } finally {
    await producer.disconnect();
  }
})();
```
