import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('redis Client', () => {
  it('should confirm Redis is alive', () => {
    const isAlive = redisClient.isAlive();
    expect(isAlive).to.be.true;
  });

  it('should set and get a value', async () => {
    await redisClient.set('testKey', 'testValue', 10);
    const value = await redisClient.get('testKey');
    expect(value).to.equal('testValue');
  });

  it('should delete a value', async () => {
    await redisClient.set('testKeyToDelete', 'testValue', 10);
    await redisClient.del('testKeyToDelete');
    const value = await redisClient.get('testKeyToDelete');
    expect(value).to.be.null;
  });
});
