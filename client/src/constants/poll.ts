// Poll constants - shared between components
export const POLL_MESSAGE_PREFIX = '📊 **Omröstning:**';

export const POLL_RULES = {
  MAX_OPTIONS: 10,
  MIN_OPTIONS: 2,
  MAX_QUESTION_LENGTH: 500,
  MAX_OPTION_LENGTH: 200
} as const;
