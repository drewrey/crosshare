import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// TODO: was seeing some error in the firestore-debug.log about this being set differently to what was in .firebaserc
// const projectId = 'statstest';

let testEnv: RulesTestEnvironment;
let authedContext: RulesTestContext;
let randomContext: RulesTestContext;

beforeAll(async () => {
  // Looks like they recommend naming this demo-* so that it will error when trying to connect to real resources:
  // https://firebase.google.com/docs/emulator-suite/connect_firestore#choose_a_firebase_project
  testEnv = await initializeTestEnvironment({projectId: 'demo-statstest'});

  authedContext = testEnv.authenticatedContext('mike');
  randomContext = testEnv.unauthenticatedContext();


});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  console.log('AUTHHHH', authedContext);
  const firestore = authedContext.firestore();
  console.log('FIREEEEEE', firestore);
  await assertSucceeds(
    setDoc(doc(firestore, 's/foobar'), {
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
    })
  );
});

test('security rules for querying puzzle stats', async () => {
  // Fails if not correct user
  await assertFails(getDoc(doc(randomContext.firestore(), 's/foobar')));

  // Succeeds
  await assertFails(getDoc(doc(authedContext.firestore(), 's/foobar')));
});
