import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import path from "path";
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, setLogLevel, updateDoc } from "firebase/firestore";

const PROJECT_ID = "demo-my-litrpg-gameztrui-rules";
const RULES_PATH = path.resolve(process.cwd(), "firestore.rules");
const FIRESTORE_EMULATOR_HOST = String(
	process.env.FIRESTORE_EMULATOR_HOST || "",
).trim();

function parseHostPort(hostPort) {
	if (!hostPort) return null;
	const trimmed = hostPort.trim();
	const separator = trimmed.lastIndexOf(":");
	if (separator <= 0 || separator >= trimmed.length - 1) return null;
	const host = trimmed.slice(0, separator);
	const port = Number.parseInt(trimmed.slice(separator + 1), 10);
	if (!host || !Number.isFinite(port) || port < 1) return null;
	return { host, port };
}

const emulatorTarget = parseHostPort(FIRESTORE_EMULATOR_HOST);
const describeWithEmulator = emulatorTarget ? describe : describe.skip;

describeWithEmulator("firestore security rules", () => {
	let testEnv;

	beforeAll(async () => {
		// These tests intentionally trigger denied writes; keep logs quiet in CI output.
		setLogLevel("error");
		testEnv = await initializeTestEnvironment({
			projectId: PROJECT_ID,
			firestore: {
				host: emulatorTarget.host,
				port: emulatorTarget.port,
				rules: readFileSync(RULES_PATH, "utf8"),
			},
		});
	});

	afterAll(async () => {
		if (testEnv) {
			await testEnv.cleanup();
		}
	});

	it("denies unauthenticated reads/writes to save-related collections", async () => {
		const anonDb = testEnv.unauthenticatedContext().firestore();
		await assertFails(getDoc(doc(anonDb, "game_saves", "save-1")));
		await assertFails(
			setDoc(doc(anonDb, "sync_runs", "run-1"), {
				owner_id: "anon",
				run_id: "run-1",
			}),
		);
		await assertFails(
			setDoc(doc(anonDb, "run_events", "event-1"), {
				owner_id: "anon",
				run_id: "run-1",
			}),
		);
	});

	it("denies authenticated access to another user's data", async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			const adminDb = context.firestore();
			await setDoc(doc(adminDb, "game_saves", "save-bob"), {
				user_id: "bob",
				save_name: "Bob Save",
			});
			await setDoc(doc(adminDb, "sync_runs", "bob:run-1"), {
				owner_id: "bob",
				run_id: "run-1",
				state: { seq: 2, tick: 2 },
			});
		});

		const aliceDb = testEnv.authenticatedContext("alice").firestore();
		await assertFails(getDoc(doc(aliceDb, "game_saves", "save-bob")));
		await assertFails(updateDoc(doc(aliceDb, "sync_runs", "bob:run-1"), { run_id: "run-2" }));
	});

	it("allows owner-scoped operations", async () => {
		const aliceDb = testEnv.authenticatedContext("alice").firestore();
		const saveRef = doc(aliceDb, "game_saves", "save-alice");
		await assertSucceeds(
			setDoc(saveRef, {
				user_id: "alice",
				save_name: "Alice Save",
				game_state: "{}",
			}),
		);
		await assertSucceeds(getDoc(saveRef));
		await assertSucceeds(updateDoc(saveRef, { save_name: "Alice Save 2" }));
		const snapshot = await getDoc(saveRef);
		expect(snapshot.exists()).toBe(true);
		expect(snapshot.data().save_name).toBe("Alice Save 2");
	});
});
