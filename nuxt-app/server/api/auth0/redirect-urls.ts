import { nanoid } from "nanoid";

const state: { [key: string]: number } = {};

const genState = () => {
  const s = nanoid();
  state[s] = 1;
  return s;
};

export const verifyNonce = (nonce: string) => {
  if (state[nonce]) {
    delete state[nonce];
    return true;
  }
  return false;
};

const runtime = useRuntimeConfig();

export const loginRedirectUrl = () =>
  `${
    runtime.AUTH0_DOMAIN
  }authorize?response_type=id_token&response_mode=form_post&client_id=${
    runtime.AUTH0_CLIENT_ID
  }&scope=openid%20email&redirect_uri=${encodeURIComponent(
    runtime.SERVER_BASE_URL + "api/auth0/login-callback"
  )}&nonce=${genState()}`;

export const logoutRedirectUrl = (id_token: string) =>
  `${
    runtime.AUTH0_DOMAIN
  }oidc/logout?id_token_hint=${id_token}&post_logout_redirect_uri=${encodeURIComponent(
    runtime.SERVER_BASE_URL + "api/auth0/logout-callback"
  )}&nonce=${genState()}`;
