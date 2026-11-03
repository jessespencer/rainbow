/**
 * The Bibles the apps can read from. Each one is mapped to KJV verse numbering at build time
 * (apps/rainbow/scripts/build-translations.ts) and served as `data/<file>`, one string per verse.
 * Every one here is public domain or openly licensed; copyrighted ones are only ever linked to.
 */

export interface Translation {
  id: string;
  abbr: string;
  name: string;
  /** BCP 47 code, for `lang` on the text. */
  language: string;
  /** The language's own name for itself. */
  languageName: string;
  file: string;
  /** VPL zip the build script imports; the BSB has its own importer. */
  source?: string;
  license: string;
  licenseUrl: string;
  /** Where to read about the translation. */
  homepage: string;
}

export const TRANSLATIONS: Translation[] = [
  {
    id: "bsb", abbr: "BSB", name: "Berean Standard Bible", language: "en", languageName: "English",
    file: "bsb.json", license: "Public domain", licenseUrl: "https://berean.bible/terms.htm",
    homepage: "https://berean.bible/",
  },
  {
    id: "kjv", abbr: "KJV", name: "King James Version", language: "en", languageName: "English",
    file: "text-kjv.json", source: "https://ebible.org/Scriptures/eng-kjv2006_vpl.zip",
    license: "Public domain (Crown copyright in the UK)", licenseUrl: "https://ebible.org/eng-kjv2006/",
    homepage: "https://ebible.org/eng-kjv2006/",
  },
  {
    id: "web", abbr: "WEB", name: "World English Bible", language: "en", languageName: "English",
    file: "text-web.json", source: "https://ebible.org/Scriptures/engwebp_vpl.zip",
    license: "Public domain", licenseUrl: "https://worldenglish.bible/",
    homepage: "https://worldenglish.bible/",
  },
  {
    id: "asv", abbr: "ASV", name: "American Standard Version", language: "en", languageName: "English",
    file: "text-asv.json", source: "https://ebible.org/Scriptures/eng-asv_vpl.zip",
    license: "Public domain", licenseUrl: "https://ebible.org/eng-asv/",
    homepage: "https://ebible.org/eng-asv/",
  },
  {
    id: "blivre", abbr: "BLIVRE", name: "Bíblia Livre", language: "pt", languageName: "Português",
    file: "text-blivre.json", source: "https://github.com/blivre/BibliaLivre/releases/download/2018.2.0/bliv-tr_vpl.zip",
    license: "CC BY 3.0 BR", licenseUrl: "https://creativecommons.org/licenses/by/3.0/br/",
    homepage: "https://github.com/blivre/BibliaLivre",
  },
  {
    id: "lut", abbr: "LUT", name: "Lutherbibel 1912", language: "de", languageName: "Deutsch",
    file: "text-lut.json", source: "https://ebible.org/Scriptures/deu1912_vpl.zip",
    license: "Public domain", licenseUrl: "https://ebible.org/deu1912/",
    homepage: "https://ebible.org/deu1912/",
  },
  {
    id: "riv", abbr: "RIV", name: "Riveduta 1927", language: "it", languageName: "Italiano",
    file: "text-riv.json", source: "https://ebible.org/Scriptures/ita1927_vpl.zip",
    license: "Public domain", licenseUrl: "https://ebible.org/ita1927/",
    homepage: "https://ebible.org/ita1927/",
  },
  {
    id: "vbl", abbr: "VBL", name: "Versión Biblia Libre", language: "es", languageName: "Español",
    file: "text-vbl.json", source: "https://ebible.org/Scriptures/spavbl_vpl.zip",
    license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    homepage: "https://ebible.org/spavbl/",
  },
];

export const DEFAULT_TRANSLATION: Translation = TRANSLATIONS[0]!;

export const translationById = (id: string | null | undefined): Translation | undefined =>
  TRANSLATIONS.find((t) => t.id === id);

const STORE_KEY = "bui-translation";

/** The reader's last pick, shared across the apps on this origin. */
export const savedTranslation = (): Translation => {
  try {
    return translationById(localStorage.getItem(STORE_KEY)) ?? DEFAULT_TRANSLATION;
  } catch {
    return DEFAULT_TRANSLATION;
  }
};

export const saveTranslation = (translation: Translation): void => {
  try {
    localStorage.setItem(STORE_KEY, translation.id);
  } catch {
    // Private windows can refuse storage; the pick then lasts for this visit only.
  }
};
