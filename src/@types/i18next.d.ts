import { resources } from '@/locales';

type Resources = typeof resources.en.translation;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: Resources };
  }
}
