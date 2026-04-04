import type { Expense, Member } from '@/types'

export interface BalanceRow {
  email: string
  name: string
  net: number  // positive = owed money, negative = owes money
}

export interface SettlementTransaction {
  from_email: string
  from_name: string
  to_email: string
  to_name: string
  amount: number
}

export function computeNetBalances(
  expenses: Expense[],
  members: Pick<Member, 'email' | 'name'>[]
): BalanceRow[] {
  const nameByEmail = new Map(members.map((m) => [m.email, m.name]))
  const net = new Map<string, number>()

  // Initialise all members at 0
  for (const m of members) net.set(m.email, 0)

  for (const expense of expenses) {
    const paidBy = expense.paid_by
    if (!paidBy) continue

    const splitBetween = expense.split_between?.length
      ? expense.split_between
      : members.map((m) => m.email)

    const share = expense.amount / splitBetween.length

    // Payer is credited the full amount
    net.set(paidBy, (net.get(paidBy) ?? 0) + expense.amount)

    // Each member in split is debited their share
    for (const email of splitBetween) {
      net.set(email, (net.get(email) ?? 0) - share)
    }
  }

  return Array.from(net.entries()).map(([email, netVal]) => ({
    email,
    name: nameByEmail.get(email) ?? email,
    net: Math.round(netVal * 100) / 100,
  }))
}

export function computeSettlements(
  expenses: Expense[],
  members: Pick<Member, 'email' | 'name'>[]
): SettlementTransaction[] {
  const balances = computeNetBalances(expenses, members)

  // Creditors (net > 0) and debtors (net < 0)
  const creditors = balances.filter((b) => b.net > 0.01).sort((a, b) => b.net - a.net)
  const debtors = balances.filter((b) => b.net < -0.01).sort((a, b) => a.net - b.net)

  const transactions: SettlementTransaction[] = []
  let i = 0, j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = { ...creditors[i] }
    const debtor = { ...debtors[j] }

    const amount = Math.min(creditor.net, -debtor.net)
    const rounded = Math.round(amount * 100) / 100

    if (rounded > 0) {
      transactions.push({
        from_email: debtor.email,
        from_name: debtor.name,
        to_email: creditor.email,
        to_name: creditor.name,
        amount: rounded,
      })
    }

    creditor.net -= amount
    debtor.net += amount

    if (creditor.net < 0.01) i++
    if (-debtor.net < 0.01) j++
  }

  return transactions
}
