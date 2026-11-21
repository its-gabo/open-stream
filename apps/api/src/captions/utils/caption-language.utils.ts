import { captionLanguageSchema } from "@workspace/shared"
import { UNDETERMINED_LANGUAGE } from "../constants/captions.constants"

/** The language names Whisper reports, e.g. OpenAI's `verbose_json` says `english`, by their ISO 639-1 code. */
const WHISPER_LANGUAGE_CODES: Record<string, string> = {
  afrikaans: "af",
  albanian: "sq",
  amharic: "am",
  arabic: "ar",
  armenian: "hy",
  assamese: "as",
  azerbaijani: "az",
  bashkir: "ba",
  basque: "eu",
  belarusian: "be",
  bengali: "bn",
  bosnian: "bs",
  breton: "br",
  bulgarian: "bg",
  burmese: "my",
  cantonese: "yue",
  castilian: "es",
  catalan: "ca",
  chinese: "zh",
  croatian: "hr",
  czech: "cs",
  danish: "da",
  dutch: "nl",
  english: "en",
  estonian: "et",
  faroese: "fo",
  finnish: "fi",
  flemish: "nl",
  french: "fr",
  galician: "gl",
  georgian: "ka",
  german: "de",
  greek: "el",
  gujarati: "gu",
  haitian: "ht",
  "haitian creole": "ht",
  hausa: "ha",
  hawaiian: "haw",
  hebrew: "he",
  hindi: "hi",
  hungarian: "hu",
  icelandic: "is",
  indonesian: "id",
  italian: "it",
  japanese: "ja",
  javanese: "jw",
  kannada: "kn",
  kazakh: "kk",
  khmer: "km",
  korean: "ko",
  lao: "lo",
  latin: "la",
  latvian: "lv",
  letzeburgesch: "lb",
  lingala: "ln",
  lithuanian: "lt",
  luxembourgish: "lb",
  macedonian: "mk",
  malagasy: "mg",
  malay: "ms",
  malayalam: "ml",
  maltese: "mt",
  mandarin: "zh",
  maori: "mi",
  marathi: "mr",
  moldavian: "ro",
  moldovan: "ro",
  mongolian: "mn",
  myanmar: "my",
  nepali: "ne",
  norwegian: "no",
  nynorsk: "nn",
  occitan: "oc",
  panjabi: "pa",
  pashto: "ps",
  persian: "fa",
  polish: "pl",
  portuguese: "pt",
  punjabi: "pa",
  pushto: "ps",
  romanian: "ro",
  russian: "ru",
  sanskrit: "sa",
  serbian: "sr",
  shona: "sn",
  sindhi: "sd",
  sinhala: "si",
  sinhalese: "si",
  slovak: "sk",
  slovenian: "sl",
  somali: "so",
  spanish: "es",
  sundanese: "su",
  swahili: "sw",
  swedish: "sv",
  tagalog: "tl",
  tajik: "tg",
  tamil: "ta",
  tatar: "tt",
  telugu: "te",
  thai: "th",
  tibetan: "bo",
  turkish: "tr",
  turkmen: "tk",
  ukrainian: "uk",
  urdu: "ur",
  uzbek: "uz",
  valencian: "ca",
  vietnamese: "vi",
  welsh: "cy",
  yiddish: "yi",
  yoruba: "yo",
}

/**
 * A language a provider reported, as a tag a track can be filed under:
 * Whisper's names are mapped to their code, and tags are kept when valid.
 * Null when it cannot be read.
 */
export function toCaptionLanguage(reported: string | null | undefined) {
  if (!reported) return null

  const named = WHISPER_LANGUAGE_CODES[reported.trim().toLowerCase()]

  if (named) return named

  const parsed = captionLanguageSchema.safeParse(reported)

  return parsed.success ? parsed.data : null
}

/** The primary subtag, which is what speech recognition services take, e.g. `pt` of `pt-BR`. */
export const toPrimaryLanguage = (language: string) => language.split("-")[0]!

/**
 * The language's name in itself, e.g. `Polski` for `pl`, as players list
 * tracks for viewers who speak it.
 */
export function toCaptionLabel(language: string) {
  if (language === UNDETERMINED_LANGUAGE) return "Unknown language"

  try {
    const name = new Intl.DisplayNames([language], { type: "language" }).of(
      language
    )

    return name
      ? `${name.charAt(0).toLocaleUpperCase(language)}${name.slice(1)}`
      : language
  } catch {
    return language
  }
}
