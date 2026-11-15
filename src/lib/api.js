export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('Unable to reach the server. Please try again.');
  }
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || 'Request failed.'), { status: response.status });
  return data;
}
