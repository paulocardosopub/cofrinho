import { createClient } from "@supabase/supabase-js";
import type { User, UserData } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null;
const REMOTE_DATA_TABLE = "cofrinho_user_app_data";

function toAppUser(id: string, email: string, name?: string): User {
  return {
    id,
    email,
    name: name || email.split("@")[0] || "Usuário",
    passwordHash: "supabase-auth",
    createdAt: new Date().toISOString(),
  };
}

export async function getRemoteSessionUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  const remoteUser = data.session.user;
  const email = remoteUser.email;
  if (!email) return null;
  return toAppUser(remoteUser.id, email, remoteUser.user_metadata?.name as string | undefined);
}

export async function signInRemote(email: string, password: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user.email) throw new Error("Conta sem e-mail confirmado.");
  return toAppUser(data.user.id, data.user.email, data.user.user_metadata?.name as string | undefined);
}

export async function signUpRemote(name: string, email: string, password: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  if (!data.user?.email) throw new Error("Cadastro criado, mas aguarda confirmação de e-mail.");
  return toAppUser(data.user.id, data.user.email, name);
}

export async function signOutRemote() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function requestPasswordResetRemote(email: string) {
  if (!supabase) return false;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return true;
}

export async function updateRemotePassword(password: string) {
  if (!supabase) return false;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return true;
}

export async function loadRemoteUserData(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from(REMOTE_DATA_TABLE).select("payload").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data?.payload as UserData | undefined) ?? null;
}

export async function saveRemoteUserData(userId: string, payload: UserData) {
  if (!supabase) return null;
  const { error } = await supabase.from(REMOTE_DATA_TABLE).upsert({
    user_id: userId,
    payload,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return true;
}
