import type { PairingData } from "@shared/schema";

const STORAGE_KEY = "safesignal_user";

export interface StoredUser extends PairingData {
  id: string;
}

export function saveUserData(data: PairingData): StoredUser {
  const userId = crypto.randomUUID();
  const storedUser: StoredUser = {
    ...data,
    id: userId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedUser));
  return storedUser;
}

export function getUserData(): StoredUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    if (parsed.odId && !parsed.id) {
      parsed.id = parsed.odId;
      delete parsed.odId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed as StoredUser;
  } catch {
    return null;
  }
}

export function clearUserData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasStoredUser(): boolean {
  return getUserData() !== null;
}
