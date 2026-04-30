import { getSupabaseClient, hasServiceRole } from './supabaseClient.js';
import type { Session, SessionState } from './types.js';

const sessionCache = new Map<number, Session & { lastActivity: number }>();

export const getSession = async (chatId: number): Promise<Session | null> => {
  if (hasServiceRole()) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('telegram_sessions')
        .select('state, selected_tags')
        .eq('chat_id', chatId)
        .single();

      if (!error && data) {
        return {
          state: data.state as SessionState,
          selectedTags: data.selected_tags || [],
        };
      }
    } catch (err) {
      console.error('[Session] Supabase read failed, fallback to memory:', err);
    }
  }

  const cached = sessionCache.get(chatId);
  if (cached) {
    cached.lastActivity = Date.now();
    return { state: cached.state, selectedTags: cached.selectedTags };
  }
  return null;
};

export const setSession = async (chatId: number, session: Session): Promise<void> => {
  sessionCache.set(chatId, { ...session, lastActivity: Date.now() });

  if (hasServiceRole()) {
    try {
      await getSupabaseClient().from('telegram_sessions').upsert({
        chat_id: chatId,
        state: session.state,
        selected_tags: session.selectedTags,
        last_activity: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Session] Supabase write failed:', err);
    }
  }
};

export const clearSession = async (chatId: number): Promise<void> => {
  sessionCache.delete(chatId);

  if (hasServiceRole()) {
    try {
      await getSupabaseClient().from('telegram_sessions').delete().eq('chat_id', chatId);
    } catch (err) {
      console.error('[Session] Supabase delete failed:', err);
    }
  }
};

export const isMessageAlreadyProcessed = async (messageId: number): Promise<boolean> => {
  try {
    const { data } = await getSupabaseClient()
      .from('telegram_processed_messages')
      .select('message_id')
      .eq('message_id', messageId)
      .single();
    return Boolean(data);
  } catch {
    return false;
  }
};

export const markMessageAsProcessed = async (messageId: number): Promise<void> => {
  try {
    await getSupabaseClient()
      .from('telegram_processed_messages')
      .insert({ message_id: messageId })
      .select();
  } catch (err) {
    console.error('[Dedup] Failed to mark message:', err);
  }
};

export const __clearSessionCacheForTests = () => {
  sessionCache.clear();
};
