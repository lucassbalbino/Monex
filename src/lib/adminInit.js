
import { supabase } from '@/lib/customSupabaseClient';

// This function ensures the master admin account exists in Supabase Auth.
// The database trigger (handle_new_user) handles the profile creation with 'admin' role.
export const initializeAdmin = async () => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@financialflow.com',
      password: 'Admin@12345',
      options: {
        data: {
          full_name: 'Master Admin'
        }
      }
    });

    if (error) {
      // Ignore "User already registered" error, report others
      if (!error.message.toLowerCase().includes("registered") && error.status !== 422) {
        console.warn("Admin initialization warning:", error.message);
      }
    } else if (data?.user) {
      console.log("Master Admin account verified/created.");
    }
  } catch (err) {
    console.warn("Admin init failed:", err);
  }
};
