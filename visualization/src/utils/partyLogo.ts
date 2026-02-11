import type { PartyMetaMap, NameToCodeMap } from '../types'

const LOGO_BASE = `${import.meta.env.BASE_URL}party-logos`

/**
 * Get party logo URL from party code (e.g. "PARTY-0046")
 */
export function getPartyLogoUrl(partyCode: string): string | null {
  if (!partyCode) return null
  return `${LOGO_BASE}/${partyCode}.webp`
}

/**
 * Build a name→code lookup from partyMeta
 */
export function buildPartyNameToCode(partyMeta: PartyMetaMap | null | undefined): NameToCodeMap {
  if (!partyMeta) return {}
  const map: NameToCodeMap = {}
  Object.entries(partyMeta).forEach(([code, meta]) => {
    map[meta.name] = code
  })
  return map
}

/**
 * Get logo URL from party name using the lookup map
 */
export function getLogoUrlByName(partyName: string, nameToCodeMap: NameToCodeMap): string | null {
  if (!partyName || !nameToCodeMap) return null
  const code = nameToCodeMap[partyName]
  return code ? getPartyLogoUrl(code) : null
}
