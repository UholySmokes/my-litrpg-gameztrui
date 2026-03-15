const crypto = require("crypto");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const runtime = require("./firebase-agents/runtime");
const store = require("./bulk-gen-store");

const DEFAULT_QUEST_COUNT = 20000;
const DEFAULT_LORE_COUNT = 8000;
const DEFAULT_ASSET_COUNT = 12000;
const DEFAULT_VARIANTS_PER_ASSET = 3;
const DEFAULT_IMAGE_MODEL = "imagen-4.0-fast-generate-001";
const DEFAULT_TEXT_MODEL = "gemini-2.5-flash";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_INITIAL_CREDITS_EUR = 2800;
const DEFAULT_STOP_THRESHOLD_EUR = 120;
const DEFAULT_IMAGE_COST_EUR = 0.02;
const DEFAULT_TEXT_COST_EUR = 0.002;
const DEFAULT_BUCKET_PATH_PREFIX = "bulk-generation";
const DEFAULT_IMAGE_LOCATION = "us-central1";
const DEFAULT_EXPIRY_DATE = "2026-03-10T00:00:00Z";
const DEFAULT_MAX_QUEST_COUNT = 50000;
const DEFAULT_MAX_LORE_COUNT = 30000;
const DEFAULT_MAX_ASSET_COUNT = 30000;
const DEFAULT_STYLE_PROMPT =
	"Painterly high-fantasy concept art, consistent brushwork, dramatic but readable lighting, clean silhouette, no modern objects.";
const DEFAULT_NEGATIVE_PROMPT =
	"blurry, low-detail, modern city, text overlay, watermark, logo, malformed anatomy, distorted limbs";
const ASSET_KIND_CYCLE = ["asset2d", "quest_arc", "lore_book"];
const ASSET_TYPE_WEIGHTS = [
	{ type: "zone_splash", weight: 1 },
	{ type: "lore_illustration", weight: 4 },
	{ type: "npc_portrait", weight: 5 },
	{ type: "item_icon", weight: 10 },
];
const IMAGE_MODEL_COSTS_EUR = {
	"imagen-4.0-fast-generate-001": 0.02,
	"imagen-4.0-generate-001": 0.04,
	"imagen-4.0-ultra-generate-001": 0.06,
};

let predictionClientPromise = null;
let aiplatformSdkPromise = null;

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function parseOptionalNumber(raw, fallback) {
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalInteger(raw, fallback) {
	const parsed = Number.parseInt(String(raw || ""), 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalBoolean(raw, fallback = false) {
	if (typeof raw !== "string") return fallback;
	const normalized = raw.trim().toLowerCase();
	if (!normalized) return fallback;
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;
	return fallback;
}

function clampInt(value, min, max) {
	const parsed = parseOptionalInteger(value, min);
	return Math.max(min, Math.min(max, parsed));
}

function normalizeObject(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeString(value, fallback = "") {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function inferImageCostPerVariantEur(imageModel) {
	const normalized = normalizeString(imageModel).toLowerCase();
	return IMAGE_MODEL_COSTS_EUR[normalized] ?? DEFAULT_IMAGE_COST_EUR;
}

function buildGenerationProfile(config, body) {
	const normalizedBody = normalizeObject(body);
	const imageModel = normalizeString(normalizedBody.imageModel, config.imageModel);
	return {
		image_model: imageModel,
		image_location: normalizeString(normalizedBody.imageLocation, config.imageLocation),
		image_variants: clampInt(
			normalizedBody.imageVariants ?? normalizedBody.variantsPerAsset ?? config.variantsPerAsset,
			1,
			4,
		),
		image_cost_per_variant_eur: Math.max(
			0,
			parseOptionalNumber(
				normalizedBody.imageCostPerVariantEur,
				inferImageCostPerVariantEur(imageModel),
			),
		),
		text_model: normalizeString(normalizedBody.textModel, config.textModel),
		text_cost_per_output_eur: Math.max(
			0,
			parseOptionalNumber(normalizedBody.textCostPerOutputEur, config.textCostPerOutputEur),
		),
	};
}

function applyGenerationProfile(config, profileRaw) {
	const profile = normalizeObject(profileRaw);
	const imageModel = normalizeString(profile.image_model, config.imageModel);
	return {
		...config,
		imageModel,
		imageLocation: normalizeString(profile.image_location, config.imageLocation),
		variantsPerAsset: clampInt(profile.image_variants, 1, 4),
		imageCostPerVariantEur: Math.max(
			0,
			parseOptionalNumber(
				profile.image_cost_per_variant_eur,
				inferImageCostPerVariantEur(imageModel),
			),
		),
		textModel: normalizeString(profile.text_model, config.textModel),
		textCostPerOutputEur: Math.max(
			0,
			parseOptionalNumber(profile.text_cost_per_output_eur, config.textCostPerOutputEur),
		),
	};
}

function buildConfig() {
	const imageModel = getOptionalEnv("BULK_GEN_IMAGE_MODEL") || DEFAULT_IMAGE_MODEL;
	return {
		enabled: parseOptionalBoolean(getOptionalEnv("BULK_GEN_ENABLED"), true),
		defaultQuestCount: parseOptionalInteger(getOptionalEnv("BULK_GEN_DEFAULT_QUEST_COUNT"), DEFAULT_QUEST_COUNT),
		defaultLoreCount: parseOptionalInteger(getOptionalEnv("BULK_GEN_DEFAULT_LORE_COUNT"), DEFAULT_LORE_COUNT),
		defaultAssetCount: parseOptionalInteger(getOptionalEnv("BULK_GEN_DEFAULT_ASSET_COUNT"), DEFAULT_ASSET_COUNT),
		maxQuestCount: Math.max(1, parseOptionalInteger(getOptionalEnv("BULK_GEN_MAX_QUEST_COUNT"), DEFAULT_MAX_QUEST_COUNT)),
		maxLoreCount: Math.max(1, parseOptionalInteger(getOptionalEnv("BULK_GEN_MAX_LORE_COUNT"), DEFAULT_MAX_LORE_COUNT)),
		maxAssetCount: Math.max(1, parseOptionalInteger(getOptionalEnv("BULK_GEN_MAX_ASSET_COUNT"), DEFAULT_MAX_ASSET_COUNT)),
		variantsPerAsset: Math.max(
			1,
			// Vertex Imagen prebuilt models currently cap sampleCount at 4.
			Math.min(4, parseOptionalInteger(getOptionalEnv("BULK_GEN_IMAGE_VARIANTS"), DEFAULT_VARIANTS_PER_ASSET)),
		),
		imageModel,
		textModel: getOptionalEnv("BULK_GEN_TEXT_MODEL") || DEFAULT_TEXT_MODEL,
		imageLocation: getOptionalEnv("BULK_GEN_IMAGE_LOCATION") || DEFAULT_IMAGE_LOCATION,
		imageAspectRatio: getOptionalEnv("BULK_GEN_IMAGE_ASPECT_RATIO") || "1:1",
		defaultBatchSize: Math.max(1, Math.min(30, parseOptionalInteger(getOptionalEnv("BULK_GEN_BATCH_SIZE"), DEFAULT_BATCH_SIZE))),
		imageCostPerVariantEur: Math.max(
			0,
			parseOptionalNumber(
				getOptionalEnv("BULK_GEN_IMAGE_COST_PER_VARIANT_EUR"),
				inferImageCostPerVariantEur(imageModel),
			),
		),
		textCostPerOutputEur: Math.max(0, parseOptionalNumber(getOptionalEnv("BULK_GEN_TEXT_COST_PER_OUTPUT_EUR"), DEFAULT_TEXT_COST_EUR)),
		initialCreditsEur: Math.max(0, parseOptionalNumber(getOptionalEnv("BULK_GEN_INITIAL_CREDITS_EUR"), DEFAULT_INITIAL_CREDITS_EUR)),
		stopThresholdEur: Math.max(0, parseOptionalNumber(getOptionalEnv("BULK_GEN_STOP_THRESHOLD_EUR"), DEFAULT_STOP_THRESHOLD_EUR)),
		expiryDateIso: getOptionalEnv("BULK_GEN_CREDIT_EXPIRY_DATE") || DEFAULT_EXPIRY_DATE,
		seedBufferSize: Math.max(20, Math.min(500, parseOptionalInteger(getOptionalEnv("BULK_GEN_PENDING_BUFFER"), 120))),
		storageBucket: getOptionalEnv("BULK_GEN_STORAGE_BUCKET"),
		storagePrefix: getOptionalEnv("BULK_GEN_STORAGE_PREFIX") || DEFAULT_BUCKET_PATH_PREFIX,
	};
}

function resolveProjectId() {
	const fromEnv =
		getOptionalEnv("GCLOUD_PROJECT") ||
		getOptionalEnv("GOOGLE_CLOUD_PROJECT") ||
		getOptionalEnv("FIREBASE_PROJECT_ID");
	if (fromEnv) return fromEnv;

	const firebaseConfigRaw = getOptionalEnv("FIREBASE_CONFIG");
	if (!firebaseConfigRaw) return "";
	try {
		const parsed = JSON.parse(firebaseConfigRaw);
		return normalizeString(parsed?.projectId);
	} catch {
		return "";
	}
}

function ensureFirebaseApp() {
	if (getApps().length === 0) {
		initializeApp();
	}
}

function getStorageBucket(config) {
	ensureFirebaseApp();
	if (config.storageBucket) return getStorage().bucket(config.storageBucket);
	return getStorage().bucket();
}

async function getPredictionClient(config) {
	const { PredictionServiceClient } = await loadAiplatformSdk();
	if (!predictionClientPromise) {
		const apiEndpoint = String(config.imageLocation || "").toLowerCase() === "global"
			? "aiplatform.googleapis.com"
			: `${config.imageLocation}-aiplatform.googleapis.com`;
		predictionClientPromise = Promise.resolve(
			new PredictionServiceClient({
				apiEndpoint,
			}),
		);
	}
	return predictionClientPromise;
}

async function loadAiplatformSdk() {
	if (!aiplatformSdkPromise) {
		aiplatformSdkPromise = import("@google-cloud/aiplatform").then((mod) => {
			const PredictionServiceClient =
				mod?.PredictionServiceClient || mod?.default?.PredictionServiceClient;
			const helpers = mod?.helpers || mod?.default?.helpers;
			if (!PredictionServiceClient || !helpers?.toValue || !helpers?.fromValue) {
				throw new Error("Failed to load @google-cloud/aiplatform SDK exports.");
			}
			return { PredictionServiceClient, helpers };
		});
	}
	return aiplatformSdkPromise;
}

function createSeededRng(seedRaw) {
	let seed = Number.parseInt(String(seedRaw || ""), 10);
	if (!Number.isFinite(seed)) {
		seed = 0;
		for (const ch of String(seedRaw || crypto.randomUUID())) {
			seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
		}
	}
	return () => {
		seed += 0x6d2b79f5;
		let t = seed;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function buildDefaultZoneIds() {
	return [
		"city_of_ash",
		"verdant_fracture",
		"iron_deeps",
		"glass_wastes",
		"moonlit_floodplain",
		"howling_spires",
	];
}

function defaultStyleProfile(zoneId) {
	return {
		zone_id: zoneId,
		visual_style_prompt: `${DEFAULT_STYLE_PROMPT} Zone motif: ${zoneId.replace(/[_-]+/g, " ")}.`,
		negative_prompt: DEFAULT_NEGATIVE_PROMPT,
		palette: ["amber", "teal", "slate", "bone"],
		lighting: "cinematic high contrast",
		composition_rules: [
			"strong foreground-midground-background depth",
			"single clear focal subject",
			"readable silhouette at thumbnail size",
		],
		reference_assets: [],
	};
}

function buildRunMeta(config, body) {
	const zoneIdsRaw = Array.isArray(body.zoneIds) ? body.zoneIds : [];
	const zoneIds = zoneIdsRaw.map((zone) => normalizeString(zone)).filter(Boolean);
	const resolvedZoneIds = zoneIds.length ? zoneIds : buildDefaultZoneIds();
	const generationProfile = buildGenerationProfile(config, body);
	const targets = {
		quest_arc: clampInt(
			body.questCount ?? config.defaultQuestCount,
			0,
			config.maxQuestCount,
		),
		lore_book: clampInt(
			body.loreCount ?? config.defaultLoreCount,
			0,
			config.maxLoreCount,
		),
		asset2d: clampInt(
			body.assetCount ?? config.defaultAssetCount,
			0,
			config.maxAssetCount,
		),
	};
	return {
		seed: normalizeString(body.seed, crypto.randomUUID()),
		zone_ids: resolvedZoneIds,
		target_counts: targets,
		queued_counts: {
			quest_arc: 0,
			lore_book: 0,
			asset2d: 0,
		},
		generation_profile: generationProfile,
		budget_signal: "allow",
		budget_signal_ratio: 0,
		initial_credit_eur: Math.max(0, parseOptionalNumber(body.initialCreditsEur, config.initialCreditsEur)),
	};
}

function buildRunShape(ownerId, body, config) {
	const meta = buildRunMeta(config, body);
	const runConfig = applyGenerationProfile(config, meta.generation_profile);
	const maxTasks =
		meta.target_counts.quest_arc + meta.target_counts.lore_book + meta.target_counts.asset2d;
	const maxEstimatedEur = Math.max(
		0,
		parseOptionalNumber(
			body.maxEstimatedEur,
			meta.target_counts.quest_arc * runConfig.textCostPerOutputEur +
				meta.target_counts.lore_book * runConfig.textCostPerOutputEur +
				meta.target_counts.asset2d * runConfig.imageCostPerVariantEur * runConfig.variantsPerAsset,
		),
	);
	return {
		run_id: normalizeString(body.runId, crypto.randomUUID()),
		owner_id: normalizeString(ownerId),
		status: "running",
		pause_reason: "",
		credit_guard_mode: "hard-stop",
		max_tasks: maxTasks,
		completed_tasks: 0,
		failed_tasks: 0,
		pending_tasks: 0,
		max_estimated_eur: maxEstimatedEur,
		estimated_spend_eur: 0,
		credit_stop_threshold_eur: Math.max(
			0,
			parseOptionalNumber(body.creditStopThresholdEur, config.stopThresholdEur),
		),
		expires_at: normalizeString(body.expiresAt, config.expiryDateIso),
		meta,
	};
}

function estimateNarrativeCost(config) {
	return config.textCostPerOutputEur;
}

function estimateAssetCost(config) {
	return config.imageCostPerVariantEur * config.variantsPerAsset;
}

function weightedAssetType(index) {
	const totalWeight = ASSET_TYPE_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
	const pointer = index % totalWeight;
	let cursor = 0;
	for (const item of ASSET_TYPE_WEIGHTS) {
		cursor += item.weight;
		if (pointer < cursor) return item.type;
	}
	return "item_icon";
}

function buildNarrativePrompt(kind, zoneId, index) {
	if (kind === "quest_arc") {
		return [
			`Create a LitRPG quest arc in zone '${zoneId}'.`,
			`Quest index: ${index}.`,
			"Return strict JSON with keys: title, summary, steps, rewards, hooks.",
			"steps must be an array of 4-6 concise step strings.",
			"No markdown.",
		].join(" ");
	}
	return [
		`Create a lore entry for zone '${zoneId}'.`,
		`Lore index: ${index}.`,
		"Return strict JSON with keys: title, overview, legend, notable_landmarks, factions.",
		"No markdown.",
	].join(" ");
}

function buildAssetPrompt(assetType, zoneId, index, style) {
	const assetDescriptors = {
		zone_splash: "wide environment key art for zone reveal screen",
		lore_illustration: "storybook illustration for in-game lore page",
		npc_portrait: "waist-up character portrait for dialogue UI",
		item_icon: "single collectible item icon on transparent-friendly plain backdrop",
	};
	const descriptor = assetDescriptors[assetType] || assetDescriptors.item_icon;
	const composition = Array.isArray(style.composition_rules)
		? style.composition_rules.join("; ")
		: "";
	const palette = Array.isArray(style.palette) ? style.palette.join(", ") : "";
	return [
		`LitRPG ${descriptor}.`,
		`Zone: ${zoneId}.`,
		`Asset index: ${index}.`,
		style.visual_style_prompt,
		`Lighting: ${style.lighting || "cinematic"}.`,
		palette ? `Palette: ${palette}.` : "",
		composition ? `Composition: ${composition}.` : "",
	].filter(Boolean).join(" ");
}

function buildTaskId(runId, kind, index) {
	return `bg-${runId}-${kind}-${index}`;
}

function getRemainingCount(targetCounts, queuedCounts, kind) {
	return Math.max(0, (Number(targetCounts?.[kind]) || 0) - (Number(queuedCounts?.[kind]) || 0));
}

function parseTaskIndex(taskId) {
	const parts = String(taskId || "").split("-");
	const raw = parts[parts.length - 1];
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

function tryParseJson(raw) {
	if (typeof raw !== "string") return null;
	const trimmed = raw.trim();
	if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
	try {
		return JSON.parse(trimmed);
	} catch {
		return null;
	}
}

function rateImageVariant(variant) {
	let score = 0;
	if (!variant.filteredReason) score += 25;
	if (variant.buffer && variant.buffer.length > 20000) score += Math.min(40, variant.buffer.length / 5000);
	if (variant.mimeType && variant.mimeType.includes("png")) score += 5;
	if (variant.filteredReason) score -= 100;
	return score;
}

function pickBestImageVariant(variants) {
	const scored = variants.map((variant, index) => ({
		...variant,
		index,
		score: rateImageVariant(variant),
	}));
	scored.sort((a, b) => b.score - a.score || a.index - b.index);
	return scored[0] || null;
}

function extractImageVariantsFromPredictionRows(rows) {
	const variants = [];
	const stack = Array.isArray(rows) ? [...rows] : [];
	while (stack.length) {
		const item = stack.shift();
		if (!item || typeof item !== "object") continue;
		if (Array.isArray(item)) {
			stack.push(...item);
			continue;
		}
		if (Array.isArray(item.images)) {
			stack.push(...item.images);
		}
		if (Array.isArray(item.generatedImages)) {
			stack.push(...item.generatedImages);
		}
		const bytesBase64 =
			normalizeString(item.bytesBase64Encoded) ||
			normalizeString(item.imageBytes) ||
			normalizeString(item?.image?.bytesBase64Encoded);
		if (!bytesBase64) continue;
		const buffer = Buffer.from(bytesBase64, "base64");
		if (!buffer || buffer.length === 0) continue;
		variants.push({
			buffer,
			mimeType: normalizeString(item.mimeType, "image/png"),
			filteredReason:
				normalizeString(item.raiFilteredReason) ||
				normalizeString(item.filteredReason) ||
				"",
		});
	}
	return variants;
}

async function generateImageVariants({ prompt, negativePrompt, seed, config }) {
	const { helpers } = await loadAiplatformSdk();
	const projectId = resolveProjectId();
	if (!projectId) {
		const error = new Error("Missing project id for Vertex Imagen calls.");
		error.code = "MISSING_PROJECT_ID";
		throw error;
	}
	const client = await getPredictionClient(config);
	const endpoint = `projects/${projectId}/locations/${config.imageLocation}/publishers/google/models/${config.imageModel}`;
	const parameters = {
		sampleCount: config.variantsPerAsset,
		aspectRatio: config.imageAspectRatio,
		addWatermark: false,
		seed: parseOptionalInteger(seed, 1),
	};
	if (negativePrompt) parameters.negativePrompt = negativePrompt;

	const [response] = await client.predict({
		endpoint,
		instances: [helpers.toValue({ prompt })],
		parameters: helpers.toValue(parameters),
	});

	const predictionRows = Array.isArray(response?.predictions)
		? response.predictions.map((value) => helpers.fromValue(value))
		: [];
	const variants = extractImageVariantsFromPredictionRows(predictionRows).slice(
		0,
		config.variantsPerAsset,
	);
	if (variants.length === 0) {
		const error = new Error("Imagen call returned no variants.");
		error.code = "NO_IMAGE_VARIANTS";
		throw error;
	}
	return variants;
}

async function uploadVariantToStorage({ runId, taskId, variantIndex, variant, config }) {
	const bucket = getStorageBucket(config);
	const fileExt = variant.mimeType.includes("jpeg") || variant.mimeType.includes("jpg")
		? "jpg"
		: "png";
	const objectPath = `${config.storagePrefix}/${runId}/${taskId}/variant-${variantIndex}.${fileExt}`;
	const file = bucket.file(objectPath);
	await file.save(variant.buffer, {
		contentType: variant.mimeType,
		resumable: false,
		metadata: {
			cacheControl: "public,max-age=31536000,immutable",
		},
	});
	return `gs://${bucket.name}/${objectPath}`;
}

async function ensureStyleProfiles(zoneIds) {
	for (const zoneId of zoneIds) {
		const existing = await store.getStyleProfile(zoneId);
		if (existing) continue;
		await store.upsertStyleProfile(defaultStyleProfile(zoneId));
	}
}

async function seedTasksIfNeeded(run, config) {
	const meta = normalizeObject(run.meta);
	const targetCounts = normalizeObject(meta.target_counts);
	const queuedCounts = normalizeObject(meta.queued_counts);
	const pendingNow = Number(run.pending_tasks) || 0;
	const needed = Math.max(0, config.seedBufferSize - pendingNow);
	if (needed === 0) return { seeded: 0, queuedCounts };

	const seedValue = normalizeString(meta.seed, run.run_id);
	const rng = createSeededRng(seedValue);
	const zoneIds = Array.isArray(meta.zone_ids) && meta.zone_ids.length
		? meta.zone_ids.map((zone) => normalizeString(zone, "global"))
		: ["global"];

	const tasks = [];
	const nextQueuedCounts = {
		quest_arc: Number(queuedCounts.quest_arc) || 0,
		lore_book: Number(queuedCounts.lore_book) || 0,
		asset2d: Number(queuedCounts.asset2d) || 0,
	};

	for (let cursor = 0; cursor < needed; cursor += 1) {
		let chosenKind = "";
		for (let step = 0; step < ASSET_KIND_CYCLE.length; step += 1) {
			const candidate = ASSET_KIND_CYCLE[(cursor + step) % ASSET_KIND_CYCLE.length];
			if (getRemainingCount(targetCounts, nextQueuedCounts, candidate) > 0) {
				chosenKind = candidate;
				break;
			}
		}
		if (!chosenKind) break;

		const index = nextQueuedCounts[chosenKind];
		nextQueuedCounts[chosenKind] += 1;
		const zoneId = zoneIds[(Math.floor(rng() * 1000000) + index) % zoneIds.length] || "global";
		const taskId = buildTaskId(run.run_id, chosenKind, index);
		let task;
		if (chosenKind === "quest_arc" || chosenKind === "lore_book") {
			task = {
				task_id: taskId,
				run_id: run.run_id,
				kind: chosenKind,
				zone_id: zoneId,
				status: "pending",
				estimate_eur: estimateNarrativeCost(config),
				payload: {
					prompt: buildNarrativePrompt(chosenKind, zoneId, index),
				},
			};
		} else {
			const assetType = weightedAssetType(index);
			task = {
				task_id: taskId,
				run_id: run.run_id,
				kind: chosenKind,
				zone_id: zoneId,
				status: "pending",
				estimate_eur: estimateAssetCost(config),
				payload: {
					asset_type: assetType,
					seed: parseOptionalInteger(`${index}`, index + 1),
				},
			};
		}
		tasks.push(task);
	}

	if (tasks.length > 0) {
		await store.createTasks(run.run_id, tasks);
		await store.updateRun(run.run_id, {
			meta: {
				...meta,
				queued_counts: nextQueuedCounts,
			},
		});
	}
	return {
		seeded: tasks.length,
		queuedCounts: nextQueuedCounts,
	};
}

async function evaluateRunGuard(run, config) {
	if (!run) return { blocked: true, reason: "run-not-found", run };
	if (String(run.status) !== "running") {
		return { blocked: true, reason: `run-${run.status}`, run };
	}

	const now = Date.now();
	const expiresAtMs = Date.parse(normalizeString(run.expires_at));
	if (Number.isFinite(expiresAtMs) && now >= expiresAtMs) {
		const updated = await store.updateRun(run.run_id, {
			status: "paused",
			pause_reason: "Credit expiry window reached.",
		});
		await store.appendSpendEvent({
			run_id: run.run_id,
			source: "guard",
			action: "pause",
			estimated_cost_eur: Number(run.estimated_spend_eur) || 0,
			remaining_credit_estimate_eur: 0,
			note: "Run paused because expires_at has passed.",
		});
		return { blocked: true, reason: "expired", run: updated || run };
	}

	const maxEstimated = Number(run.max_estimated_eur) || 0;
	const spent = Number(run.estimated_spend_eur) || 0;
	if (maxEstimated > 0 && spent >= maxEstimated) {
		const updated = await store.updateRun(run.run_id, {
			status: "paused",
			pause_reason: "Estimated spend cap reached.",
		});
		await store.appendSpendEvent({
			run_id: run.run_id,
			source: "guard",
			action: "pause",
			estimated_cost_eur: spent,
			remaining_credit_estimate_eur: Math.max(0, maxEstimated - spent),
			note: "Run paused because max_estimated_eur threshold reached.",
		});
		return { blocked: true, reason: "max-estimated-spend", run: updated || run };
	}

	const meta = normalizeObject(run.meta);
	const initialCredit = Math.max(
		0,
		parseOptionalNumber(meta.initial_credit_eur, config.initialCreditsEur),
	);
	const remaining = Math.max(0, initialCredit - spent);
	const stopThreshold = Number(run.credit_stop_threshold_eur) || config.stopThresholdEur;
	if (remaining <= stopThreshold) {
		const updated = await store.updateRun(run.run_id, {
			status: "paused",
			pause_reason: `Remaining credit estimate (${remaining.toFixed(2)} EUR) is at/below stop threshold.`,
		});
		await store.appendSpendEvent({
			run_id: run.run_id,
			source: "guard",
			action: "pause",
			estimated_cost_eur: spent,
			remaining_credit_estimate_eur: remaining,
			note: "Run paused by remaining-credit guardrail.",
		});
		return { blocked: true, reason: "remaining-credit-threshold", run: updated || run };
	}
	return { blocked: false, reason: "ok", run };
}

async function processNarrativeTask(task, run, config) {
	const result = await runtime.runFirebaseAgent({
		agent: "content_smith",
		input: {
			content_request: normalizeString(task.payload?.prompt),
			world_context: {
				zone_id: task.zone_id,
				run_id: run.run_id,
				task_id: task.task_id,
				kind: task.kind,
			},
		},
		model: config.textModel,
		temperature: 0.35,
		topP: 0.95,
	});

	const structured = result?.structured || tryParseJson(result?.text);
	let title = "";
	let body = normalizeString(result?.text);
	if (structured && typeof structured === "object") {
		const draft = Array.isArray(structured?.drafts) ? structured.drafts[0] : structured;
		title = normalizeString(draft?.title || draft?.name);
		body = JSON.stringify(draft || structured);
	}
	if (!title) {
		title = `${task.kind} ${parseTaskIndex(task.task_id)}`;
	}

	const output = {
		run_id: run.run_id,
		task_id: task.task_id,
		output_type: task.kind,
		zone_id: task.zone_id,
		title,
		body,
		model: normalizeString(result?.model, config.textModel),
		meta: {
			backend: result?.backend,
		},
	};

	await store.appendOutputs([output]);
	await store.setTaskResult({
		taskId: task.task_id,
		status: "completed",
		lastError: "",
		estimateEurDelta: Number(task.estimate_eur) || estimateNarrativeCost(config),
	});
}

async function processAssetTask(task, run, config) {
	const style = (await store.getStyleProfile(task.zone_id)) || defaultStyleProfile(task.zone_id);
	const taskIndex = parseTaskIndex(task.task_id);
	const assetType = normalizeString(task.payload?.asset_type, "item_icon");
	const prompt = buildAssetPrompt(assetType, task.zone_id, taskIndex, style);
	const variants = await generateImageVariants({
		prompt,
		negativePrompt: style.negative_prompt,
		seed: task.payload?.seed ?? taskIndex + 1,
		config,
	});
	const best = pickBestImageVariant(variants);
	if (!best) {
		const error = new Error("Could not pick winning image variant.");
		error.code = "NO_BEST_VARIANT";
		throw error;
	}

	const outputs = [];
	for (let i = 0; i < variants.length; i += 1) {
		const variant = variants[i];
		const gcsUri = await uploadVariantToStorage({
			runId: run.run_id,
			taskId: task.task_id,
			variantIndex: i,
			variant,
			config,
		});
		outputs.push({
			run_id: run.run_id,
			task_id: task.task_id,
			output_type: "asset2d",
			zone_id: task.zone_id,
			title: `${assetType} ${taskIndex}`,
			body: prompt,
			model: config.imageModel,
			gcs_uri: gcsUri,
			asset_type: assetType,
			variant_index: i,
			quality_score: rateImageVariant(variant),
			is_winner: i === best.index,
			meta: {
				filtered_reason: variant.filteredReason,
				mime_type: variant.mimeType,
			},
		});
	}

	await store.appendOutputs(outputs);
	await store.setTaskResult({
		taskId: task.task_id,
		status: "completed",
		lastError: "",
		estimateEurDelta: Number(task.estimate_eur) || estimateAssetCost(config),
	});
}

function isRetryableQuotaError(error) {
	const code = error?.code;
	if (code === 8 || code === 429) return true;
	const message = normalizeString(error?.message);
	if (!message) return false;
	if (/RESOURCE_EXHAUSTED/i.test(message)) return true;
	if (/Too Many Requests/i.test(message)) return true;
	if (/Quota exceeded/i.test(message)) return true;
	if (/online_prediction_requests_per_base_model/i.test(message)) return true;
	return false;
}

function computeQuotaBackoffSeconds(task) {
	const attemptCount = Math.max(1, parseOptionalInteger(task?.attempt_count, 1));
	const exponent = Math.min(6, attemptCount - 1);
	const baseSeconds = 20;
	const maxSeconds = 15 * 60;
	const jitter = Math.floor(Math.random() * 7);
	return Math.min(maxSeconds, Math.round(baseSeconds * 2 ** exponent) + jitter);
}

async function processTask(task, run, config) {
	try {
		if (task.kind === "quest_arc" || task.kind === "lore_book") {
			await processNarrativeTask(task, run, config);
			return { ok: true, taskId: task.task_id, kind: task.kind };
		}
		if (task.kind === "asset2d") {
			await processAssetTask(task, run, config);
			return { ok: true, taskId: task.task_id, kind: task.kind };
		}
		throw new Error(`Unsupported task kind '${task.kind}'.`);
	} catch (error) {
		if (isRetryableQuotaError(error)) {
			const deferSeconds = computeQuotaBackoffSeconds(task);
			await store.rescheduleTask({
				taskId: task.task_id,
				lastError: normalizeString(error?.message, "Quota exhausted. Retrying later."),
				deferSeconds,
			});
			return {
				ok: false,
				taskId: task.task_id,
				kind: task.kind,
				errorCode: "QUOTA_BACKOFF",
				message: `Quota exhausted; rescheduled in ~${deferSeconds}s.`,
			};
		}
		await store.setTaskResult({
			taskId: task.task_id,
			status: "failed",
			lastError: normalizeString(error?.message, "Task failed."),
			estimateEurDelta: 0,
		});
		return {
			ok: false,
			taskId: task.task_id,
			kind: task.kind,
			errorCode: normalizeString(error?.code, "TASK_FAILED"),
			message: normalizeString(error?.message, "Task failed."),
		};
	}
}

async function maybeCompleteRun(runId) {
	const run = await store.getRun(runId);
	if (!run || String(run.status) !== "running") return run;
	const stats = await store.getRunTaskStats(runId);
	const meta = normalizeObject(run.meta);
	const target = normalizeObject(meta.target_counts);
	const queued = normalizeObject(meta.queued_counts);
	const queuedTotal = (Number(queued.quest_arc) || 0) + (Number(queued.lore_book) || 0) + (Number(queued.asset2d) || 0);
	const targetTotal = (Number(target.quest_arc) || 0) + (Number(target.lore_book) || 0) + (Number(target.asset2d) || 0);
	if (queuedTotal >= targetTotal && stats.pending === 0 && stats.running === 0) {
		return store.updateRun(runId, {
			status: "completed",
			pause_reason: "",
		});
	}
	return run;
}

async function startBulkGenerationRun({ ownerId, body }) {
	const config = buildConfig();
	if (!config.enabled) {
		const error = new Error("Bulk generation is disabled by BULK_GEN_ENABLED.");
		error.status = 503;
		error.code = "BULK_GEN_DISABLED";
		throw error;
	}
	const run = buildRunShape(ownerId, normalizeObject(body), config);
	await ensureStyleProfiles(run.meta.zone_ids);
	const created = await store.createRun(run);
	await store.appendSpendEvent({
		run_id: created.run_id,
		source: "run_start",
		action: "allow",
		estimated_cost_eur: 0,
		remaining_credit_estimate_eur: Number(created.meta?.initial_credit_eur) || config.initialCreditsEur,
		note: "Run created.",
	});
	return created;
}

async function tickBulkGenerationRun({ runId, workerId, limit }) {
	const baseConfig = buildConfig();
	const safeRunId = normalizeString(runId);
	if (!safeRunId) {
		const error = new Error("runId is required.");
		error.status = 400;
		error.code = "MISSING_RUN_ID";
		throw error;
	}
	const run = await store.getRun(safeRunId);
	if (!run) {
		const error = new Error("Run not found.");
		error.status = 404;
		error.code = "RUN_NOT_FOUND";
		throw error;
	}
	const config = applyGenerationProfile(
		baseConfig,
		normalizeObject(run.meta).generation_profile,
	);
	const guard = await evaluateRunGuard(run, config);
	if (guard.blocked) {
		return {
			ok: true,
			runId: safeRunId,
			status: guard.run?.status || "paused",
			guardReason: guard.reason,
			processed: 0,
			seeded: 0,
			results: [],
		};
	}

	const seeded = await seedTasksIfNeeded(run, config);
	const claimed = await store.claimPendingTasks({
		runId: safeRunId,
		workerId: normalizeString(workerId, "scheduler"),
		limit: Math.max(1, Math.min(50, parseOptionalInteger(limit, config.defaultBatchSize))),
		statuses: ["pending"],
	});

	const results = [];
	for (const task of claimed) {
		const result = await processTask(task, run, config);
		results.push(result);
	}
	const finalRun = await maybeCompleteRun(safeRunId);
	return {
		ok: true,
		runId: safeRunId,
		status: finalRun?.status || run.status,
		processed: claimed.length,
		seeded: seeded.seeded,
		results,
	};
}

async function pauseRun(runId, reason) {
	const safeRunId = normalizeString(runId);
	if (!safeRunId) return null;
	return store.updateRun(safeRunId, {
		status: "paused",
		pause_reason: normalizeString(reason, "Paused by operator."),
	});
}

async function resumeRun(runId) {
	const safeRunId = normalizeString(runId);
	if (!safeRunId) return null;
	return store.updateRun(safeRunId, {
		status: "running",
		pause_reason: "",
	});
}

function parseBudgetPayload(body) {
	const payload = normalizeObject(body);
	if (payload.message && typeof payload.message === "object") {
		const messageData = normalizeString(payload.message.data);
		if (messageData) {
			try {
				const decoded = Buffer.from(messageData, "base64").toString("utf8");
				return normalizeObject(JSON.parse(decoded));
			} catch {
				return {};
			}
		}
	}
	return payload;
}

function deriveBudgetAction(payload) {
	const budgetAmount = parseOptionalNumber(
		payload.budgetAmount || payload.budget_amount || payload.amount,
		0,
	);
	const costAmount = parseOptionalNumber(
		payload.costAmount || payload.cost_amount || payload.cost,
		0,
	);
	const threshold = parseOptionalNumber(
		payload.alertThresholdExceeded || payload.alert_threshold_exceeded,
		0,
	);

	let ratio = 0;
	if (budgetAmount > 0 && costAmount > 0) {
		ratio = costAmount / budgetAmount;
	} else if (threshold > 0) {
		ratio = threshold;
	}

	let action = "allow";
	if (ratio >= 0.95) action = "halt";
	else if (ratio >= 0.9) action = "pause";
	else if (ratio >= 0.85) action = "throttle";

	return { action, ratio, budgetAmount, costAmount };
}

async function handleBudgetAlert(body) {
	const payload = parseBudgetPayload(body);
	const decision = deriveBudgetAction(payload);
	const runningRuns = await store.listRuns({ status: "running", limit: 200 });

	const notes = [];
	for (const run of runningRuns) {
		const currentMeta = normalizeObject(run.meta);
		const nextMeta = {
			...currentMeta,
			budget_signal: decision.action,
			budget_signal_ratio: decision.ratio,
		};
		if (decision.action === "pause" || decision.action === "halt") {
			await store.updateRun(run.run_id, {
				status: "paused",
				pause_reason: `Budget signal '${decision.action}' at ratio ${decision.ratio.toFixed(3)}.`,
				meta: nextMeta,
			});
		} else {
			await store.updateRun(run.run_id, { meta: nextMeta });
		}
		await store.appendSpendEvent({
			run_id: run.run_id,
			source: "budget-alert",
			action: decision.action,
			estimated_cost_eur: Number(run.estimated_spend_eur) || 0,
			remaining_credit_estimate_eur: Math.max(
				0,
				(Number(currentMeta.initial_credit_eur) || 0) - (Number(run.estimated_spend_eur) || 0),
			),
			note: `Budget alert ratio ${decision.ratio.toFixed(3)}.`,
		});
		notes.push(run.run_id);
	}

	return {
		ok: true,
		action: decision.action,
		ratio: decision.ratio,
		affectedRuns: notes,
	};
}

async function getRunStatus(runId, outputLimit) {
	const safeRunId = normalizeString(runId);
	if (!safeRunId) return null;
	const run = await store.getRun(safeRunId);
	if (!run) return null;
	const stats = await store.getRunTaskStats(safeRunId);
	const outputs = await store.getRunOutputs(
		safeRunId,
		Math.max(1, Math.min(200, parseOptionalInteger(outputLimit, 30))),
	);
	return {
		run,
		stats,
		outputs,
	};
}

async function upsertStyleProfile(profile) {
	const normalized = normalizeObject(profile);
	if (!normalizeString(normalized.zone_id)) {
		const error = new Error("zone_id is required for style profile updates.");
		error.status = 400;
		error.code = "MISSING_ZONE_ID";
		throw error;
	}
	return store.upsertStyleProfile({
		zone_id: normalizeString(normalized.zone_id),
		visual_style_prompt: normalizeString(normalized.visual_style_prompt, DEFAULT_STYLE_PROMPT),
		negative_prompt: normalizeString(normalized.negative_prompt, DEFAULT_NEGATIVE_PROMPT),
		palette: Array.isArray(normalized.palette) ? normalized.palette : [],
		lighting: normalizeString(normalized.lighting),
		composition_rules: Array.isArray(normalized.composition_rules)
			? normalized.composition_rules
			: [],
		reference_assets: Array.isArray(normalized.reference_assets)
			? normalized.reference_assets
			: [],
	});
}

module.exports = {
	startBulkGenerationRun,
	tickBulkGenerationRun,
	getRunStatus,
	pauseRun,
	resumeRun,
	handleBudgetAlert,
	upsertStyleProfile,
};
