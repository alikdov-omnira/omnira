export const languages = ["en", "pl", "nl", "ru", "uk", "de", "fr", "es", "it", "pt", "cs", "sk", "ro", "hu", "bg", "el"] as const;
export type Language = (typeof languages)[number];

export type SiteCopy = {
  a11y: string[];
  nav: string[];
  hero: string[];
  problem: string[];
  fragments: string[];
  platform: string[];
  modules: [string, string, string][];
  building: string[];
  capabilities: [string, string][];
  command: string[];
  agents: [string, string, string[]][];
  process: string[];
  roleIntro: string[];
  roles: [string, string, string, string[]][];
  investors: string[];
  roadmap: [string, string][];
  final: string[];
  footer: [string, string[]][];
  legal: string[];
};

export const defineLocale = <T extends SiteCopy>(locale: T): T => locale;
