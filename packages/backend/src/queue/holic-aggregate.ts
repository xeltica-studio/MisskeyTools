import { Queue, Worker } from 'bullmq';

import type { MisskeySession, HolicAccount, HolicRecord } from '@prisma/client';

import { getMisskey } from '@/libs/misskey.js';
import { prisma } from '@/libs/prisma.js';
import { connection } from '@/libs/redis.js';
import { queues } from '@/queue/index.js';
import { format } from '@/services/holic/format';
import { avg } from '@/utils/avg.js';
import { toAcct } from '@/utils/to-acct';

const NAME = 'holicAggregate';

export type HolicAggregateQueueType = {
	account: HolicAccount & {
    misskeySession: MisskeySession;
	};
};

export const holicAggregateQueue = new Queue<HolicAggregateQueueType>(NAME, { connection });

export const holicAggregateWorker = new Worker<HolicAggregateQueueType>(NAME, async (job) => {
  // ステータスをお問い合わせ
  const { account } = job.data;
  const { misskeySession: session } = account;
  const data = await getMisskey(session.host).request('i', {}, session.token);
  if (!('notesCount' in data)) {
    job.discard();
    throw new Error(`Endpoint 'i' did not return a detailed user object for @${session.username}@${session.host}.`);
  }
  const records1week = await prisma.holicRecord.findMany({
    where: {
      accountId: session.id,
    },
    orderBy: {
      date: 'desc',
    },
    take: 6,
  });

  // レート計算
  const rating = records1week.length > 0 ? avg([
    ...records1week.map(r => r.notesCount),
    data.notesCount,
  ]) : data.notesCount;

  // 今日分のデータ作成
  const today = await prisma.holicRecord.create({
    data: {
      date: new Date(),
      notesCount: data.notesCount,
      followingCount: data.followingCount,
      followersCount: data.followersCount,
      accountId: session.id,
      rating,
    },
  });

  const yesterday: HolicRecord = records1week[0] ?? {
    id: 0,
    rating: 0,
    date: new Date(),
    accountId: account.misskeySessionId,
    notesCount: 0,
    followingCount: 0,
    followersCount: 0,
  };

  const text = format({
    today,
    yesterday,
    account,
    session,
  });

  const acct = toAcct(session);
  if (account.alertAsNote) {
    queues.holicNoteQueue.add(acct, {
      account,
      session,
      text,
    }, {
      backoff: 5,
      delay: 1000 * 60,
      removeOnComplete: true,
    });
  }

  if (account.alertAsNotification) {
    queues.holicNotificationQueue.add(acct, {
      account,
      session,
      text,
    }, {
      backoff: 5,
      delay: 1000 * 60,
      removeOnComplete: true,
    });
  }
}, {
  connection,
});
