"use client";

import { useState } from "react";
import { MOCK_COMMUNITY_POSTS } from "@/lib/constants";
import { danceStyleLabel, formatRelativeDate } from "@/lib/format";

const commentPrompts = [
  "What improved?",
  "What should I work on next?",
  "Send encouragement",
];

export default function CommunityPage() {
  const [filter, setFilter] = useState<string>("all");
  const [likes, setLikes] = useState<Record<string, number>>(() =>
    Object.fromEntries(MOCK_COMMUNITY_POSTS.map((post) => [post.id, post.likes])),
  );

  const posts =
    filter === "all"
      ? MOCK_COMMUNITY_POSTS
      : MOCK_COMMUNITY_POSTS.filter((post) => post.danceStyle === filter);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
          Supportive community
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold">
          Progress stories from other dancers
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          MVP preview feed with encouragement-first comments. Share exported
          progress videos here in a future release.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All styles"],
          ["hip-hop", "Hip Hop"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === value
                ? "bg-[var(--accent)] text-[var(--on-accent)]"
                : "border border-[var(--border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{post.author}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {post.journeyName} · {danceStyleLabel(post.danceStyle)}
                </p>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {formatRelativeDate(post.createdAt)}
              </span>
            </div>

            <div className="mt-5 grid gap-4 rounded-3xl bg-[var(--bg-elevated)] p-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] p-6 text-center">
                <p className="text-sm text-[var(--text-muted)]">Day {post.dayFrom}</p>
                <p className="mt-2 font-display text-2xl font-bold">Before</p>
              </div>
              <div className="rounded-2xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] p-6 text-center">
                <p className="text-sm text-[var(--accent)]">Day {post.dayTo}</p>
                <p className="mt-2 font-display text-2xl font-bold">After</p>
              </div>
            </div>

            <p className="mt-5 text-base">{post.caption}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setLikes((current) => ({
                    ...current,
                    [post.id]: (current[post.id] ?? 0) + 1,
                  }))
                }
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
              >
                ♥ {likes[post.id]} likes
              </button>
              {commentPrompts.map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-full bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-muted)]"
                >
                  {prompt}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
