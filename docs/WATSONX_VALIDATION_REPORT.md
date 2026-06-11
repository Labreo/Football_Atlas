# Watsonx Validation Report

Date: 2026-06-11

## Goal
Validate and restore Watsonx.ai connectivity for Football Atlas without adding new features or infrastructure.

## Diagnostic script created
- File: `backend/verifyWatsonx.ts`
- Purpose: authenticate with IBM IAM, request an access token, perform a minimal Granite inference, and print status for authentication, project, model availability, and latency.
- Execution command:
  - `cd backend && npx ts-node verifyWatsonx.ts`

## Local vs deployment environment comparison

### Local environment (current `backend/.env`)
- `IBM_API_KEY`: starts with `sk-or-` (OpenRouter-style key)
- `IBM_PROJECT_ID`: `openrouter-mode`
- `IBM_BASE_URL`: `openrouter.ai/api/v1`
- `IBM_GRANITE_MODEL`: `ibm-granite/granite-4.1-8b`
- `IBM_URL`: unset
- `IBM_REGION`: unset

### Deployment environment expected configuration
- `backend/render.yaml` declares runtime env vars:
  - `IBM_API_KEY`
  - `IBM_PROJECT_ID`
  - `IBM_GRANITE_MODEL`
  - `IBM_BASE_URL`
- Code also recognizes `IBM_URL` as an optional alias for `IBM_BASE_URL`.
- `IBM_REGION` is not currently required by the backend, but it may be useful for documentation and consistency.

### Key mismatch
- Local config is using OpenRouter credentials and endpoint values, while the backend health check and Watsonx production flow expect IBM Cloud IAM credentials and a Watsonx region host.
- This mismatch is the likely root cause of the IAM failure.

## Root cause
The current local environment is configured for OpenRouter-style access, not IBM Watsonx IAM:
- `IBM_API_KEY` starts with `sk-or-`, which is not a valid IBM Cloud API key.
- `IBM_BASE_URL` is `openrouter.ai/api/v1`, which is not a Watsonx region host.
- The backend still performs IBM IAM authentication via `https://iam.cloud.ibm.com/identity/token`.
- As a result, the IAM endpoint returns `400 Bad Request` with:
  - `errorCode: BXNIM0415E`
  - `errorMessage: Provided API key could not be found.`

## Validation results

### Script output
The diagnostic run produced the following:

- Environment loaded: `backend/.env`
- Detected key style: `OpenRouter-style key (not IBM IAM)`
- IAM Authentication Check: FAILED
- Error detail: `IAM auth failed: 400 Bad Request - {"errorCode":"BXNIM0415E","errorMessage":"Provided API key could not be found." ...}`
- Granite inference: skipped because IAM token acquisition failed.

### Interpretation
- Authentication fails before any Granite call can succeed.
- The failure is not due to a missing `IBM_PROJECT_ID` or model setting in this run; it is caused by the incorrect key/endpoint combination.

## Fix applied
- Created a standalone validation script: `backend/verifyWatsonx.ts`.
- Updated the script to:
  - load `backend/.env`
  - display effective Watsonx-related environment variables
  - detect OpenRouter/HuggingFace key styles and warn if present
  - authenticate against IBM IAM
  - send a minimal Granite inference request
- No functional features of Football Atlas were changed.

## Recommended correction
Update the Watsonx environment to use valid IBM Cloud Watsonx credentials and endpoint values:

- `IBM_API_KEY`: IBM Cloud IAM API key (not an OpenRouter `sk-or-` key)
- `IBM_PROJECT_ID`: valid Watsonx project ID
- `IBM_BASE_URL`: Watsonx region host, for example `us-south.ml.cloud.ibm.com` or the correct region host for your instance
- Optionally set `IBM_URL` to the same value as `IBM_BASE_URL` if desired for clarity
- Optionally set `IBM_REGION` for documentation, though the backend currently uses `IBM_BASE_URL`

## Final verification
After correcting the environment to valid Watsonx IAM credentials and endpoint values, re-run:

```bash
cd backend
npx ts-node verifyWatsonx.ts
```

Expected success criteria:
- `Authentication Status: SUCCESS`
- `Granite inference status: SUCCESS`
- Response latency printed in milliseconds
- A valid Granite response body returned from Watsonx

## Notes
- The current failure is not a backend coding bug in the Watsonx health checker; it is a configuration mismatch between OpenRouter and IBM Watsonx.
- Once the correct IBM Watsonx credentials are set, the diagnostic script will confirm the restored connection.
