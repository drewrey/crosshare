import { DBPuzzleT, CommentWithRepliesT, FollowersV } from './dbtypes';
import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import {
  PuzzleWithID,
  NotificationT,
  commentNotification,
  replyNotification,
  NewPuzzleNotificationT,
  newPuzzleNotification,
  featuredNotification,
} from './notificationTypes';
import { getCollection } from './firebaseAdminWrapper';

function checkComments(
  after: Array<CommentWithRepliesT>,
  before: Array<CommentWithRepliesT> | undefined,
  puzzle: PuzzleWithID,
  parent?: CommentWithRepliesT
): Array<NotificationT> {
  const notifications: Array<NotificationT> = [];
  for (const comment of after) {
    const beforeComment = before?.find(
      (beforeComment) => beforeComment.i === comment.i
    );
    if (!beforeComment) {
      // Don't notify on your own comment
      if (comment.a !== puzzle.a) {
        notifications.push(commentNotification(comment, puzzle));
      }
      // If it's your puzzle we already notified as a comment (not reply) above
      if (parent && comment.a !== parent.a && parent.a !== puzzle.a) {
        notifications.push(replyNotification(comment, parent, puzzle));
      }
    } else if (comment.r) {
      notifications.push(
        ...checkComments(comment.r, beforeComment.r, puzzle, comment)
      );
    }
  }
  return notifications;
}

async function notificationsForPuzzleCreation(
  puzzle: DBPuzzleT,
  puzzleId: string
): Promise<Array<NewPuzzleNotificationT>> {
  console.log('checking for puzzle creation', `followers/${puzzle.a}`);
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (puzzle.pv) {
    return [];
  }
  const followersRes = await getCollection('followers').doc(puzzle.a).get();
  if (!followersRes.exists) {
    console.log('no followers doc');
    return [];
  }

  const validationResult = FollowersV.decode(followersRes.data());
  if (!isRight(validationResult)) {
    console.error('could not decode followers for', puzzle.a);
    console.error(PathReporter.report(validationResult).join(','));
    return [];
  }
  const followers = validationResult.right.f;
  if (!followers) {
    console.log('no followers');
    return [];
  }
  console.log(followers.length, 'followers');
  return followers.map((followerId) =>
    newPuzzleNotification({ ...puzzle, id: puzzleId }, followerId)
  );
}

export async function notificationsForPuzzleChange(
  before: DBPuzzleT | null,
  after: DBPuzzleT,
  puzzleId: string
): Promise<Array<NotificationT>> {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (before === null || (before.pv === true && !after.pv)) {
    return notificationsForPuzzleCreation(after, puzzleId);
  }

  const withID = { ...after, id: puzzleId };
  const notifications = [];
  if (after.cs) {
    notifications.push(...checkComments(after.cs, before.cs, withID));
  }

  if (after.f && !before.f) {
    notifications.push(featuredNotification(withID, null));
  } else if (after.dmd && !before.dmd) {
    notifications.push(
      featuredNotification(withID, `the daily mini for ${after.dmd}`)
    );
  }

  return notifications;
}
