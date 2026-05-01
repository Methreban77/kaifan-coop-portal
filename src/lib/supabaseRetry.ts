type SupabaseError = {
  code?: string;
  message?: string;
  details?: string | null;
} | null;

type SupabaseResult = {
  error: SupabaseError;
};

const transientCodes = new Set(["PGRST000", "PGRST001", "PGRST002"]);

export function isTransientDatabaseError(error: SupabaseError) {
  if (!error) return false;
  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    transientCodes.has(error.code ?? "") ||
    message.includes("database client error") ||
    message.includes("database connection error") ||
    message.includes("connection to server") ||
    message.includes("recovery mode") ||
    message.includes("schema cache") ||
    message.includes("retrying") ||
    message.includes("no connection") ||
    message.includes("temporarily unavailable") ||
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("networkerror") ||
    message.includes("load failed")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function withSupabaseRetry<T extends SupabaseResult>(
  operation: () => PromiseLike<T>,
  attempts = 8,
) {
  let result: T;

  try {
    result = await operation();
  } catch (error) {
    result = { error: { message: error instanceof Error ? error.message : "Network error" } } as T;
  }

  for (let attempt = 1; attempt < attempts && isTransientDatabaseError(result.error); attempt += 1) {
    await delay(Math.min(900 * 2 ** (attempt - 1), 8000));
    try {
      result = await operation();
    } catch (error) {
      result = { error: { message: error instanceof Error ? error.message : "Network error" } } as T;
    }
  }

  return result;
}