export function formatDataForLLM(clientData, credit_cards, debts, expenses, financialSummary, goals, payments, spendingLimits) {~
   return ` 
   ## Client Financial Data

   ### Client Information
   - Name: ${clientData.name}
   - Email: ${clientData.email}
   - Income: $${clientData.income}

   ### Credit Cards
   ${credit_cards.length > 0 ? credit_cards.map(card => `
   - Card Nome: ${card.name}, Limite: ${card.limite}, Balance: ${card.current_bill}, Vencimento: ${card.due_day}`).join('\n') : 'No credit cards found.'}

   ### Debts
   ${debts.length > 0 ? debts.map(debt => `
   - Nome: ${debt.name}, Valor: $${debt.total_value}, Juros: ${debt.interest_rate}%, Vencimento: ${debt.due_date}, Importância: ${debt.interest_rate}, Progresso: ${debts.status}`).join('\n') : 'No debts found.'}

   ### Expenses
   ${expenses.length > 0 ? expenses.map(expense => `
   - Categoria: ${expense.category}, Valor: $${expense.amount}, Descrição: ${expense.description}, Data: ${expense.date}`).join('\n') : 'No expenses found.'}
   
   ### Financial Summary
   ${financialSummary.length > 0 ? financialSummary.map(summary => `
   - Total Renda: $${summary.total_income}
   - Total Despesas: $${summary.total_expenses}
   - Total Savings: $${summary.Total_savings}`).join('\n') : 'No financial summary found.'}
   
   ### Goals
   ${goals.length > 0 ? goals.map(goal => `
   - Nome: ${goal.name}, Valor Alvo: $${goal.target_amount}, Progresso: $${goal.current_amount}, Data Alvo: ${goal.target_date}`).join('\n') : 'No goals found.'}
   ### Payments
   ${payments.length > 0 ? payments.map(payment => `
   - Nome: ${payment.name}, Valor: $${payment.amount}, Data: ${payment.date}, Status: ${payment.status}`).join('\n') : 'No payments found.'}}