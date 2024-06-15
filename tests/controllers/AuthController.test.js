import chai from 'chai';
import chaiHttp from 'chai-http';
import { v4 as uuidv4 } from 'uuid';
import app from '../../server';

chai.use(chaiHttp);
const { expect } = chai;

describe('auth Controller', () => {
  let token;
  const email = `test-${uuidv4()}@example.com`;

  before((done) => {
    chai.request(app)
      .post('/users')
      .send({ email, password: 'testPass123' })
      .end(() => {
        chai.request(app)
          .get('/connect')
          .set('Authorization', `Basic ${Buffer.from(`${email}:testPass123`).toString('base64')}`)
          .end((_err, res) => {
            token = res.body.token;
            done();
          });
      });
  });

  it('GET /connect should authenticate the user', () => new Promise((done) => {
    chai.request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from(`${email}:testPass123`).toString('base64')}`)
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        done();
      });
  }));

  it('GET /disconnect should log out the user', () => new Promise((done) => {
    chai.request(app)
      .get('/disconnect')
      .set('X-Token', token)
      .end((_err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  }));
});
