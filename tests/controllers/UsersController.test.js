import chai from 'chai';
import chaiHttp from 'chai-http';
import { v4 as uuidv4 } from 'uuid';
import app from '../../server';

chai.use(chaiHttp);
const { expect } = chai;

describe('users Controller', () => {
  let token;

  it('pOST /users should create a new user', () => new Promise((done) => {
    const email = `test-${uuidv4()}@example.com`;
    chai.request(app)
      .post('/users')
      .send({ email, password: 'testPass123' })
      .end((_err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('email', email);
        done();
      });
  }));

  it('gET /connect should authenticate the user', () => new Promise((done) => {
    const email = `test-${uuidv4()}@example.com`;
    chai.request(app)
      .post('/users')
      .send({ email, password: 'testPass123' })
      .end(() => {
        chai.request(app)
          .get('/connect')
          .set('Authorization', `Basic ${Buffer.from(`${email}:testPass123`).toString('base64')}`)
          .end((_err, res) => {
            token = res.body.token;
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('token');
            done();
          });
      });
  }));

  it('gET /users/me should return user data', () => new Promise((done) => {
    chai.request(app)
      .get('/users/me')
      .set('X-Token', token)
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('email');
        done();
      });
  }));
});
