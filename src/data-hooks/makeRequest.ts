import { AuthService } from "../services";
import { SHARED_CONFIG } from "../services/config";
import { ApiRequestError } from "./_errors";

const pathWithBaseUrl = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }
  return (process.env.NEXT_PUBLIC_BASE_URL || "") + path;
};

const getRequestHeaders = () => {
  const authToken = AuthService.getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

const handleRequestError = async (response: Response, errorMessage: string) => {
  if (response.ok) {
    return;
  }
  const error = await response.json();

  if ([401, 400].includes(response.status)) {
    if (error.errorCode === SHARED_CONFIG.AUTH_ERROR_CODE) {
      AuthService.removeAuthToken();
      window.location.replace(SHARED_CONFIG.AUTH_SIGNIN_URL);
    }
  }
  throw new ApiRequestError(response.status, error.message || errorMessage);
};

export async function makeRawRequest(path: string, errorMessage?: string) {
  const response = await fetch(pathWithBaseUrl(path), {
    method: "GET",
    headers: {
      ...getRequestHeaders(),
    },
  });

  await handleRequestError(
    response,
    errorMessage ||
      "An error occurred downloading your data, Please try again later"
  );

  return response;
}

export async function makeGetRequest(path: string, errorMessage?: string) {
  const response = await makeRawRequest(path, errorMessage);
  return response.json();
}

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });

interface IActionRequestOptions {
  mockRequest?: unknown;
  errorMessage?: string;
}

export const makeActionRequest = async (
  method: "POST" | "PATCH" | "DELETE" | "PUT",
  path: string,
  data?: unknown,
  options: IActionRequestOptions = {}
) => {
  if (options.mockRequest !== undefined) {
    await sleep(500);
    return options.mockRequest;
  }
  const response = await fetch(pathWithBaseUrl(path), {
    method,
    headers: {
      ...getRequestHeaders(),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  await handleRequestError(
    response,
    options.errorMessage || "An error occurred processing your request"
  );

  try {
    return await response.json();
  } catch {
    return response;
  }
};

export async function makePostRequest(
  path: string,
  data?: unknown,
  options?: IActionRequestOptions
) {
  return makeActionRequest("POST", path, data, options);
}

export async function makePatchRequest(
  path: string,
  data?: unknown,
  options?: IActionRequestOptions
) {
  return makeActionRequest("PATCH", path, data, options);
}

export async function makeDeleteRequest(
  path: string,
  data?: unknown,
  options?: IActionRequestOptions
) {
  return makeActionRequest("DELETE", path, data, options);
}

export async function makePutRequest(
  path: string,
  data?: unknown,
  options?: IActionRequestOptions
) {
  return makeActionRequest("PUT", path, data, options);
}
