import { describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";

describe("firebase deploy workflow config", () => {
  it("defines staging and production Firebase aliases", () => {
    const firebasercPath = path.resolve(process.cwd(), ".firebaserc");
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, "utf8"));

    expect(firebaserc.projects.production).toBe("my-litrpg-gameztrui-3416-da75c");
    expect(firebaserc.projects.staging).toBe("my-litrpg-gameztrui-staging");
  });

  it("ships a staging to production deploy workflow", () => {
    const workflowPath = path.resolve(
      process.cwd(),
      ".github/workflows/firebase-deploy.yml",
    );
    const workflow = fs.readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("firebase-tools deploy --project staging");
    expect(workflow).toContain("firebase-tools deploy --project production");
    expect(workflow).toContain("workflow_dispatch");
  });
});