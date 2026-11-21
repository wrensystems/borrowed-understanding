import assert from 'node:assert/strict';
import test from 'node:test';
import { assessmentSchema, AssessmentValidationError, validateAssessment } from '../src/assessment.mts';
import { canonical, hash } from '../src/integrity.mts';
import { materialsForHash } from '../src/instrument.mts';
import { caseOrderForOrdinal, participantView, prepare, transition } from '../src/study.mts';

const syntheticAnswer = 'Synthetic: the paper kite moved.';
const v3 = 'd4debdd90290b32bbb67a8e7cf72cc3e2f721378c510eacd3353af044e5a2480';

function submit(state, data) {
  return transition(state, 'submit', data, state.revision, state.updated_at + 1);
}

test('accepted enrollment ordinals follow A/B parity', () => {
  assert.deepEqual([1, 2, 3, 4].map(caseOrderForOrdinal), ['A→B', 'B→A', 'A→B', 'B→A']);
  for (const invalid of [0, -1, 2.5, '1', Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => caseOrderForOrdinal(invalid), /consent_order_mismatch/);
  }
});

for (const [ordinal, first, second] of [[1, 'A', 'B'], [2, 'B', 'A']]) {
  test('v3 binds ratings to the answer and releases materials in ' + first + '→' + second + ' order', () => {
    let state = prepare(ordinal);
    assert.equal(state.instrument_hash, v3);
    assert.equal(participantView(state).guide, undefined);
    assert.equal(participantView(state).presentation, undefined);
    state = submit(state, {value: 1});
    assert.equal(participantView(state).presentation.id, first);
    assert.throws(() => submit(state, {text: syntheticAnswer}), /invalid_request/);
    assert.throws(() => submit(state, {text: syntheticAnswer, answer_confidence: null}), /invalid_request/);
    state = submit(state, {text: syntheticAnswer, answer_confidence: 5});
    assert.equal(state.guide_exposure.shown_at, state.responses[0].submitted_at);
    assert.match(participantView(state).guide[0], /synthetic/i);
    assert.equal(participantView(state).presentation, undefined);
    state = submit(state, {});
    assert.equal(participantView(state).guide, undefined);
    assert.equal(participantView(state).presentation, undefined);
    state = submit(state, {value: 3});
    assert.equal(participantView(state).presentation.id, second);
    state = submit(state, {text: syntheticAnswer, answer_confidence: 2});
    assert.equal(participantView(state).presentation.id, 'museum');
    assert.equal(participantView(state).answer_confidence, undefined);
    assert.throws(() => submit(state, {text: syntheticAnswer, answer_confidence: 2}), /invalid_request/);
    state = submit(state, {text: syntheticAnswer});
    state = submit(state, {reflection: ''});
    assert.equal(state.status, 'complete');
    assert.deepEqual(state.confidence.map(({id, value, response_id, case_id}) => [id, value, response_id, case_id]), [
      ['C0', 1, undefined, undefined], ['AC1', 5, 'q1', first],
      ['C1', 3, undefined, undefined], ['AC2', 2, 'q2', second],
    ]);
    for (const [rating, response] of [[state.confidence[1], state.responses[0]], [state.confidence[3], state.responses[1]]]) {
      assert.equal(rating.submitted_at, response.submitted_at);
      assert.equal(rating.position, response.position);
    }
    assert.equal(state.responses[2].case_id, 'museum');
    assert.throws(() => submit(state, {reflection: ''}), /invalid_request/);
  });
}

test('version selection keeps the original two-rating path and enables AC in v2', () => {
  for (const [version, answerConfidence] of [['original', false], ['v2', true]]) {
    let state = prepare(1, version);
    assert.equal(materialsForHash(state.instrument_hash).public_revision, version);
    state = submit(state, {value: 3});
    assert.equal(Boolean(participantView(state).answer_confidence), answerConfidence);
    const response = answerConfidence ? {text: syntheticAnswer, answer_confidence: 2} : {text: syntheticAnswer};
    state = submit(state, response);
    state = submit(state, {});
    state = submit(state, {value: 4});
    state = submit(state, response);
    state = submit(state, {text: syntheticAnswer});
    state = submit(state, {reflection: ''});
    assert.deepEqual(state.confidence.map(record => record.id), answerConfidence ? ['C0','AC1','C1','AC2'] : ['C0','C1']);
  }
  assert.equal(materialsForHash('unknown'), undefined);
  assert.throws(() => prepare(1, 'unknown'), /invalid_request/);
});

test('invalid ratings, stale revisions and unknown materials do not advance the input state', () => {
  const state = prepare(1);
  for (const value of [0, 6, 1.5, '3', null, NaN]) {
    assert.throws(() => submit(state, {value}), /invalid_request/);
  }
  assert.throws(() => transition(state, 'submit', {value: 2}, 1, 1), /invalid_request/);
  for (const invalidTime of [-1, 0.5, '1', Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => transition(state, 'submit', {value: 2}, 0, invalidTime), /invalid_request/);
  }
  assert.throws(() => submit({...state, instrument_hash: 'unknown'}, {value: 2}), /invalid_request/);
  assert.deepEqual(state.confidence, []);
  assert.equal(state.screen, 2);
});

test('drafts can omit a rating and pauses block submission until resumed', () => {
  const state = submit(prepare(1), {value: 1});
  const drafted = transition(state, 'draft', {text: syntheticAnswer, answer_confidence: null}, state.revision, 2);
  assert.deepEqual(drafted.responses, []);
  assert.equal(participantView(drafted).draft.text, syntheticAnswer);
  const paused = transition(drafted, 'pause', {}, drafted.revision, 3);
  assert.equal(participantView(paused).presentation, undefined);
  assert.throws(() => submit(paused, {text: syntheticAnswer, answer_confidence: 3}), /invalid_request/);
  const resumed = transition(paused, 'resume', {}, paused.revision, 10);
  assert.equal(participantView(resumed).presentation.id, 'A');
  const stopped = transition(resumed, 'stop', {}, resumed.revision, 11);
  assert.equal(stopped.status, 'stopped');
  assert.equal(stopped.stage_history.at(-1).screen_seconds, 3);
  assert.deepEqual(stopped.responses, []);
});

const component = {score: 1, excerpt: 'paper kite', rationale: 'Synthetic format check.', uncertainty: ''};
const record = {
  response_id: 'q1',
  components: {
    M: component,
    I: {...component, score: 0, excerpt: 'not demonstrated'},
    W: {...component, score: 2},
  },
  notes: 'Synthetic format check.',
};
const response = {id: 'q1', text: syntheticAnswer};

test('assessment structure matches the three BU-E1.0 responses and M/I/W components', () => {
  assert.deepEqual(assessmentSchema.properties.response_id.enum, ['q1', 'q2', 'q3']);
  assert.deepEqual(assessmentSchema.properties.components.required, ['M', 'I', 'W']);
  assert.deepEqual(validateAssessment(record, response), record);
  assert.throws(
    () => validateAssessment({...record, response_id: 'q4'}, {...response, id: 'q4'}),
    error => error instanceof AssessmentValidationError && error.field === 'response_id' && error.condition === 'unsupported_response',
  );
});

test('assessment validator rejects wrong linkage, scores and fabricated evidence', () => {
  for (const [alteration, field, condition] of [
    [{response_id:'q2'}, 'response_id', 'does_not_match_current_answer'],
    [{components: {M: component}}, 'components', 'unexpected_fields'],
    [{components: {...record.components, M: {...component, score: 3}}}, 'components.M.score', 'out_of_range'],
    [{components: {...record.components, M: {...component, excerpt: 'metal kite'}}}, 'components.M.excerpt', 'not_exact_contiguous_substring'],
    [{components: {...record.components, M: {...component, excerpt: ''}}}, 'components.M.excerpt', 'empty'],
    [{components: {...record.components, M: {...component, excerpt: 'not demonstrated'}}}, 'components.M.excerpt', 'zero_marker_with_nonzero_score'],
  ]) {
    assert.throws(
      () => validateAssessment({...record, ...alteration}, response),
      error => error instanceof AssessmentValidationError && error.field === field && error.condition === condition,
    );
  }
});

test('canonical JSON sorts nested keys and SHA-256 is stable and sensitive to value changes', async () => {
  const value = {z: [{b: 2, a: 1}, null], a: 'é'};
  assert.equal(canonical(value), '{"a":"é","z":[{"a":1,"b":2},null]}');
  assert.equal(await hash('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await hash(canonical(value)), await hash(canonical({a: 'é', z: [{a: 1, b: 2}, null]})));
  assert.notEqual(await hash(canonical(value)), await hash(canonical({...value, a: 'e'})));
});

test('synthetic driver completes both orders and emits a stable replay digest', async () => {
  const { replay } = await import('../examples/synthetic.mjs');
  const first = await replay();
  assert.deepEqual(first, await replay());
  assert.equal(first.evidence_kind, 'synthetic');
  assert.deepEqual(first.sessions.map(({order, status, cases, confidence, format_checks}) => [order, status, cases, confidence, format_checks]), [
    ['A→B', 'complete', ['A','B','museum'], ['C0','AC1','C1','AC2'], 3],
    ['B→A', 'complete', ['B','A','museum'], ['C0','AC1','C1','AC2'], 3],
  ]);
  assert.match(first.replay_sha256, /^[a-f0-9]{64}$/);
});
