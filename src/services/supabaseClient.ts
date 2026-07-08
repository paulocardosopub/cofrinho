import { createClient } from "@supabase/supabase-js";
import type { User, UserData } from "../types";

const defaultSupabaseUrl = "https://obqjjpbydhgfuqfgdjyh.supabase.co";
const defaultSupabasePublishableKey = "sb_publishable_WES5RUU00asnvpEcx4oMhQ_lERRu9l8";

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || defaultSupabaseUrl;
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || defaultSupabasePublishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null;
const REMOTE_DATA_TABLE = "cofrinho_user_app_data";

export interface RemoteSignUpResult {
  user: User;
  needsEmailConfirmation: boolean;
}

function getAppUrl(path: string) {
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return new URL(`${basePath}${path.replace(/^\//, "")}`, window.location.origin).toString();
}

function toAppUser(id: string, email: string, name?: string): User {
  return {
    id,
    email,
    name: name || email.split("@")[0] || "Usuário",
    passwordHash: "supabase-auth",
    createdAt: new Date().toISOString(),
  };
}

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("security purposes") || lower.includes("after 60 seconds") || lower.includes("rate limit")) {
    return new Error("O Supabase bloqueou novas tentativas por segurança. Aguarde 1 minuto e tente novamente.");
  }
  if (lower.includes("email not confirmed")) {
    return new Error("Confirme seu e-mail antes de entrar. Veja sua caixa de entrada e a pasta de spam.");
  }
  if (lower.includes("already registered") || lower.includes("user already registered")) {
    return new Error("Este e-mail já tem uma conta. Entre com sua senha ou recupere o acesso.");
  }
  if (lower.includes("invalid login credentials")) {
    return new Error("E-mail ou senha incorretos.");
  }
  if (lower.includes("password")) {
    return new Error("Use uma senha com pelo menos 6 caracteres.");
  }
  return error instanceof Error ? error : new Error("Não foi possível concluir agora.");
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
  if (error) throw friendlyAuthError(error);
  if (!data.user.email) throw new Error("Conta sem e-mail confirmado.");
  return toAppUser(data.user.id, data.user.email, data.user.user_metadata?.name as string | undefined);
}

export async function signUpRemote(name: string, email: string, password: string): Promise<RemoteSignUpResult | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw friendlyAuthError(error);
  if (!data.user?.email) throw new Error("Cadastro criado. Confirme seu e-mail antes de entrar.");

  return {
    user: toAppUser(data.user.id, data.user.email, name),
    needsEmailConfirmation: !data.session,
  };
}

export async function signOutRemote() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function requestPasswordResetRemote(email: string) {
  if (!supabase) return false;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAppUrl("reset-password"),
  });
  if (error) throw friendlyAuthError(error);
  return true;
}

export async function updateRemotePassword(password: string) {
  if (!supabase) return false;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw friendlyAuthError(error);
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
