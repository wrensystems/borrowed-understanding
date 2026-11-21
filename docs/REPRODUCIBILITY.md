# Research implementation and reproduction

[Borrowed Understanding](../README.md) · Public code release · November 21, 2026

This source release follows the November 20, 2026 Oxford submission. It exposes the BU-E1.0 workflow and validation logic for inspection and offline replay. See the [methodology](METHODOLOGY.md) for the experimental design and interpretation of the measures.

## Run offline

Use **Node.js 22.18 or newer**. The source uses TypeScript annotations that Node strips directly. From the repository root, run both commands without installing packages.

```sh
node --test test/offline.test.mjs
node examples/synthetic.mjs
```

The tests check both orders, original and revised confidence schedules, input and revision validation, drafts and pauses, assessment linkage and excerpts, and canonical JSON hashing. The example completes two invented sessions, one in each order, and checks the format of six invented assessments. Repeating the example produces the same `replay_sha256`, computed over the synthetic states and assessment records. The marker `evidence_kind: "synthetic"` identifies this output.

## Architecture and source provenance

The authoritative source is the Research Laboratory branch `codex/ll10-implementation` at commit `dc5a188b673ffb4fa4c7169c10a0858a28714232`. Before extraction, its build fingerprint was recomputed from the committed source files and matched against the live study's publicly reported fingerprint. The live protocol and instrument hashes also matched revision v3. This check ties the extraction to a deployed source revision. The public package has its own execution boundary.

| Public component | Relationship to the study source |
| --- | --- |
| [Instrument](../src/instrument.mts) | Projects metadata from `bu08_worker/src/bue1/instrument.ts` and `materials.json`. Preserves original, v2 and v3 fingerprint dispatch, the five confidence choices, and the v2/v3 answer-confidence requirement. Study content is replaced by placeholders. |
| [Sequence](../src/study.mts) | Extracts the post-enrollment state transitions and participant view from `bu08_worker/src/bue1/study.ts`. The supplied ordinal uses the order rule from `bu08_worker/src/store.ts` (odd A→B, even B→A). Original screens 2–8 retain their numbers. |
| [Assessment](../src/assessment.mts) | Extracts the M/I/W schema and structural validator from `bu08_worker/src/ll10/ai.ts`, shared by BU-E1.0. The three response IDs and nonempty excerpt constraint follow the deployed assessment path. The validator checks score bounds, response linkage and exact excerpt membership. |
| [Integrity](../src/integrity.mts) | Uses the canonical JSON and SHA-256 operations from `bu08_worker/src/store.ts` on JSON-compatible synthetic data. |
| [Replay](../examples/synthetic.mjs) and [tests](../test/offline.test.mjs) | Public-only fixtures exercise the extracted paths. Test coverage is informed by the original BU-E1.0 confidence and causal-guide tests. |

The offline adapter starts after simulated enrollment and uses caller-supplied ordinals and timestamps. It substitutes a guide placeholder, keeps state in memory and drops persistence, raw event capture, live enrollment, retention processing, and the post-submission profile view. The public adapter checks that timestamps are safe integers and that supplied assessments refer to one of the three BU-E1.0 response IDs. It preserves the pairing of AC1/AC2 with the corresponding case, response ID and submission time. The guide appears on its own screen, and the museum response has no answer-confidence rating.

The production instrument and protocol hashes identify the original revisions. The placeholders are shared across public revisions and cannot regenerate production fingerprints. The replay digest instead identifies the deterministic public example.

## Restricted materials and inference

Case texts, the fixed instructional guide, complete rubrics, answer keys, evaluator prompts, consent records, participant-level records, and production infrastructure remain restricted. The public validator checks the form and linkage of a supplied assessment. Scoring written responses still requires case-specific judgment. Automated assessments remain preliminary, with independent human review governed separately.

This repository supports rerunning software behavior with synthetic records. Exact stimulus replication, verifying published results against participant responses, and reproducing empirical analyses would require a separately reviewed release. See [limitations and future work](LIMITATIONS_AND_FUTURE_WORK.md).
