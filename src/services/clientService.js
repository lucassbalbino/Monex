import { supabase } from '@/lib/customSupabaseClient';

export async function getClientData(clientId) {
   const {data, error} = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
   if (error) {
      throw new Error(error.message);
   }
   return data;
}

export async function getClientCreditCard(clientId) {
   const {data, error} = await supabase
      .from('credit_cards')
      .select('*')
      .eq('client_id', clientId)
      .single();
   if (error) {
      throw new Error(error.message);
   }
   return data;
}

export async function getDebts(clientId) {
   const {data, error} = await supabase
      .from('debts')
      .select('*')
      .eq('client_id', clientId);
   if (error) {
      throw new Error(error.message);
   }
   return data;
}

export async function getExpenses(clientId) {
   const {data, error} = await supabase
      .from('expenses')
      .select('*')
      .eq('client_id', clientId);

   if (error) { 
      throw new Error(error.message);
   }
   return data;
}


export async function getFinancialSummary(clientId) {
   const {data, error} = await supabase
      .from('financial_summary')
      .select('*')
      .eq('client_id', clientId);
   if (error) {
      throw new Error(error.message);
   }
   return data;
}

export async function getGoals(clientId) {
   const {data, error} = await supabase
      .from('goals')
      .select('*')
      .eq('client_id', clientId);
   if (error) {
      throw new Error(error.message);
   }
   return data;
}

export async function getPayments(clientId) {
   const {data, error} = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId);
   if (error) {
      throw new Error(error.message);
   }
   return data;
}


export async function getSpendingLimts(clientId) {
   const {data, error} = await supabase
      .from('spending_limits')
      .select('*')
      .eq('client_id', clientId);
   if (error) {
      throw new Error(error.message);
   }
   return data;
}
