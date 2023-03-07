/**
 * @jest-environment node
 */

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { PlayT, LegacyPlayT, DBPuzzleT } from '../lib/dbtypes';
import { runAnalytics } from '../lib/analytics';
import { initializeApp } from 'firebase-admin/app';
import { beforeAll, beforeEach } from '@jest/globals';
import { Timestamp } from '../lib/timestamp';

import { getCollection, getDoc, updateDoc } from '../lib/firebaseWrapper';

// todo: move this to firebasewrapper?
import { getDocs, getDoc as gD } from 'firebase/firestore';

let play1: PlayT;
let play2: LegacyPlayT;
let play3: LegacyPlayT;

const projectId = 'analyticstest';
beforeAll(async () => {
  initializeApp({ projectId }, projectId);
});

const thirtyAgo = new Date();
thirtyAgo.setMinutes(thirtyAgo.getMinutes() - 30);
const twentyAgo = new Date();
twentyAgo.setMinutes(twentyAgo.getMinutes() - 20);

beforeEach(async () => {
  const testEnv = await initializeTestEnvironment({ projectId });
  await testEnv.clearFirestore();

  play1 = {
    c: 'mike',
    u: 'blah',
    ua: Timestamp.fromDate(twentyAgo),
    g: [],
    ct: [1, 2, 4, 100, 100].concat(new Array(20).fill(100)),
    uc: [5, 2].concat(new Array(23).fill(1)),
    vc: [],
    wc: [],
    we: [],
    rc: [],
    t: 70,
    ch: true,
    f: true,
    n: 'Puzzle title',
  };
  await updateDoc('p', 'mike-blah', play1);

  play2 = {
    c: 'mike',
    u: 'anonymous-user-id',
    ua: Timestamp.fromDate(thirtyAgo),
    g: [],
    ct: [],
    uc: [],
    vc: [],
    wc: [],
    we: [],
    rc: [],
    t: 44,
    ch: false,
    f: true,
  };
  // await firestore().collection('p').doc('mike-anonymous-user-id').set(play2);
  // TODO: do we need to use merge: true here?
  await updateDoc('p', 'mike-anonymous-user-id', play2);
  // Since play2 is a LegacyPlayT, getPlays() will look up the puzzle to get a title
  const puzzle: DBPuzzleT = {
    ct_ans: ['just A GUESS'],
    c: null,
    m: true,
    t: 'Raises, as young',
    dn: [1, 2, 3, 4, 5],
    ac: [
      " Cobbler's forms",
      'Absolutely perfect',
      'Spike Lee\'s "She\'s ___ Have It"',
      'English class assignment',
      'Raises, as young',
    ],
    dc: [
      'Hybrid whose father is a lion',
      '___ of reality (wake-up call)',
      '___ date (makes wedding plans)',
      'Middle Ages invader',
      'Has a great night at the comedy club',
    ],
    p: Timestamp.fromDate(new Date('6/10/2020')),
    a: 'fSEwJorvqOMK5UhNMHa4mu48izl1',
    an: [1, 6, 7, 8, 9],
    g: [
      'L',
      'A',
      'S',
      'T',
      'S',
      'I',
      'D',
      'E',
      'A',
      'L',
      'G',
      'O',
      'T',
      'T',
      'A',
      'E',
      'S',
      'S',
      'A',
      'Y',
      'R',
      'E',
      'A',
      'R',
      'S',
    ],
    h: 5,
    w: 5,
    cs: [
      {
        c: "A couple of two-worders today which I don't love, but I hope you all got it anyway!",
        i: 'LwgoVx0BAskM4wVJyoLj',
        t: 36.009,
        p: Timestamp.now(),
        a: 'fSEwJorvqOMK5UhNMHa4mu48izl1',
        n: 'Mike D',
        ch: false,
      },
    ],
    n: 'Mike D',
    pv: true,
  };
  await updateDoc('c', 'mike', puzzle);

  play3 = {
    c: 'mike',
    u: 'other-user-id',
    ua: Timestamp.fromDate(twentyAgo),
    g: [],
    ct: [],
    uc: [],
    vc: [],
    wc: [],
    we: [],
    rc: [],
    t: 44,
    ch: false,
    f: true,
  };
  await updateDoc('c', 'mike-other-user-id', play3);
});

test('run for all time w/o initial state', async () => {
  const hourAgo = new Date();
  hourAgo.setMinutes(hourAgo.getMinutes() - 60);

  await runAnalytics(
    Timestamp.fromDate(hourAgo),
    Timestamp.fromDate(new Date())
  );

  const res = await getDocs(getCollection('ds'));
  expect(res.size).toEqual(1);
  // Can't snapshot updatedAt or playcount by hour
  const { ua, h, ...toSnapshot } = res.docs[0]?.data() ?? {};
  expect(ua).not.toBeFalsy();
  expect(h.length).toEqual(24);
  expect(toSnapshot).toMatchSnapshot();

  // const pres = await firestore().collection('s').doc('mike').get();
  // TODO: change this back to the former semantics
  const pres = await getDocs(getCollection('s'));
  let data;
  pres.forEach((doc) => {
    console.log(doc.id, '=>', doc.data()); 
    data = doc.data();
  });

  if (data === undefined) {
    throw new Error('botch');
  }
  // TOOD: fix this
  const { ua: pua, sct, ...pToSnapshot } = data as object;
  expect(pua).not.toBeFalsy();
  expect(sct).not.toBeFalsy();
  expect(pToSnapshot).toMatchSnapshot();

  const cres = await getDocs(getCollection('cs'));
  expect(cres.size).toEqual(1);
  // Can't snapshot updatedAt or playcount by hour
  const ctoSnapshot = cres.docs[0]?.data() ?? {};
  expect(ctoSnapshot).toMatchSnapshot();
  expect(cres.docs[0]?.id).toMatchSnapshot();
});

test('run for all time w/ some meta submissions', async () => {
  const hourAgo = new Date();
  hourAgo.setMinutes(hourAgo.getMinutes() - 60);

  await updateDoc('p', 'mike-other-user-id', {
      ct_sub: 'my submission',
      ct_t: Timestamp.fromDate(twentyAgo),
      ct_n: 'Mike D',
  });

  await updateDoc('p', 'mike-blah', {
      ct_sub: 'just a guess',
      ct_em: 'foo@example.com',
      ct_t: Timestamp.fromDate(twentyAgo),
      ct_n: 'Blah',
  });

  await runAnalytics(
    Timestamp.fromDate(hourAgo),
    Timestamp.fromDate(new Date())
  );

  const res = await getDocs(getCollection('ds'));
  expect(res.size).toEqual(1);
  // Can't snapshot updatedAt or playcount by hour
  const { ua, h, ...toSnapshot } = res.docs[0]?.data() ?? {};
  expect(ua).not.toBeFalsy();
  expect(h.length).toEqual(24);
  expect(toSnapshot).toMatchSnapshot();

  const pres = await gD(getDoc('s', 'mike'));
  const data = pres.data();
  if (data === undefined) {
    throw new Error('botch');
  }
  const { ua: pua, sct, ...pToSnapshot } = data;
  expect(pua).not.toBeFalsy();
  expect(sct).not.toBeFalsy();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pToSnapshot.ct_subs.forEach((a: any) => {
    a.t = null;
  });
  expect(pToSnapshot).toMatchSnapshot();

  const puzres = await gD(getDoc('c', 'mike'));
  const puzdata = puzres.data();
  if (puzdata === undefined) {
    throw new Error('botch');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  puzdata.ct_subs.forEach((a: any) => {
    a.t = null;
  });
  expect(puzdata.ct_subs).toMatchSnapshot();

  // Just run it again w/ new submission values:
  // TODO: need to make this a merge
  await updateDoc('c', 'mike-other-user-id', {
    ct_sub: 'my submission 2'
  });
  await updateDoc('p', 'mike-blah', {
    ct_sub: 'just a guess 2',
  });
  await runAnalytics(
    Timestamp.fromDate(hourAgo),
    Timestamp.fromDate(new Date())
  );

  const pres1 = await gD(getDoc('s', 'mike'));
  const data1 = pres1.data();
  if (data1 === undefined) {
    throw new Error('botch');
  }
  const { ua: pua1, sct: sct1, ...pToSnapshot1 } = data1;
  expect(pua1).not.toBeFalsy();
  expect(sct1).not.toBeFalsy();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pToSnapshot1.ct_subs.forEach((a: any) => {
    a.t = null;
  });
  expect(pToSnapshot1).toMatchSnapshot();

  const puzres1 = await gD(getDoc('s', 'mike'));
  const puzdata1 = puzres1.data();
  if (puzdata1 === undefined) {
    throw new Error('botch');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  puzdata1.ct_subs.forEach((a: any) => {
    a.t = null;
  });
  expect(puzdata1.ct_subs).toMatchSnapshot();

  const cres = await getDocs(getCollection('cs'));
  expect(cres.size).toEqual(1);
  // Can't snapshot updatedAt or playcount by hour
  const ctoSnapshot = cres.docs[0]?.data() ?? {};
  expect(ctoSnapshot).toMatchSnapshot();
  expect(cres.docs[0]?.id).toMatchSnapshot();

  // Now add one more correct, change one to correct, and add a reveal:
  const play3 = {
      c: 'mike',
      u: 'foo-bar',
      ua: Timestamp.fromDate(twentyAgo),
      g: [],
      ct: [],
      uc: [],
      vc: [],
      wc: [],
      we: [],
      rc: [],
      t: 44,
      ch: false,
      f: true,
      ct_sub: 'just a guess',
      ct_em: 'foobar@example.com',
      ct_t: Timestamp.fromDate(twentyAgo),
      ct_n: 'FOOBAR',
};

  await updateDoc('p', 'mike-foo-bar', play3);

  await updateDoc('p', 'mike-blah', {ct_sub: 'just a guess'});

  const play4 = {
    c: 'mike',
    u: 'i-revealed',
    ua: Timestamp.fromDate(twentyAgo),
    g: [],
    ct: [],
    uc: [],
    vc: [],
    wc: [],
    we: [],
    rc: [],
    t: 44,
    ch: false,
    f: true,
    ct_rv: true,
    ct_t: Timestamp.fromDate(twentyAgo),
    ct_n: 'Revealing',
  };

  await updateDoc('p', 'mike-i-revealed', play4);

  await runAnalytics(
    Timestamp.fromDate(hourAgo),
    Timestamp.fromDate(new Date())
  );

  const pres2 = await gD(getDoc('s', 'mike'));
  const data2 = pres2.data();
  if (data2 === undefined) {
    throw new Error('botch');
  }
  const { ua: pua2, sct: sct2, ...pToSnapshot2 } = data2;
  expect(pua2).not.toBeFalsy();
  expect(sct2).not.toBeFalsy();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pToSnapshot2.ct_subs.forEach((a: any) => {
    a.t = null;
  });
  expect(pToSnapshot2).toMatchSnapshot();

  const puzres2 = await gD(getDoc('s', 'mike'));
  const puzdata2 = puzres2.data();
  if (puzdata2 === undefined) {
    throw new Error('botch');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  puzdata2.ct_subs.forEach((a: any) => {
    a.t = null;
  });
  expect(puzdata2.ct_subs).toMatchSnapshot();

  const cres2 = await getDocs(getCollection('cs'));
  expect(cres2.size).toEqual(1);
  // Can't snapshot updatedAt or playcount by hour
  const ctoSnapshot2 = cres2.docs[0]?.data() ?? {};
  expect(ctoSnapshot2).toMatchSnapshot();
  expect(cres2.docs[0]?.id).toMatchSnapshot();
});

test('run for more recent w/o initial state', async () => {
  const twentyFive = new Date();
  twentyFive.setMinutes(twentyFive.getMinutes() - 25);

  await runAnalytics(
    Timestamp.fromDate(twentyFive),
    Timestamp.fromDate(new Date())
  );

  // const res = await firestore().collection('ds').get();
  const res = await getDocs(getCollection('ds'));
  expect(res.size).toEqual(1);
  // Can't snapshot updatedAt or playcount by hour
  const { ua, h, ...toSnapshot } = res.docs[0]?.data() ?? {};
  expect(ua).not.toBeFalsy();
  expect(h.length).toEqual(24);
  expect(toSnapshot).toMatchSnapshot();

  const pres = await gD(getDoc('s', 'mike'));
  const data = pres.data();
  if (data === undefined) {
    throw new Error('botch');
  }
  const { ua: pua, sct, ...pToSnapshot } = data;
  expect(pua).not.toBeFalsy();
  expect(sct).not.toBeFalsy();
  expect(pToSnapshot).toMatchSnapshot();
});

test('run w/ initial state', async () => {
  const hourAgo = new Date();
  hourAgo.setMinutes(hourAgo.getMinutes() - 60);

  // Just run twice in a row w/ same timestamp so we read each play twice.
  await runAnalytics(
    Timestamp.fromDate(hourAgo),
    Timestamp.fromDate(new Date())
  );
  await runAnalytics(
    Timestamp.fromDate(hourAgo),
    Timestamp.fromDate(new Date())
  );

  const res = await getDocs(getCollection('ds'));
  expect(res.size).toEqual(1);
  // Can't snapshot updatedAt or playcount by hour
  const { ua, h, ...toSnapshot } = res.docs[0]?.data() ?? {};
  expect(ua).not.toBeFalsy();
  expect(h.length).toEqual(24);
  expect(toSnapshot).toMatchSnapshot();

  const pres = await gD(getDoc('s', 'mike'));
  const data = pres.data();
  if (data === undefined) {
    throw new Error('botch');
  }
  const { ua: pua, sct, ...pToSnapshot } = data;
  expect(pua).not.toBeFalsy();
  expect(sct).not.toBeFalsy();
  expect(pToSnapshot).toMatchSnapshot();
});
