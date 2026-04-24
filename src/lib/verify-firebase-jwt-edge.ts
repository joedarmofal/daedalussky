import * as jose from "jose";

const JWKS = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export async function verifyFirebaseSessionCookie(
  jwt: string,
  projectId: string,
): Promise<boolean> {
  try {
    await jose.jwtVerify(jwt, JWKS, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    });
    return true;
  } catch {
    return false;
  }
}

export async function verifyFirebaseIdToken(jwt: string, projectId: string): Promise<boolean> {
  try {
    await jose.jwtVerify(jwt, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return true;
  } catch {
    return false;
  }
}
