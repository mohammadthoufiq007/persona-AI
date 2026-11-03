import 'server-only';

// Global daily budget tracker & kill switch
let dailyTurnsCount = 0;
let lastReset = Date.now();

export async function checkBudget(): Promise<{ ok: boolean; code?: string }> {
  const maxGlobal = Number(process.env.LIMIT_GLOBAL_TURNS_DAY ?? 300);
  const now = Date.now();

  // Reset counters every 24 hours
  if (now - lastReset > 24 * 3600 * 1000) {
    dailyTurnsCount = 0;
    lastReset = now;
  }

  if (dailyTurnsCount >= maxGlobal) {
    return { ok: false, code: 'daily_budget_exhausted' };
  }

  return { ok: true };
}

export async function recordUsage(usage: { sttSeconds?: number; ttsChars?: number }): Promise<void> {
  dailyTurnsCount++;
}

export async function isKillSwitchOn(): Promise<boolean> {
  return false;
}
