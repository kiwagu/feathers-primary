import { Server } from 'http';
import logger from '../../../src/logger';
import app from '../../../src/app';
import { user1 } from '../../consts';

import feathers from '@feathersjs/feathers';
import { AuthenticationResult } from '@feathersjs/authentication/lib';
import { getServiceOnWebClient } from './helpers';
import { ProductData } from '../../../src/services/products/products.class';

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
    const title = 'Product 1 title';
    const createResult = await productsServiceOnServer.create({
      title,
      description: 'Description for product 1',
      cost: 100,
    } as ProductData);
    expect(createResult).toBeDefined();

    // Clean created product from db
    const removedProduct1 = await productsServiceOnServer.remove({
      _id: createResult._id,
    });
    expect(removedProduct1).toBeDefined();
    expect(removedProduct1.title).toBe(title);
  });

  describe('process \'products\' service from the web-client', () => {
    let server: Server;

    const port = app.get('port');
    const clientOnWeb = feathers();
    const productsServiceOnWebClient = getServiceOnWebClient(clientOnWeb);

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

    it('doesn\'t process without user authentication', async () => {
      await expect(productsServiceOnWebClient.find()).rejects.toThrow(
        'Not authenticated'
      );
    });

    describe('process with authenticated user', () => {
      const product2: ProductData = {
        title: 'Product 2 title',
        description: 'Description for product 2',
        cost: 200,
      };

      let authenticationResult: AuthenticationResult;

      beforeAll(async () => {
        try {
          await app.service('users').create(user1);
        } catch (error) {
          // Do nothing, it just means the user already exists and can be tested
        }
      });

      beforeEach(async () => {
        authenticationResult = await clientOnWeb.authenticate({
          strategy: 'local',
          email: user1.email,
          password: user1.password,
        });
      });

      afterEach(() => {
        return clientOnWeb.logout();
      });

      it('passes user authentication', async () => {
        expect(authenticationResult).toHaveProperty('accessToken');
        expect(authenticationResult).toHaveProperty('user');
        expect(authenticationResult.user.email).toBe(user1.email);
      });

      it('handles `created` events on the web client', async (done) => {
        // subscribe to the event on the web client side
        productsServiceOnWebClient.on('created', (message) => {
          expect(message.title).toBe(product2.title);
          expect(message.description).toBe(product2.description);
          expect(message.cost).toBe(product2.cost);
        });

        // make the `created` event on the server side
        const createResult = await productsServiceOnServer.create(product2);
        await productsServiceOnServer.remove({
          _id: createResult._id,
        });

        done();
      });
    });
  });
});
