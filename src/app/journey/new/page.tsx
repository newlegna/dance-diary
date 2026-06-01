"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DANCE_STYLES,
  JOURNEY_TEMPLATES,
} from "@/lib/constants";
import { createId, saveJourney } from "@/lib/storage";
import type { Journey, JourneyDuration } from "@/lib/types";

const defaultTemplate = JOURNEY_TEMPLATES[0];

export default function NewJourneyPage() {
  const router = useRouter();
  const [name, setName] = useState(defaultTemplate.name);
  const [description, setDescription] = useState(defaultTemplate.description);
  const [goal, setGoal] = useState(defaultTemplate.goal);
  const [duration, setDuration] = useState<JourneyDuration>(
    defaultTemplate.duration,
  );
  const [danceStyle, setDanceStyle] = useState(defaultTemplate.danceStyle);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const applyTemplate = (index: number) => {
    const template = JOURNEY_TEMPLATES[index];
    setName(template.name);
    setDescription(template.description);
    setGoal(template.goal);
    setDuration(template.duration);
    setDanceStyle(template.danceStyle);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const journey: Journey = {
      id: createId(),
      name,
      description,
      goal,
      duration,
      danceStyle,
      isPublic,
      createdAt: new Date().toISOString(),
    };

    await saveJourney(journey);
    router.push(`/journey/${journey.id}/record`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/" className="text-sm text-[var(--text-muted)]">
          ← Back home
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">
          Create a dance journey
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Pick a challenge length, set your groove goal, and record Day 1.
        </p>
      </div>

      <section className="grid gap-3">
        <p className="text-sm font-medium">Quick templates</p>
        {JOURNEY_TEMPLATES.map((template, index) => (
          <button
            key={template.name}
            type="button"
            onClick={() => applyTemplate(index)}
            className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left transition hover:border-[var(--accent)]"
          >
            <p className="font-medium">{template.name}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {template.description}
            </p>
          </button>
        ))}
      </section>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Journey name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Goal</span>
          <input
            required
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium">Duration</p>
          <div className="flex gap-2">
            {[7, 14, 30].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDuration(value as JourneyDuration)}
                className={`rounded-full px-4 py-2 text-sm ${
                  duration === value
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "border border-[var(--border)]"
                }`}
              >
                {value} days
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">Dance style</span>
          <select
            value={danceStyle}
            onChange={(event) =>
              setDanceStyle(event.target.value as Journey["danceStyle"])
            }
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
          >
            {DANCE_STYLES.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          <span className="text-sm">
            Make this journey public when I share progress videos
          </span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create journey and record Day 1"}
        </button>
      </form>
    </div>
  );
}
