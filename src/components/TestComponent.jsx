import React, { useEffect } from "react";

export default function TestComponent() {
  useEffect(() => {
    console.log("TestComponent mounted");
    alert("TestComponent is working!");
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        background: "red",
        color: "white",
        padding: "10px",
        zIndex: 9999,
      }}
    >
      TEST COMPONENT - CLICK ME
      <button
        onClick={() => alert("Button clicked!")}
        style={{ marginLeft: "10px" }}
      >
        CLICK
      </button>
    </div>
  );
}
