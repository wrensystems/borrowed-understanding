import { pathToFileURL } from 'node:url';
import { validateAssessment } from '../src/assessment.mts';
import { canonical, hash } from '../src/integrity.mts';
import { prepare, transition } from '../src/study.mts';

// Invented text, ratings and assessment records exercise the format only.
const events = [
  {value: 2},
  {text: 'Synthetic first answer: a paper kite moved.', answer_confidence: 4},
  {},
  {value: 3},
  {text: 'Synthetic second answer: a toy cart rolled.', answer_confidence: 2},
  {text: 'Synthetic transfer answer: a cardboard vane turned.'},
  {reflection: ''},
];

function syntheticAssessment(response) {
  const absent = {score: 0, excerpt: 'not demonstrated', rationale: 'Synthetic format check.', uncertainty: ''};
  return {
    response_id: response.id,
    components: {
      M: {...absent, score: 1, excerpt: response.text},
      I: absent,
      W: absent,
    },
    notes: 'Synthetic format check.',
  };
}

export async function replay() {
  const traces = [1, 2].map(ordinal => {
    const state = events.reduce((current, data) =>
      transition(current, 'submit', data, current.revision, current.updated_at + 1), prepare(ordinal));
    const assessments = state.responses.map(response => validateAssessment(syntheticAssessment(response), response));
    return {state, assessments};
  });
  return {
    evidence_kind: 'synthetic',
    sessions: traces.map(({state, assessments}) => ({
      order: state.case_order,
      status: state.status,
      cases: state.responses.map(response => response.case_id),
      confidence: state.confidence.map(record => record.id),
      format_checks: assessments.length,
    })),
    replay_sha256: await hash(canonical(traces)),
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  console.log(JSON.stringify(await replay(), null, 2));
}
