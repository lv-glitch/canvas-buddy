"use client";

import { useState } from "react";
import { DualInput } from "./DualInput";
import { EffectPicker } from "./EffectPicker";

/**
 * Wires the "Start with a photo or idea" cards to the "Pick a vibe" demo
 * below. A file picked or AI-generated up top becomes the source image
 * down here, and the page scrolls to it.
 */
export function DemoFlow() {
  const [source, setSource] = useState<File | null>(null);
  return (
    <>
      <DualInput onPickFile={setSource} />
      <EffectPicker externalFile={source} />
    </>
  );
}
