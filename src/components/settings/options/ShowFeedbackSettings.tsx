"use client";

import SettingsItem from "@/components/settings/SettingsItem";

import { useState } from "react";

interface ShowFeedbackSettingsProps {
  startingShowFeedback: boolean;
}

export default function ShowFeedbackSettings({
  startingShowFeedback,
}: ShowFeedbackSettingsProps) {
  const [showFeedback, setShowFeedback] =
    useState<boolean>(startingShowFeedback);

  const updateShowFeedback = async (value: string) => {
    setShowFeedback(value === "enabled");

    const response = await fetch("/api/settings/update-settings", {
      method: "POST",
      body: JSON.stringify({ showFeedback: value === "enabled" }),
    });

    if (!response.ok) {
      console.error("Failed to update show feedback setting");
    }
  };

  return (
    <SettingsItem
      title="Show feedback"
      description="You will receive feedback while playing. Recommended when starting out"
      type="select"
      options={[
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled" },
      ]}
      value={showFeedback ? "enabled" : "disabled"}
      onValueChange={(value) => updateShowFeedback(value)}
    />
  );
}
