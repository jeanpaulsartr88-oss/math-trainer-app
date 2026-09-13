/**
 * Telegram WebApp SDK helper and haptic feedback wrapper.
 */

const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export const isTelegramEnv = Boolean(tg && tg.initData);

export function initTelegram() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }
  } catch (e) {
    console.warn('Failed to initialize Telegram WebApp:', e);
  }
}

export function getInitData() {
  return tg?.initData || '';
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user || null;
}

// Haptic feedback methods
export function hapticSuccess() {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
}

export function hapticError() {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('error');
  }
}

export function hapticSelection() {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.selectionChanged();
  }
}

export function hapticImpact(style = 'light') {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  }
}

// Back button controls
export function setupBackButton(onBack) {
  if (!tg?.BackButton) return;
  tg.BackButton.show();
  tg.BackButton.onClick(onBack);
}

export function hideBackButton() {
  if (!tg?.BackButton) return;
  tg.BackButton.hide();
}
