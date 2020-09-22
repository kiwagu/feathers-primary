import app from '../../../../src/app';

import io from 'socket.io-client';
import feathers, { Service } from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import auth from '@feathersjs/authentication-client';

export const getServiceOnWebClient = (
  clientOnWeb: feathers.Application<any>
): Service<any> => {
  const port = app.get('port');
  const socket = io(`http://localhost:${port}`, {
    transports: ['websocket'],
  });
  clientOnWeb.configure(socketio(socket, { timeout: 600000 }));
  clientOnWeb.configure(auth());

  return clientOnWeb.service('products');
};
