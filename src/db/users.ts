/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './index.ts';
import { users, gameSaves } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: email || 'anonymous@player.local',
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || 'anonymous@player.local',
          displayName: displayName || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function saveGameForUser(uid: string, email: string, saveData: string) {
  try {
    const user = await getOrCreateUser(uid, email);
    const existing = await db.select().from(gameSaves).where(eq(gameSaves.userUid, uid));
    if (existing.length > 0) {
      const updated = await db
        .update(gameSaves)
        .set({
          saveData,
          updatedAt: new Date(),
        })
        .where(eq(gameSaves.userUid, uid))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(gameSaves)
        .values({
          userId: user.id,
          userUid: uid,
          saveData,
          updatedAt: new Date(),
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error('Failed to save game data:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function getGameForUser(uid: string) {
  try {
    const rows = await db.select().from(gameSaves).where(eq(gameSaves.userUid, uid));
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to fetch game save:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}
