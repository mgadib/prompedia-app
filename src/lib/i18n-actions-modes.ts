import i18n from './i18n';
import { PROMPT_ACTIONS, PromptAction } from './actions';
import { THINKING_MODES, ThinkingMode } from './modes';

/**
 * Get translated action description for UI display
 * AI instructions remain in English for processing
 */
export const getTranslatedAction = (actionId: string): PromptAction | undefined => {
  const action = PROMPT_ACTIONS.find(a => a.id === actionId);
  if (!action) return undefined;

  const actionKey = actionId === 'self-review' ? 'selfReview' : actionId;
  
  return {
    ...action,
    description: i18n.t(`actions:${actionKey}.description`, { defaultValue: action.description }),
    purpose: i18n.t(`actions:${actionKey}.purpose`, { defaultValue: action.purpose }),
    // Keep instructions in English for AI processing
    // instructions: action.instructions,
    // rules: action.rules,
  };
};

/**
 * Get all actions with translated descriptions
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
 * Get translated mode description for UI display
 * AI instructions remain in English for processing
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
    // Keep instructions in English for AI processing
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

