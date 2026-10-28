import React from "react";
import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import ProgressBar from "../../src/components/ui/ProgressBar.jsx";

function renderBar(current, max) {
  return renderToStaticMarkup(React.createElement(ProgressBar, {
    current, max, label: "HP", tooltip: "Health",
  }));
}

describe("ProgressBar", () => {
  it("renders the current reserves and fill percentage", () => {
    const markup = renderBar(25, 100);
    expect(markup).toContain("25/100");
    expect(markup).toContain("--progress:25%");
    expect(markup).toContain('title="Health"');
  });

  it.each([[-10, 100, 0], [150, 100, 100], [10, 0, 0]])(
    "bounds the fill for %s/%s at %s percent",
    (current, max, percentage) => {
      expect(renderBar(current, max)).toContain(`--progress:${percentage}%`);
    },
  );
});
