import { envVarOrFail } from "../../env-utils";

export const kGoogleApiJsUrl = "https://apis.google.com/js/api.js";
export const kGoogleClientJsUrl = "https://accounts.google.com/gsi/client";

export const kAppId = envVarOrFail("VITE_GOOGLE_APP_ID");
export const kApiKey = envVarOrFail("VITE_GOOGLE_API_KEY");
export const kClientId = envVarOrFail("VITE_GOOGLE_CLIENT_ID");

export const kScopes = "https://www.googleapis.com/auth/drive.file";

export const kDriveDiscoveryUrl =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

export const kPostResumableUploadUrl =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";

export const kGetFileUrlBase = "https://www.googleapis.com/drive/v3/files";

export const kGetUserInfo = "https://www.googleapis.com/drive/v3/about";
