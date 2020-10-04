import { useCallback, useState, useEffect } from 'react';
import * as Sentry from '@sentry/node';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import NextJSRouter from 'next/router';
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-image-crop/dist/ReactCrop.css';

import * as gtag from '../lib/gtag';
import { useAuth } from '../lib/hooks';
import { AuthContext } from '../components/AuthContext';
import { CrosshareAudioContext } from '../components/CrosshareAudioContext';

import '../lib/style.css';

if (process.env.NODE_ENV === 'production' && typeof Sentry !== 'undefined') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    ignoreErrors: [
      'ResizeObserver loop completed with undelivered notifications',
      'ResizeObserver loop limit exceeded',
      'A mutation operation was attempted on a database that did not allow mutations',
      'is not a valid value for enumeration ScrollLogicalPosition',
      'Extension context invalidated',
    ]
  });
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric);
  if (process.env.NODE_ENV !== 'production' && metric.name === 'CLS' && metric.value) {
    console.error('NONZERO CLS ', metric.value);
  }
}

// `err` is a workaround for https://github.com/vercel/next.js/issues/8592
export default function CrosshareApp({ Component, pageProps, err }: AppProps & { err: Error }): JSX.Element {
  let authStatus = useAuth();
  const [loading, setLoading] = useState(false);

  if (typeof window === 'undefined') {
    authStatus = { loading: true, isAdmin: false, user: undefined, constructorPage: undefined, notifications: [], error: undefined };
  }

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const initAudioContext = useCallback(() => {
    if (!audioContext) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const constructor = window.AudioContext || (window as any).webkitAudioContext;
      setAudioContext(new constructor());
    }
  }, [audioContext, setAudioContext]);

  useEffect(() => {
    const handleStart = () => {
      setLoading(true);
    };
    const handleError = () => {
      setLoading(false);
    };
    const handleRouteChange = (url: string) => {
      setLoading(false);
      gtag.pageview(url);
    };
    NextJSRouter.events.on('routeChangeStart', handleStart);
    NextJSRouter.events.on('routeChangeComplete', handleRouteChange);
    NextJSRouter.events.on('routeChangeError', handleError);

    return () => {
      NextJSRouter.events.off('routeChangeStart', handleStart);
      NextJSRouter.events.off('routeChangeComplete', handleRouteChange);
      NextJSRouter.events.off('routeChangeError', handleError);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Crosshare - Free Crossword Constructor and Daily Mini Crossword Puzzles</title>
        <meta key="og:title" property="og:title" content="Crosshare Crosswords" />
        <meta key="description" name="description" content="Crosshare is a community for crossword constructors and solvers. Each day we post a new mini crossword puzzle you can play for free." />
        <meta key="og:description" property="og:description" content="Crosshare is a community for crossword constructors and solvers. Each day we post a new mini crossword puzzle you can play for free." />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, height=device-height" />
        <meta property="fb:pages" content="100687178303443" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@crosshareapp" />
        <meta key="og:image" property="og:image" content="https://crosshare.org/apple-splash-1334-750.png" />
        <meta property="og:image:type" content="image/png" />
        <meta key="og:image:width" property="og:image:width" content="1334" />
        <meta key="og:image:height" property="og:image:height" content="750" />
        <meta key="og:image:alt" property="og:image:alt" content="The crosshare logo" />
      </Head>
      <CrosshareAudioContext.Provider value={[audioContext, initAudioContext]}>
        <AuthContext.Provider value={authStatus}>
          <ToastContainer />
          <Component {...pageProps} err={err} />
        </AuthContext.Provider>
      </CrosshareAudioContext.Provider>
      {loading ?
        <div css={{
          position: 'fixed',
          bottom: '1em',
          left: '1em',
        }} className='snack-bar Toastify__toast'>Loading...</div>
        : ''}
    </>
  );
}
