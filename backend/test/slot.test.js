const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { AvailabilitySlotModel, UserModel } = require('../src/models');
const { signToken } = require('../src/middleware/auth');

const originals = {
  findById: AvailabilitySlotModel.findById,
  search: AvailabilitySlotModel.search,
  checkOverlap: AvailabilitySlotModel.checkOverlap,
  create: AvailabilitySlotModel.create,
  update: AvailabilitySlotModel.update,
  updateStatus: AvailabilitySlotModel.updateStatus,
  userFindById: UserModel.findById
};

const slot = {
  id: 31,
  tutor_id: 7,
  subject: 'Algebra',
  start_time: '2030-01-01T10:00:00.000Z',
  end_time: '2030-01-01T11:00:00.000Z',
  duration_minutes: 60,
  status: 'available'
};

const tutorToken = signToken({
  sub: 7,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
});

const otherTutorToken = signToken({
  sub: 8,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
});

beforeEach(() => {
  AvailabilitySlotModel.findById = async (id) =>
    Number(id) === slot.id ? slot : null;

  AvailabilitySlotModel.search = async () => [slot];

  AvailabilitySlotModel.checkOverlap = async () => false;

  AvailabilitySlotModel.create = async (values) => ({
    id: 32,
    ...values,
    status: 'available'
  });

  AvailabilitySlotModel.update = async (id, values) => ({
    ...slot,
    id,
    ...values
  });

  AvailabilitySlotModel.updateStatus = async (id, status) => ({
    ...slot,
    id,
    status
  });

  UserModel.findById = async (id) => {
    if (id === 7) {
      return {
        id: 7,
        name: 'Test Tutor',
        email: 'tutor7@example.com',
        role: 'tutor',
        is_verified: true
      };
    }

    if (id === 8) {
      return {
        id: 8,
        name: 'Other Tutor',
        email: 'tutor8@example.com',
        role: 'tutor',
        is_verified: true
      };
    }

    return null;
  };
});

afterEach(() => {
  AvailabilitySlotModel.findById = originals.findById;
  AvailabilitySlotModel.search = originals.search;
  AvailabilitySlotModel.checkOverlap = originals.checkOverlap;
  AvailabilitySlotModel.create = originals.create;
  AvailabilitySlotModel.update = originals.update;
  AvailabilitySlotModel.updateStatus = originals.updateStatus;
  UserModel.findById = originals.userFindById;
});

test('slot search returns matching slots and a count', async () => {
  const response = await request(app).get('/api/slots?subject=Algebra');

  assert.equal(response.status, 200);
  assert.equal(response.body.count, 1);
  assert.equal(response.body.data[0].subject, 'Algebra');
});

test('slot search rejects invalid filters before querying the model', async () => {
  AvailabilitySlotModel.search = async () =>
    assert.fail('invalid filters must not query slots');

  const response = await request(app).get('/api/slots?minRating=6');

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('slot details return 404 for a missing slot', async () => {
  const response = await request(app).get('/api/slots/404');

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'SLOT_NOT_FOUND');
});

test('creating a slot requires authentication', async () => {
  const response = await request(app)
    .post('/api/slots')
    .send({
      subject: 'Algebra',
      startTime: '2030-01-01T10:00:00.000Z',
      durationMinutes: 60
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('creating a valid slot records it for the signed-in tutor', async () => {
  let createValues;

  AvailabilitySlotModel.create = async (values) => {
    createValues = values;
    return {
      id: 32,
      ...values,
      status: 'available'
    };
  };

  const response = await request(app)
    .post('/api/slots')
    .set('Authorization', `Bearer ${tutorToken}`)
    .send({
      subject: 'Algebra',
      startTime: '2030-01-01T10:00:00.000Z',
      durationMinutes: 60
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.tutorId, 7);
  assert.equal(createValues.tutorId, 7);
  assert.equal(createValues.durationMinutes, 60);
});

test('creating an overlapping slot returns 409', async () => {
  AvailabilitySlotModel.checkOverlap = async () => true;

  const response = await request(app)
    .post('/api/slots')
    .set('Authorization', `Bearer ${tutorToken}`)
    .send({
      subject: 'Algebra',
      startTime: '2030-01-01T10:00:00.000Z',
      durationMinutes: 60
    });

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'SLOT_OVERLAP');
});

test('a tutor cannot edit another tutor\'s slot', async () => {
  const response = await request(app)
    .put('/api/slots/31')
    .set('Authorization', `Bearer ${otherTutorToken}`)
    .send({
      subject: 'Algebra',
      startTime: '2030-01-01T10:00:00.000Z',
      durationMinutes: 60
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
});

test('a tutor can remove their available slot', async () => {
  const response = await request(app)
    .delete('/api/slots/31')
    .set('Authorization', `Bearer ${tutorToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.status, 'removed');
});