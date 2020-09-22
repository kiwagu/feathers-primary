import { Server } from 'http';
import logger from '../../src/logger';
import app from '../../src/app';

import io from 'socket.io-client';
import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';

// TODO: define TS types

const delay = (timeout = 1000) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

describe('\'products\' service', () => {
  let productsServiceOnServer;

  beforeAll(async () => {
    productsServiceOnServer = app.service('products');
  });

  it('registered the products service', () => {
    expect(productsServiceOnServer).toBeTruthy();
  });

  it('creates and processes product', async () => {
    const title = 'Product 123456';
    const product = await productsServiceOnServer.create({
      title,
      description: 'Description for product 1',
      cost: 100,
    });
    expect(product).toBeDefined();

    // Clean created product from db
    const removedProduct = await productsServiceOnServer.remove({
      _id: product._id,
    });
    expect(removedProduct).toBeDefined();
    expect(removedProduct.title).toBe(title);
  });

  describe('process \'products\' service from the web-client', () => {

    let server: Server;

    const port = app.get('port');
    const socket = io(`http://localhost:${port}`);
    const client = feathers();

    client.configure(socketio(socket));

    const productsServiceOnWebClient = client.service('products');

    beforeAll(async () => {
      server = app.listen(port);

      process.on('unhandledRejection', (reason, p) =>
        logger.error('Unhandled Rejection at: Promise ', p, reason)
      );

      server.once('listening', () => {
        logger.info(
          'Feathers application started on http://%s:%d',
          app.get('host'),
          port
        );
      });

      // wait for server initialization
      await delay();
    });

    afterAll(() => {
      server.close();
      setImmediate(() => {
        server.emit('close');
      });
    });

    it('doesn\'t process without user authentitication', async () => {
      await expect(productsServiceOnWebClient.find()).rejects.toThrow('Not authenticated');
    });
  });
});
