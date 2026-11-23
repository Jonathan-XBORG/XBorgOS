export const DASH_RE = /[\u002D\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/

export function assertPublicCopy(text: string): string {
  if (DASH_RE.test(text)) {
    throw new Error(`Public copy contains a dash: ${text}`)
  }
  return text
}
