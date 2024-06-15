import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('dB Client', () => {
  it('should confirm MongoDB is connected', () => {
    const isAlive = dbClient.isAlive();
    expect(isAlive).to.be.true;
  });

  it('should count the number of users', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.a('number');
  });

  it('should count the number of files', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.a('number');
  });
});
