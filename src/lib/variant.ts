/** 目前建置的版型版本：normal（預設）或 magazine。由 SITE_VARIANT 環境變數決定 */
export const VARIANT: 'normal' | 'magazine' = import.meta.env.SITE_VARIANT === 'magazine' ? 'magazine' : 'normal';
export const isMagazine = VARIANT === 'magazine';
