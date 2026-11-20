# Methodology

[Borrowed Understanding](../README.md) · BU-E1.0, *The Other Explanation*

## Research motivation

An AI-written explanation can make a mechanism easier to follow. The learner must still decide, in a fresh situation, which causal claims the evidence supports and how far those claims extend. The study treats confidence as a first-person report and warranted reasoning as something a written answer can demonstrate in a specific task. Agreement with the guide is unnecessary for a well-supported answer.

A theoretical antecedent is the illusion of explanatory depth, the gap between how well people think they can explain a mechanism and what they can produce when asked to explain it. That literature motivates measuring confidence and explanation separately here. [Rozenblit and Keil (2002), *The misunderstood limits of folk science: An illusion of explanatory depth*](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/)

## Participant sequence

1. **Onboarding and baseline confidence.** After study information, consent and a short background questionnaire, participants record C0.
2. **First matched case.** Participants write an explanation for either the library or the concert case, then rate confidence in that explanation (AC1).
3. **Fixed guide.** Everyone in the same instrument revision reads the same AI-written instructional text. It is prepared in advance and gives no individualized tutoring or feedback. Participants record C1 after the guide and before seeing the next case.
4. **Second matched case.** Participants write an explanation for the remaining case with the guide out of view, then rate confidence in the explanation (AC2).
5. **Independent evidence challenge.** The museum case uses a new situation to probe whether participants can reason about competing explanations and the limits of the available evidence. It has a written response and no dedicated confidence rating. An optional reflection follows before final submission.

The single-arm design alternates library-first and concert-first at enrollment. This distributes the two scenarios across pre-guide and post-guide positions. The pair was designed to elicit comparable reasoning operations. Empirical equivalence of case difficulty remains to be assessed. The museum task addresses transfer to a different problem and is interpreted on its own.

## Confidence

C0 and C1 ask for confidence in reasoning through an unfamiliar cause-and-effect claim without help. C0 precedes the first case. C1 follows both the first case and the guide, so other experiences in that interval can contribute to the difference.

AC1 and AC2 ask for confidence in the explanation just written. Each rating belongs to its answer and case position. A person can be confident about a particular explanation while feeling less confident about reasoning through an unfamiliar claim in general.

The four ratings use five ordered response categories in the current instrument revision. General and answer-specific confidence answer different questions and are interpreted separately. Earlier instrument revisions lacked AC1 and AC2. Those observations are unavailable by design, so comparisons must account for the revision.

## Written reasoning assessment

The matched cases share a rubric structure, while the museum has a case-specific rubric. Each dimension uses three ordered levels (0–2) to record evidence absent or unsupported in the submitted answer, partially demonstrated reasoning, or clearly demonstrated reasoning.

| Dimension | Assessment question |
| --- | --- |
| **M · Model fidelity** | Does the answer accurately represent the facts and causal relationships available in the case? |
| **I · Intervention reasoning** | Does it work through a relevant change or test and explain how that could distinguish competing accounts? |
| **W · Warrant and scope** | Does the conclusion follow from the evidence, with appropriate limits where the evidence leaves alternatives open? |

Interpret each score within the written answer and case that produced it. Record missing, withdrawn or technically unavailable material separately from a scored response. Keep the dimensions distinct when comparing confidence with written performance.

Post-submission automated assessments are preliminary. The implementation stores independent human assessments separately and records AI-assisted reviews as such. It also supports preparing review packets that withhold participant linkage, case order, timepoint and existing AI assessments from the reviewer. The investigator dashboard can expose order and timepoint, so a dashboard-based human review may be unblinded. Review conditions and any assessor disagreement belong in a later analysis report.

## Optional Deep Echo

After the research responses are submitted, participants may be offered Deep Echo, a private, experimental reflection based on their written answers. It offers a fictional type and an optional longer interpretation. It is intended for reflection on this visit and has no role in outcome scoring. Its interpretation can be incomplete or wrong. It provides no diagnosis or validated measure of personality, intelligence or general ability. Completion depends on saving the study submission and is independent of opening Deep Echo.

## Data availability and reproducibility

This repository describes the design, sequence and measurement logic. Participant-level data, quotations, scoring keys, evaluator instructions and the full live application are restricted. The public documentation supports design-level review. Independent replication of exact items or rescoring of original responses would require a separately reviewed release.
