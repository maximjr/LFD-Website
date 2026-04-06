/**
 * Retries an asynchronous function a specified number of times.
 * @param fn The asynchronous function to retry.
 * @param retries The number of retries to attempt.
 * @returns The result of the function if successful.
 */
export async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise((r) => setTimeout(r, 2000));
    return retry(fn, retries - 1);
  }
}
