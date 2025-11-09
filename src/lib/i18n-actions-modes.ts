import i18n from './i18n';
import { PROMPT_ACTIONS, PromptAction } from '@/features/prompts/utils/actions';
import { THINKING_MODES, ThinkingMode } from '@/features/prompts/utils/modes';

/**
 * Mendapatkan deskripsi action yang diterjemahkan untuk tampilan UI
 * Instruksi AI tetap dalam bahasa Inggris untuk pemrosesan
 */
export const getTranslatedAction = (actionId: string): PromptAction | undefined => {
  const action = PROMPT_ACTIONS.find(a => a.id === actionId);
  if (!action) return undefined;

  const actionKey = actionId === 'self-review' ? 'selfReview' : actionId;
  
  return {
    ...action,
    description: i18n.t(`actions:${actionKey}.description`, { defaultValue: action.description }),
    purpose: i18n.t(`actions:${actionKey}.purpose`, { defaultValue: action.purpose }),
    // Menjaga instruksi dalam bahasa Inggris untuk pemrosesan AI
    // instructions: action.instructions,
    // rules: action.rules,
  };
};

/**
 * Mendapatkan semua action dengan deskripsi yang diterjemahkan
 */
export const getTranslatedActions = (): PromptAction[] => {
  return PROMPT_ACTIONS.map(action => {
    const actionKey = action.id === 'self-review' ? 'selfReview' : action.id;
    return {
      ...action,
      description: i18n.t(`actions:${actionKey}.description`, { defaultValue: action.description }),
      purpose: i18n.t(`actions:${actionKey}.purpose`, { defaultValue: action.purpose }),
    };
  });
};

/**
 * Mendapatkan deskripsi mode yang diterjemahkan untuk tampilan UI
 * Instruksi AI tetap dalam bahasa Inggris untuk pemrosesan
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

  return {
    ...mode,
    description: i18n.t(`modes:${modeKey}.description`, { defaultValue: mode.description }),
    purpose: i18n.t(`modes:${modeKey}.purpose`, { defaultValue: mode.purpose }),
    thinkingPattern: i18n.t(`modes:${modeKey}.thinkingPattern`, { defaultValue: mode.thinkingPattern }),
    // Menjaga instruksi dalam bahasa Inggris untuk pemrosesan AI
    // instructions: mode.instructions,
  };
};

/**
 * Get all modes with translated descriptions
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
      description: i18n.t(`modes:${modeKey}.description`, { defaultValue: mode.description }),
      purpose: i18n.t(`modes:${modeKey}.purpose`, { defaultValue: mode.purpose }),
      thinkingPattern: i18n.t(`modes:${modeKey}.thinkingPattern`, { defaultValue: mode.thinkingPattern }),
    };
  });
};

