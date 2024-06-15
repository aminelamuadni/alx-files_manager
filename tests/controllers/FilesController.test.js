import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../../server';

chai.use(chaiHttp);
const { expect } = chai;

describe('files Controller', () => {
  let token;
  let fileId;

  before((done) => {
    chai.request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from('test@example.com:testPass123').toString('base64')}`)
      .end((_err, res) => {
        token = res.body.token;
        done();
      });
  });

  it('pOST /files should upload a new file', () => new Promise((done) => {
    chai.request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'test.txt', type: 'file', data: 'dGVzdCBjb250ZW50' })
      .end((_err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        fileId = res.body.id;
        done();
      });
  }));

  it('gET /files/:id should retrieve the file', () => new Promise((done) => {
    chai.request(app)
      .get(`/files/${fileId}`)
      .set('X-Token', token)
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('name', 'test.txt');
        done();
      });
  }));

  it('pUT /files/:id/publish should publish the file', () => new Promise((done) => {
    chai.request(app)
      .put(`/files/${fileId}/publish`)
      .set('X-Token', token)
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('isPublic', true);
        done();
      });
  }));

  it('pUT /files/:id/unpublish should unpublish the file', () => new Promise((done) => {
    chai.request(app)
      .put(`/files/${fileId}/unpublish`)
      .set('X-Token', token)
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('isPublic', false);
        done();
      });
  }));

  it('gET /files/:id/data should retrieve the file data', () => new Promise((done) => {
    chai.request(app)
      .get(`/files/${fileId}/data`)
      .set('X-Token', token)
      .end((_err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  }));
});
