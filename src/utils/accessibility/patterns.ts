import { errorDefinitions } from './definitions';

export type ErrorTranslations = {
    en: ErrorMessage; // Default language, required
    'en-US'?: ErrorMessage;
    fr?: ErrorMessage;
    'fr-CA'?: ErrorMessage;
};

type ErrorMessage = (typeof errorDefinitions)[keyof typeof errorDefinitions];
type ErrorMessages = ErrorMessage | ErrorTranslations;

const rawPatternGeneric: Record<string, ErrorMessages> = {
    'User rejected the request.': errorDefinitions.UserRejected,
    "TypeError: Cannot read properties of undefined (reading 'addresses')":
        errorDefinitions.UserRejected,
};

const rawPatternUnitTest: Record<string, ErrorMessages> = {
    //'TEST_CASE: not there': ''
    'TEST_CASE: empty': '',
    'TEST_CASE: simple': 'simple',
    'TEST_CASE: regex1 ${value}': 'regex1',
    'TEST_CASE: regex2 ${value}': 'regex2 $1',

    //'Test case not there': ''
    'Test case empty': '',
    'Test case simple': 'simple',
    'Test case regex1 ${value}': 'regex1',
    'Test case regex2 ${value.get()}': 'regex2 $1',

    // Multi-language
    'TEST_MULTI: multi1': {
        en: 'Test English',
        'en-US': 'Test American English',
        fr: 'Test French',
        'fr-CA': 'Test Canadian French',
    },

    'TEST_MULTI: multi2 ${value}': {
        en: 'Test English: $1',
        'en-US': 'Test American English: $1',
        fr: 'Test French: $1',
        'fr-CA': 'Test Canadian French: $1',
    },
};

// Patterns may be
// - simple string (if key don't contain a closing parenthesis '(' ).
// - regex expression (if key contains at least one '(' for regex group matching).
// The group matching don't need to be used in translation
// Group matching start at $0 (full match) and $1 (first group), $2...
//
// Simple key
// 'Test': 'This is a translated test',
// Regex key
// 'Test for (\\w+)': 'This is a test for some function',
// 'Test function (\\w+)': 'This is a testing sample for function $1',
const rawPatternMap: Record<string, ErrorMessage> = {
    'NATIVE_SWAP: Liquidity value is too low in satoshis.':
        errorDefinitions.NativeSwapLiquidityValueTooLow,
    'Unknown Error': errorDefinitions.UnknownError,
    'Invalid Address': errorDefinitions.IndexingInProgress,
    'Error Indexing at Block': errorDefinitions.IndexingInProgress,
    'Valid Reservation for this Address': errorDefinitions.NoValidReservation,

    ...rawPatternGeneric,
    ...rawPatternUnitTest,
};

export const patternMap: Array<[string, string, ErrorMessages]> = Object.entries(rawPatternMap)
    .filter(([key, value]) => !!value && !key.includes('${'))
    .sort((a, b) => b[0].length - a[0].length)
    .map(([key, value]) => [key, key.toLowerCase(), value]);

export const escapeKey = (key: string): string => {
    return key
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\./g, '\\.')
        .replace(/\$\{.*?}/g, '(.+)');
};
export const patternRegExp: Array<[string, RegExp, ErrorMessages]> = Object.entries(rawPatternMap)
    .filter(([key, value]) => !!value && key.includes('${'))
    .sort((a, b) => b[0].length - a[0].length)
    .map(([key, value]) => [key, new RegExp(escapeKey(key), 'i'), value]);
