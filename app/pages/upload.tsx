import { useState, useContext, ReactNode } from 'react';
import Head from 'next/head';
import { css } from '@emotion/core';

import { PuzzleInProgressT } from '../lib/types';
import { importFile } from '../lib/converter';
import { AuthContext, renderLoginButtonIfNeeded } from '../components/AuthContext';
import { DefaultTopBar } from '../components/TopBar';
import { Preview } from '../components/Preview';
import { SMALL_AND_UP } from '../lib/style';

function FeatureList(props: { children: ReactNode }) {
  return <div css={{
    [SMALL_AND_UP]: {
      width: '30%',
    }
  }}>{props.children}</div>;
}

export const featureImage = css`
  width: 100%;
  height: auto;
  margin: 0 auto 1em auto;
  display: block;
  border: 1px solid var(--default-text);
  box-shadow: 2px 2px 2px var(--default-text);
`;

export default function UploadPage() {
  const ctx = useContext(AuthContext);

  const [puzzle, setPuzzle] = useState<PuzzleInProgressT | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginButton = renderLoginButtonIfNeeded(ctx);

  function handleFile(f: FileList | null) {
    if (!f) {
      setError('No file selected');
      return;
    }
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      if (!fileReader.result) {
        setError('No file result');
      } else if (typeof (fileReader.result) === 'string') {
        setError('Failed to read as binary');
      } else {
        try {
          const puzzle = importFile(new Uint8Array(fileReader.result));
          if (!puzzle) {
            setError('Failed to parse file');
          } else {
            setPuzzle(puzzle);
          }
        } catch (error) {
          console.error(error);
          setError(error.message || 'Could not import file');
        }
      }
    };
    fileReader.readAsArrayBuffer(f[0]);
  }

  if (puzzle && ctx.user) {
    return <Preview user={ctx.user} isAdmin={ctx.isAdmin} {...puzzle} />;
  }

  const description = 'Import your existing puzzle to share it on Crosshare. Get your .puz files playable on the web. Crosshare gives your solvers a first-class experience on any device, and gives you access to statistics about solves.';
  return <>
    <Head>
      <title>Upload/Import Crossword Puzzles | Crosshare</title>
      <meta key="og:title" property="og:title" content='Crosshare Crossword Upload / Import' />
      <meta key="description" name="description" content={description} />
      <meta key="og:description" property="og:description" content={description} />
    </Head>
    <DefaultTopBar />
    <div css={{ margin: '1em' }}>
      {error ?
        <>
          <p css={{ color: 'var(--error)' }}>{error}</p>
          <p>If your puzzle isn&apos;t uploading correctly please message us on twitter or in the google group so we can help!</p>
        </>
        : ''}
      {ctx.loadingUser ?
        <></>
        :
        (
          loginButton ?
            <>
              < p > To upload a puzzle, you need to log in with Google first. We use your sign in to keep track of the puzzles you&apos;ve uploaded.</p>
              {loginButton}
            </>
            :
            <>
              <label>
                <p>Select a .puz file to upload. Additional file formats will be supported soon - please let us know if there&apos;s one you&apos;d like to see next!</p>
                <input css={{ width: '100%', overflow: 'none' }} type='file' accept='.puz' onChange={e => handleFile(e.target.files)} />
              </label>
            </>
        )
      }
      <div css={{
        marginTop: '1em',
        [SMALL_AND_UP]: {
          display: 'flex',
          justifyContent: 'space-between',
        }
      }}>
        <FeatureList>
          <h3 css={{ textAlign: 'center' }}>Solve Anywhere</h3>
          <img css={[featureImage, { width: '50%' }]} src="/phoneshot.png" alt="Crosshare on mobile phone" />
          <p>Crosshare&apos;s solving interface is mobile-first and makes solving your puzzle as smooth as possible on any device.</p>
        </FeatureList>
        <FeatureList>
          <h3 css={{ textAlign: 'center' }}>Share</h3>
          <img css={featureImage} src="/tweet.png" alt="Crosshare tweet" />
          <p>Crosshare puzzles are made to share. Our search engine optimization and social tags will get as many people solving your puzzle as possible.</p>
        </FeatureList>
        <FeatureList>
          <h3 css={{ textAlign: 'center' }}>Track Solves</h3>
          <img css={featureImage} src="/heatmap.png" alt="Crosshare heatmap" />
          <p>As a constructor, you get access to advanced analytics about your puzzle. Find out how many people solve your puzzle, how long it takes them, and view heatmaps of exactly which cells they get stuck on.</p>
        </FeatureList>
      </div>
      <h2>Sharing puzzles on Crosshare is always free.</h2>
    </div >
  </>;
}