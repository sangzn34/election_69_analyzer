'use client'

import type { NameToCodeMap } from '../types'
import { getPartyLogoUrl, getLogoUrlByName } from '../utils/partyLogo'

interface PartyLogoProps {
  partyCode?: string
  partyName?: string
  nameToCodeMap?: NameToCodeMap
  size?: number
  style?: React.CSSProperties
}

export default function PartyLogo({ partyCode, partyName, nameToCodeMap, size = 28, style = {} }: PartyLogoProps) {
  let url: string | null = null

  if (partyCode) {
    url = getPartyLogoUrl(partyCode)
  } else if (partyName && nameToCodeMap) {
    url = getLogoUrlByName(partyName, nameToCodeMap)
  }

  if (!url) return null

  return (
    <img
      src={url}
      alt={partyName || partyCode || ''}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        background: '#ffffff',
        ...style,
      }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
