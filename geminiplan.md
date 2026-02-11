Step 1: Firebase Project Setup & Dependencies The first step is to initialize Firebase in your project, configure the necessary services, and update your backend dependencies.

Initialize Firebase: If you haven't already, install the Firebase CLI (npm install -g firebase-tools) and run firebase init in your project's root directory. Select the following services:

Functions: To host your backend API. Hosting: To serve your web client. Firestore: To use as your new NoSQL database. Emulators: To enable local testing of your Firebase services. Update Backend Dependencies: You need to remove the Azure-specific packages from your API's package.json and add the Firebase Admin SDK.

package.json "private": true, "version": "0.0.0", "dependencies": { plaintext Show full code block "@azure/identity": "^4.0.0", "@dataconnect/generated": "file:src/dataconnect-generated", "@opentelemetry/api": "^1.9.0", "@opentelemetry/auto-instrumentations-node": "^0.52.0", "@opentelemetry/exporter-trace-otlp-http": "^0.52.0", "@opentelemetry/resources": "^1.25.1", "@opentelemetry/sdk-node": "^0.52.0", "@opentelemetry/semantic-conventions": "^1.25.1", "@voidverse/game-core": "file:../packages/game-core", plaintext "durable-functions": "^2.1.4", plaintext "mssql": "^11.0.1", plaintext "firebase-admin": "^12.0.0", plaintext "firebase-functions": "^5.0.0", "redis": "^4.7.1", "undici": "^6.21.0" } } plaintext

After editing package.json, run npm install inside the api directory.

Step 2: Authentication Migration (Azure to Firebase Auth) Next, you'll replace Azure's authentication mechanism with Firebase Authentication on both the frontend and backend.

Refactor Frontend Authentication (AuthService.js): Update src/core/AuthService.js to use the Firebase client SDK for handling user sign-in, sign-out, and session management. The existing logic that calls /.auth/me will be replaced entirely.

AuthService.js -const getBuildEnv = () =>

typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {}; -const getRuntimeEnv = () => {

if (typeof globalThis === "undefined") return {}; const runtimeConfig = globalThis.RUNTIME_CONFIG; return runtimeConfig && typeof runtimeConfig === "object" ? runtimeConfig : {}; -}; -const pickEnvValue = (...values) => {

for (const value of values) { if (typeof value === "string" && value.trim()) return value.trim(); } return undefined; -}; -const normalizeBaseUrl = (value) => value.replace(//+$/g, ""); -const resolveAuthBaseUrl = () => {

const runtimeEnv = getRuntimeEnv(); const buildEnv = getBuildEnv(); const base = pickEnvValue( runtimeEnv.VITE_AUTH_BASE_URL, buildEnv.VITE_AUTH_BASE_URL, ); return base ? normalizeBaseUrl(base) : ""; -}; -const resolveAuthProvider = () => {

const runtimeEnv = getRuntimeEnv(); const buildEnv = getBuildEnv(); return ( pickEnvValue(runtimeEnv.VITE_AUTH_PROVIDER, buildEnv.VITE_AUTH_PROVIDER) || "aad" ); -}; -const getDevUser = () => {

const runtimeEnv = getRuntimeEnv(); const buildEnv = getBuildEnv(); const devUserId = pickEnvValue( runtimeEnv.VITE_DEV_USER_ID, buildEnv.VITE_DEV_USER_ID, ); if (!devUserId) return null; const devUserEmail = pickEnvValue( runtimeEnv.VITE_DEV_USER_EMAIL, buildEnv.VITE_DEV_USER_EMAIL, ); return { id: devUserId, email: devUserEmail || devUserId, provider: "dev", roles: ["authenticated"], }; -}; +import { initializeApp } from "firebase/app"; +import { getAuth, onAuthStateChanged as onFirebaseAuthStateChanged, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, signOut as firebaseSignOut, +} from "firebase/auth"; +// NOTE: Your Firebase config should be loaded from your environment +const firebaseConfig = {

apiKey: "...", authDomain: "...", projectId: "...", // ... +}; +initializeApp(firebaseConfig); +const auth = getAuth();

const mapClientPrincipal = (principal) => { if (!principal || typeof principal !== "object") return null;

const userId = principal.userId || principal.userDetails; if (!userId) return null; return { id: String(userId), email: principal.userDetails ? String(principal.userDetails) : String(userId), provider: principal.identityProvider ? String(principal.identityProvider) : "", roles: Array.isArray(principal.userRoles) ? principal.userRoles : [], id: principal.uid, email: principal.email, provider: principal.providerData?.[0]?.providerId || "firebase", roles: ["authenticated"], }; }; -const buildAuthUrl = (path, redirectTo) => {

const base = resolveAuthBaseUrl(); const prefix = base ? ${base} : ""; const redirect = redirectTo || window.location.href; const encoded = encodeURIComponent(redirect); return ${prefix}${path}?post_login_redirect_uri=${encoded}; -}; export async function signUp() { return signIn(); }

-export async function signIn() {

const devUser = getDevUser(); if (devUser) { return { success: true, user: devUser }; +export async function signIn(providerName = "google") { const provider = providerName === "github" plaintext ? new GithubAuthProvider() plaintext : new GoogleAuthProvider(); try { const result = await signInWithPopup(auth, provider); return { success: true, user: mapClientPrincipal(result.user) }; } catch (error) { console.error("Sign in error:", error); return { success: false, error: error.message }; } const provider = resolveAuthProvider(); window.location.assign(buildAuthUrl(/.auth/login/${provider})); return { success: true }; } export async function signOut() {

const devUser = getDevUser(); if (devUser) { return { success: true }; } const base = resolveAuthBaseUrl(); const redirect = encodeURIComponent(window.location.href); const url = ${base}/.auth/logout?post_logout_redirect_uri=${redirect}; window.location.assign(url); await firebaseSignOut(auth); return { success: true }; } export async function getCurrentUser() {

const devUser = getDevUser(); if (devUser) return devUser; try { const base = resolveAuthBaseUrl(); const response = await fetch(${base}/.auth/me, { plaintext credentials: "include", }); if (!response.ok) return null; const data = await response.json().catch(() => null); return mapClientPrincipal(data?.clientPrincipal); } catch (error) { console.error("Get current user error:", error); return null; } return new Promise((resolve) => { const unsubscribe = onFirebaseAuthStateChanged(auth, (user) => { plaintext unsubscribe(); plaintext resolve(mapClientPrincipal(user)); }); }); } -export function onAuthStateChange(callback) {

let active = true; const notify = async () => { if (!active) return; const user = await getCurrentUser(); if (active) callback(user); }; notify(); const handleVisibility = () => { if (document.visibilityState === "visible") { plaintext notify(); } }; window.addEventListener("focus", notify); document.addEventListener("visibilitychange", handleVisibility); return () => { active = false; window.removeEventListener("focus", notify); document.removeEventListener("visibilitychange", handleVisibility); }; +export function onAuthStateChange(callback) { return onFirebaseAuthStateChanged(auth, (user) => { callback(mapClientPrincipal(user)); }); } export async function resetPassword() {

plaintext Show full code block

Update Backend Authentication (auth.js): Modify api/lib/auth.js to validate the Firebase ID token sent from the client in the Authorization header, replacing the logic that parses the x-ms-client-principal header.

auth.js: 3 lines selected
+import { getAuth } from "firebase-admin/auth"; + function getHeader(req, name) { if (!req || !req.headers) return ""; const lower = name.toLowerCase(); return req.headers[lower] || req.headers[name] || ""; -}
-function parseClientPrincipal(encoded) {

if (!encoded) return null;
try {
const json = Buffer.from(encoded, "base64").toString("utf8");
const principal = JSON.parse(json);
if (!principal || typeof principal !== "object") return null;
const userId = principal.userId || principal.userDetails;
if (!userId) return null;
return {
plaintext: 1 lines selected
 id: String(userId),
plaintext: 1 lines selected
 email: principal.userDetails ? String(principal.userDetails) : String(userId),
plaintext: 1 lines selected
 provider: principal.identityProvider ? String(principal.identityProvider) : "",
plaintext: 1 lines selected
 roles: Array.isArray(principal.userRoles) ? principal.userRoles : [],
};
} catch {
return null;
} }
function getDevUser(req) { @@ -53,29 +37,28 @@ return null; }

-function getUserFromRequest(req) { +async function getUserFromRequest(req) { const devUser = getDevUser(req); if (devUser) return devUser;

const principalHeader = getHeader(req, "x-ms-client-principal");
const parsed = parseClientPrincipal(principalHeader);
if (parsed) return parsed;
const principalId = getHeader(req, "x-ms-client-principal-id");
const principalName = getHeader(req, "x-ms-client-principal-name");
if (principalId || principalName) {
const id = principalId || principalName;
const authHeader = getHeader(req, "Authorization");
if (!authHeader?.startsWith("Bearer ")) {
return null;
}
const idToken = authHeader.split("Bearer ")[1];
try {
const decodedToken = await getAuth().verifyIdToken(idToken); return {
plaintext: 1 lines selected
 id: String(id),
plaintext: 1 lines selected
 email: String(principalName || principalId || id),
plaintext: 1 lines selected
 provider: String(getHeader(req, "x-ms-client-principal-idp") || ""),
plaintext: 1 lines selected
 roles: ["authenticated"],
plaintext: 1 lines selected
 id: decodedToken.uid,
plaintext: 1 lines selected
 email: decodedToken.email,
plaintext: 1 lines selected
 provider: decodedToken.firebase.sign_in_provider,
plaintext: 1 lines selected
 roles: ["authenticated"], // Or use custom claims
};
} catch (error) {
console.error("Error verifying Firebase ID token:", error);
return null; }
return null; }
module.exports = { Step 3: Database and API Migration This is the most significant part of the migration, where you'll replace the Azure SQL database logic with Firestore and refactor your Azure Functions.

Replace SQL with Firestore: Your current data access layer in api/lib/sql.js will be deprecated. Create a new service for Firestore interactions. Since your game state is already JSON-heavy, this data maps very cleanly to Firestore documents.

Action: Delete d:\ai t6ext\my-litrpg-gameztrui\api\lib\sql.js and create a new file, e.g., api/lib/firestore.js, to handle all database operations using the firebase-admin/firestore SDK.

Refactor Azure Functions to Firebase Functions: Your API endpoints need to be converted. For example, the orchestrator function in api/orchestrator/index.js will change its signature and core logic.

Signature Change: The Azure Functions signature module.exports = async function(context, req) will become a Firebase Functions handler like export const orchestrator = onRequest(async (req, res) => { ... });. Durable Tasking: The plan correctly identifies that the orchestrator's in-memory task queue is not suitable for production. You should replace this with a more robust solution. A good pattern is to write tasks as documents to a tasks collection in Firestore and use a Firestore-triggered function to process them. Step 4: AI Service Migration (Azure AI to Vertex AI) To complete the move to the Google Cloud ecosystem, you'll refactor the AI service to use Vertex AI instead of Azure AI Foundry.

Refactor foundry-run.js: The current implementation in api/lib/foundry-run.js relies on Azure's DefaultAzureCredential for managed identity authentication, which will not work in a Firebase environment. You will need to replace this with Vertex AI's client library and service account authentication.

Action: Modify api/lib/foundry-run.js (or create a new api/lib/vertex-ai-run.js).

Replace resolveFoundryAuth with logic to initialize the Vertex AI client, likely using a service account key file specified in your environment variables. Replace the calls to Azure AI endpoints (/threads, /runs, etc.) with the equivalent methods from the Vertex AI Node.js client library. Step 5: Hosting and Deployment Configuration Finally, configure Firebase Hosting to serve your frontend application and route API requests to your new Firebase Functions.

Configure firebase.json: Update your firebase.json file to include a hosting configuration. The rewrites rule is crucial for directing API calls from your frontend (e.g., to /api/...) to your backend functions.

firebase.json { plaintext "hosting": { plaintext "public": "dist", plaintext "ignore": [ plaintext "firebase.json", plaintext "/.*", plaintext "/node_modules/" plaintext ], plaintext "rewrites": [ plaintext { plaintext "source": "/api/", plaintext "function": "api" plaintext } plaintext ] plaintext Show full code block }, "emulators": { "dataconnect": { "dataDir": "dataconnect/.dataconnect/pgliteData" } }, "dataconnect": { "source": "dataconnect" } } plaintext (Note: This assumes your frontend build output is in the dist directory and your main API function is named api).

By following these steps methodically, you can successfully transition your application's backend from Azure to Firebase and Vertex AI.