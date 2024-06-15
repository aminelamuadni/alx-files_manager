import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server';

chai.use(chaiHttp);
const { expect } = chai;

describe('app Controller', () => {
  it('GET /status should return the status of Redis and DB', () => new Promise((done) => {
    chai.request(app)
      .get('/status')
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('redis', true);
        expect(res.body).to.have.property('db', true);
        done();
      });
  }));

  it('GET /stats should return the stats of users and files', () => new Promise((done) => {
    chai.request(app)
      .get('/stats')
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('users');
        expect(res.body).to.have.property('files');
        done();
      });
  }));
});
