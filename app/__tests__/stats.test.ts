import * as firebaseTesting from '@firebase/rules-unit-testing';
import type firebase from 'firebase/compat/app';
import type firebaseAdminType from 'firebase-admin';

jest.mock('../lib/firebaseWrapper');

const projectId = 'statstest';

afterEach(() => {
  jest.clearAllMocks();
});

let randoApp: firebase.app.App,
  app: firebase.app.App,
  admin: firebaseAdminType.app.App;

beforeAll(async () => {
  randoApp = firebaseTesting.initializeTestApp({
    projectId,
  }) as firebase.app.App;
  app = firebaseTesting.initializeTestApp({
    projectId,
    auth: {
      uid: 'mike',
      firebase: {
        sign_in_provider: 'google.com',
      },
    },
  }) as firebase.app.App;
  admin = firebaseTesting.initializeAdminApp({
    projectId,
  }) as unknown as firebaseAdminType.app.App;
});

afterAll(async () => {
  await app.delete();
  await admin.delete();
  await randoApp.delete();
});

beforeEach(async () => {
  const testEnv = await firebaseTesting.initializeTestEnvironment({ projectId });
  await testEnv.clearFirestore();

  await admin
    .firestore()
    .doc('s/foobar')
    .set({
      a: 'mike',
      ct: [
        0.01, 0.02, 0.04, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1,
      ],
      n: 3,
      nt: 158,
      s: 2,
      st: 88,
      uc: [
        1, 0.4, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
        0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2,
      ],
    });
});

test('security rules for querying puzzle stats', async () => {
  // Fails if not correct user
  await firebaseTesting.assertFails(randoApp.firestore().doc('s/foobar').get());

  // Succeeds
  await firebaseTesting.assertSucceeds(app.firestore().doc('s/foobar').get());
});
