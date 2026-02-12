import type { PartyMetaMap, NameToCodeMap } from '../types'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/election_69_analyzer'
const LOGO_BASE = `${BASE_PATH}/party-logos`

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
