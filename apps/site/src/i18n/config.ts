import type { Language, SiteCopy } from "./types";
import en from "./locales/en";
import pl from "./locales/pl";
import nl from "./locales/nl";
import ru from "./locales/ru";
import uk from "./locales/uk";
import de from "./locales/de";
import fr from "./locales/fr";
import es from "./locales/es";
import it from "./locales/it";
import pt from "./locales/pt";
import cs from "./locales/cs";
import sk from "./locales/sk";
import ro from "./locales/ro";
import hu from "./locales/hu";
import bg from "./locales/bg";
import el from "./locales/el";

export const STORAGE_KEY = "omniro-site-language";
export const languageRegistry: { code: Language; label: string; htmlLang: string }[] = [
  {code:"en",label:"English",htmlLang:"en"},{code:"pl",label:"Polski",htmlLang:"pl"},{code:"nl",label:"Nederlands",htmlLang:"nl"},{code:"ru",label:"Русский",htmlLang:"ru"},
  {code:"uk",label:"Українська",htmlLang:"uk"},{code:"de",label:"Deutsch",htmlLang:"de"},{code:"fr",label:"Français",htmlLang:"fr"},{code:"es",label:"Español",htmlLang:"es"},
  {code:"it",label:"Italiano",htmlLang:"it"},{code:"pt",label:"Português",htmlLang:"pt"},{code:"cs",label:"Čeština",htmlLang:"cs"},{code:"sk",label:"Slovenčina",htmlLang:"sk"},
  {code:"ro",label:"Română",htmlLang:"ro"},{code:"hu",label:"Magyar",htmlLang:"hu"},{code:"bg",label:"Български",htmlLang:"bg"},{code:"el",label:"Ελληνικά",htmlLang:"el"},
];

export const locales: Record<Language, SiteCopy> = {en,pl,nl,ru,uk,de,fr,es,it,pt,cs,sk,ro,hu,bg,el};

export function resolveBrowserLanguage(): Language {
  const candidates = typeof navigator === "undefined" ? [] : [...(navigator.languages ?? []), navigator.language];
  for (const candidate of candidates) {
    const code = candidate.toLowerCase().split("-")[0] as Language;
    if (code in locales) return code;
  }
  return "en";
}

export function auditLocales() {
  const shape = JSON.stringify(en, (_key, value) => typeof value === "string" ? "•" : value);
  for (const {code} of languageRegistry) {
    if (JSON.stringify(locales[code], (_key, value) => typeof value === "string" ? "•" : value) !== shape) throw new Error(`Incomplete locale: ${code}`);
  }
}
