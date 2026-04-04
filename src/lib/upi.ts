interface UpiLinkParams {
  pa: string   // payee VPA (UPI ID)
  pn: string   // payee name
  am: number   // amount
  tn: string   // transaction note
  cu?: string  // currency, default INR
}

export function buildUpiLink({ pa, pn, am, tn, cu = 'INR' }: UpiLinkParams): string {
  const params = new URLSearchParams({
    pa,
    pn,
    am: am.toFixed(2),
    tn,
    cu,
  })
  return `upi://pay?${params.toString()}`
}
