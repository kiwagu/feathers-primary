import app from '../src/app';
import { user1 } from './consts';

describe('authentication', () => {
  it('registered the authentication service', () => {
    expect(app.service('authentication')).toBeTruthy();
  });

  describe('local strategy', () => {
    beforeAll(async () => {
      try {
        await app.service('users').create(user1);
      } catch (error) {
        // Do nothing, it just means the user already exists and can be tested
      }
    });

    it('authenticates user and creates accessToken', async () => {
      const { user, accessToken } = await app.service('authentication').create({
        strategy: 'local',
        ...user1
      }, {});

      expect(accessToken).toBeTruthy();
      expect(user).toBeTruthy();
    });
  });
});
