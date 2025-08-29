import type { ErrorTranslations } from './patterns';
import { patternMap, patternRegExp } from './patterns';

// Sample: Error in calling function: Spender can not be dead at ~lib/@btc-vision/btc-runtime/runtime/contracts/DeployableOP_20.ts:291:50
// matches[2] == null
// matches[3] == 'Spender can not be dead'
// Sample: Error in calling function: NATIVE_SWAP: LOCKED at ~lib/@btc-vision/btc-runtime/runtime/contracts/DeployableOP_20.ts:291:50
// matches[2] == 'NATIVE_SWAP'
// matches[3] == 'LOCKED'
const RE_EXTRACT_ERROR = new RegExp(
    '^(.*?):\\s*(?:([^:]+):)?\\s*(.*?)\\s+at\\s(\\S+\\s\\()?\\S+\\d+:\\d+\\)?',
    'm',
);

const _translation = (err: ErrorTranslations, locale: string | null) => {
    // Using a switch here to be sure we are safe as to not try to use
    // a function or other attributes.  For exemple if someone create
    // a 'get' locale, we should not try to call err['get']...
    switch (locale) {
        case 'en':
            return err['en'] || '';
        case 'en-us':
            return err['en-US'] || '';
        case 'fr':
            return err['fr'] || '';
        case 'fr-ca':
            return err['fr-CA'] || '';
        default:
            return '';
    }
};

const _errors = (err: string | ErrorTranslations, locales: string[]) => {
    if (typeof err === 'string') {
        return err;
    } else {
        for (const locale of locales) {
            const translation = _translation(err, locale);
            if (translation) return translation;
        }
        return err['en']; // Return default locale
    }
};

const _normalizeLocales = (locales: string[]) => {
    const _locales = locales.map((l) => l.toLowerCase().trim());
    // Add fallback locales if needed
    for (const locale of _locales) {
        const language = locale.split('-')[0];
        if (!_locales.includes(language)) {
            _locales.push(language);
        }
    }
    return _locales;
};

// When translation will be enabled, will need to feed locale
// with the locale from the user's browser
export const _e = (err: string | Error, locales: string[] = ['en']): string => {
    const [, , error] = _match_e(err.toString(), locales);
    return error;
};
// This is mostly for debugging as it return the full matched information.
// returns [orig, pattern, translation] where
// - orig is the original key in the patterns definition
// - pattern is the transformed (lowercase, regex, etc.) key
// - translation is the resulting translation for the current key
export const _match_e = (err: string, locales: string[] = ['en']): string[] => {
    const normalizedLocales = _normalizeLocales(locales);
    const matches = RE_EXTRACT_ERROR.exec(err);
    const packageName = matches ? matches[2] : '';
    let msg = matches ? matches[3] : err;

    const lookup = `${packageName}: ${msg}`.trim();
    const lookupLower = lookup.toLowerCase();

    // First checks with regex as these messages may be catched by includes later
    for (const [orig, pattern, translation] of patternRegExp) {
        const placeHolders = pattern.exec(lookup);
        if (placeHolders) {
            msg = _errors(translation, normalizedLocales) || msg;
            for (let i = 0; i < placeHolders.length; i++) {
                const regex = new RegExp(`\\$${i}`, 'g');
                msg = msg.replace(regex, placeHolders[i] ?? '');
            }
            return [orig, pattern.source, msg];
        }
    }

    // Next checks fast patterns that are matched as lower case strings
    for (const [orig, pattern, translation] of patternMap) {
        if (lookupLower == pattern) {
            return [orig, pattern, _errors(translation, normalizedLocales) || msg];
        }
    }

    // Finally checks fast patterns that are matched as lower case includes
    for (const [orig, pattern, translation] of patternMap) {
        if (lookupLower.includes(pattern)) {
            return [orig, pattern, _errors(translation, normalizedLocales) || msg];
        }
    }

    return ['', '', msg];
};
