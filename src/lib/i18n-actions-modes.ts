import i18n from './i18n';
import { PROMPT_ACTIONS, PromptAction } from '@/features/prompts/utils/actions';
import { THINKING_MODES, ThinkingMode } from '@/features/prompts/utils/modes';

/**
 * Mendapatkan deskripsi action yang diterjemahkan untuk tampilan UI
 * Instruksi AI tetap dalam bahasa Inggris untuk pemrosesan
 * 
 * Note: Ensure 'actions' namespace is loaded before calling this function
 * Use useTranslationReady hook in React components
 */
export const getTranslatedAction = (actionId: string): PromptAction | undefined => {
  const action = PROMPT_ACTIONS.find(a => a.id === actionId);
  if (!action) return undefined;

  const actionKey = actionId === 'self-review' ? 'selfReview' : actionId;
  
  // Use translation key directly - i18n will return the key if translation is missing
  // This is better than hardcoded English defaultValue
  return {
    ...action,
    description: i18n.t(`actions:${actionKey}.description`),
    purpose: i18n.t(`actions:${actionKey}.purpose`),
    // Menjaga instruksi dalam bahasa Inggris untuk pemrosesan AI
    // instructions: action.instructions,
    // rules: action.rules,
  };
};

/**
 * Mendapatkan semua action dengan deskripsi yang diterjemahkan
 * 
 * Note: Ensure 'actions' namespace is loaded before calling this function
 * Use useTranslationReady hook in React components
 */
export const getTranslatedActions = (): PromptAction[] => {
  return PROMPT_ACTIONS.map(action => {
    const actionKey = action.id === 'self-review' ? 'selfReview' : action.id;
    return {
      ...action,
      description: i18n.t(`actions:${actionKey}.description`),
      purpose: i18n.t(`actions:${actionKey}.purpose`),
    };
  });
};

/**
 * Mendapatkan deskripsi mode yang diterjemahkan untuk tampilan UI
 * Instruksi AI tetap dalam bahasa Inggris untuk pemrosesan
 * 
 * Note: Ensure 'modes' namespace is loaded before calling this function
 * Use useTranslationReady hook in React components
 */
export const getTranslatedMode = (modeId: string): ThinkingMode | undefined => {
  const mode = THINKING_MODES.find(m => m.id === modeId);
  if (!mode) return undefined;

  const modeKeyMap: Record<string, string> = {
    'meta-prompt': 'metaPrompt',
    'self-refine': 'selfRefine',
    'chain-of-thought': 'chainOfThought',
    'self-consistency': 'selfConsistency',
    'chain-of-prompt': 'chainOfPrompt',
    'role-prompt': 'rolePrompt',
  };

  const modeKey = modeKeyMap[modeId] || modeId;

  // Use translation key directly - i18n will return the key if translation is missing
  // This is better than hardcoded English defaultValue
  return {
    ...mode,
    description: i18n.t(`modes:${modeKey}.description`),
    purpose: i18n.t(`modes:${modeKey}.purpose`),
    thinkingPattern: i18n.t(`modes:${modeKey}.thinkingPattern`),
    // Menjaga instruksi dalam bahasa Inggris untuk pemrosesan AI
    // instructions: mode.instructions,
  };
};

/**
 * Get all modes with translated descriptions
 * 
 * Note: Ensure 'modes' namespace is loaded before calling this function
 * Use useTranslationReady hook in React components
 */
export const getTranslatedModes = (): ThinkingMode[] => {
  const modeKeyMap: Record<string, string> = {
    'meta-prompt': 'metaPrompt',
    'self-refine': 'selfRefine',
    'chain-of-thought': 'chainOfThought',
    'self-consistency': 'selfConsistency',
    'chain-of-prompt': 'chainOfPrompt',
    'role-prompt': 'rolePrompt',
  };

  return THINKING_MODES.map(mode => {
    const modeKey = modeKeyMap[mode.id] || mode.id;
    return {
      ...mode,
      description: i18n.t(`modes:${modeKey}.description`),
      purpose: i18n.t(`modes:${modeKey}.purpose`),
      thinkingPattern: i18n.t(`modes:${modeKey}.thinkingPattern`),
    };
  });
};

