export function createApiClient(token) {
  const baseUrl = "https://api.nature.global/";
  const defaultHeaders = { Authorization: `Bearer ${token}` };

  const get = (path, params) => request(baseUrl, path, "GET", defaultHeaders, params);
  const post = (path, body) => request(baseUrl, path, "POST", defaultHeaders, undefined, body);

  return { get, post };
}

async function request(baseUrl, path, method, defaultHeaders, params, body) {
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers = { ...defaultHeaders };
  if (typeof body === "string") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method === "GET" ? undefined : typeof body === "string" ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await readResponseBody(res);
    throw new Error(errorBody || `${res.status} ${res.statusText}`);
  }

  return readResponseBody(res);
}

async function readResponseBody(res) {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
