// Extracted post-enrollment transitions and view from bu08_worker/src/bue1/study.ts.
import {materialsForHash, materialsForVersion, type PublicRevision} from './instrument.mts';

type Data = Record<string, any>;

export const responseIds = ['q1', 'q2', 'q3'] as const;
export type CaseId = 'A' | 'B' | 'museum';
type MatchedCase = Exclude<CaseId, 'museum'>;
type CaseOrder = 'A→B' | 'B→A';
type ConfidenceRating = {value: number; screen: number; submitted_at: number} & (
  {id: 'C0' | 'C1'} | {id: 'AC1' | 'AC2'; response_id: 'q1' | 'q2'; position: 1 | 2; case_id: MatchedCase}
);

const stages = ['consent', 'confidence_before', 'baseline', 'guide', 'confidence_after', 'application', 'museum', 'reflection'] as const;
const itemAt = {3: 1, 6: 2, 7: 3} as Partial<Record<number, number>>;

type State = {
  evidence_kind: 'synthetic';
  protocol_version: string;
  instrument_hash: string;
  case_order: CaseOrder;
  enrolled: true;
  screen: number;
  phase: typeof stages[number] | 'closed';
  status: 'active' | 'stopped' | 'complete';
  revision: number;
  started_at: number;
  updated_at: number;
  paused: boolean;
  paused_at: number | null;
  pauses: {screen: number; seconds: number}[];
  stage_history: {screen: number; stage: typeof stages[number]; screen_seconds: number; completed_at: number}[];
  draft: Data;
  confidence: ConfidenceRating[];
  responses: {
    id: typeof responseIds[number]; position: number; case_id: CaseId; text: string;
    status: 'submitted'; submitted_at: number; question_version: string; rubric_version: string;
  }[];
  guide_exposure: {kind: 'fixed_ai_written'; guide_kind: 'synthetic_placeholder'; shown_at: number; view_seconds?: number; completed_at?: number} | null;
  reflection: {text: string; optional: true; submitted_at: number} | null;
  completed_at: number | null;
  screen_seconds: number | null;
};

// The production store supplies an accepted-enrollment ordinal. The offline caller supplies it here.
export function caseOrderForOrdinal(order: number): CaseOrder {
  if (!(typeof order === 'number' && Number.isSafeInteger(order) && order > 0)) {
    throw new Error('consent_order_mismatch');
  }
  return order % 2 === 1 ? 'A→B' : 'B→A';
}

export function prepare(ordinal: number, version: PublicRevision = 'v3', at = 0): State {
  const selected = materialsForVersion(version);
  requireValid(selected && Number.isSafeInteger(at) && at >= 0);
  return {
    evidence_kind: 'synthetic', protocol_version: selected.protocol_version, instrument_hash: selected.instrument_hash,
    case_order: caseOrderForOrdinal(ordinal), enrolled: true,
    screen: 2, phase: 'confidence_before', status: 'active', revision: 0,
    started_at: at, updated_at: at, paused: false, paused_at: null,
    pauses: [], stage_history: [], draft: {}, confidence: [], responses: [],
    guide_exposure: null, reflection: null, completed_at: null, screen_seconds: null,
  };
}

function requireValid(ok: unknown): asserts ok {
  if (!ok) throw new Error('invalid_request');
}
function fields(data: Data, names: string[]) {
  requireValid(data && typeof data === 'object' && !Array.isArray(data)
    && Object.keys(data).length === names.length && names.every(name => Object.hasOwn(data, name)));
}
function written(value: unknown, required = false): asserts value is string {
  requireValid(typeof value === 'string' && [...value].length <= 1200 && (!required || !!value.trim()));
}
function confidence(value: unknown): asserts value is number {
  requireValid(typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5);
}
function caseAt(state: State, position: number): CaseId {
  requireValid(state.case_order === 'A→B' || state.case_order === 'B→A');
  return position === 3 ? 'museum' : state.case_order.split('→')[position - 1] as MatchedCase;
}

export function transition(original: State, action: string, data: Data, revision: number, at: number): State {
  const selected = materialsForHash(original.instrument_hash);
  requireValid(selected && revision === original.revision && Number.isInteger(revision) && Number.isSafeInteger(at) && at >= original.updated_at
    && original.phase !== 'closed');
  const state = structuredClone(original);
  const screen = state.screen;
  const stage = stages[screen - 1];
  requireValid(stage);
  const position = itemAt[screen];
  const confidencePosition = 'answer_confidence' in selected.instrument && (position === 1 || position === 2) ? position : null;

  function elapsed() { return Math.max(0, (state.paused ? state.paused_at! : at) - state.started_at); }
  function advance(closed = false) {
    state.stage_history.push({screen, stage, screen_seconds: elapsed(), completed_at: at});
    state.screen = closed ? screen : screen + 1;
    state.phase = closed ? 'closed' : stages[screen];
    state.started_at = at;
    state.draft = {};
  }

  if (action === 'reconcile') {
    // An empty revision barrier advances the expected revision without saving a draft.
    fields(data, []);
  } else if (action === 'stop') {
    fields(data, []);
    state.status = 'stopped';
    if (screen === 4 && state.guide_exposure) state.guide_exposure.view_seconds = elapsed();
    advance(true);
    state.paused = false;
    state.paused_at = null;
  } else if (action === 'pause' && state.enrolled && !state.paused) {
    fields(data, []);
    state.paused = true;
    state.paused_at = at;
  } else if (action === 'resume' && state.paused) {
    fields(data, []);
    const seconds = at - state.paused_at!;
    state.pauses.push({screen, seconds});
    state.started_at += seconds;
    state.paused = false;
    state.paused_at = null;
  } else {
    requireValid(!state.paused);
    if (action === 'draft') {
      requireValid(state.enrolled);
      if (position) {
        fields(data, confidencePosition ? ['text', 'answer_confidence'] : ['text']);
        written(data.text);
        if (confidencePosition && data.answer_confidence !== null) confidence(data.answer_confidence);
        state.draft = {text: data.text, ...(confidencePosition ? {answer_confidence: data.answer_confidence} : {})};
      } else if (screen === 8) {
        fields(data, ['reflection']);
        written(data.reflection);
        state.draft = {reflection: data.reflection};
      } else {
        requireValid(screen === 2 || screen === 5);
        fields(data, ['value']);
        confidence(data.value);
        state.draft = {value: data.value};
      }
    } else {
      requireValid(action === 'submit');
      if (screen === 2 || screen === 5) {
        fields(data, ['value']);
        confidence(data.value);
        state.confidence.push({id: screen === 2 ? 'C0' : 'C1', value: data.value, screen, submitted_at: at});
        advance();
      } else if (position) {
        fields(data, confidencePosition ? ['text', 'answer_confidence'] : ['text']);
        written(data.text, true);
        const caseId = caseAt(state, position);
        if (confidencePosition) {
          confidence(data.answer_confidence);
          requireValid(caseId !== 'museum');
          state.confidence.push({
            id: confidencePosition === 1 ? 'AC1' : 'AC2', response_id: responseIds[confidencePosition - 1] as 'q1' | 'q2',
            position: confidencePosition, case_id: caseId, screen, value: data.answer_confidence, submitted_at: at,
          });
        }
        state.responses.push({
          id: responseIds[position - 1], position, case_id: caseId, text: data.text,
          status: 'submitted', submitted_at: at, question_version: selected.protocol_version, rubric_version: selected.rubric_version,
        });
        if (screen === 3) state.guide_exposure = {kind: 'fixed_ai_written', guide_kind: 'synthetic_placeholder', shown_at: at};
        advance();
      } else if (screen === 4) {
        fields(data, []);
        requireValid(state.guide_exposure);
        Object.assign(state.guide_exposure, {view_seconds: elapsed(), completed_at: at});
        advance();
      } else {
        requireValid(screen === 8 && state.responses.length === responseIds.length && state.confidence.length === ('answer_confidence' in selected.instrument ? 4 : 2));
        fields(data, ['reflection']);
        written(data.reflection);
        state.reflection = {text: data.reflection, optional: true, submitted_at: at};
        state.status = 'complete';
        state.completed_at = at;
        advance(true);
        state.screen_seconds = state.stage_history.reduce((sum, entry) => sum + entry.screen_seconds, 0);
      }
    }
  }
  state.revision++;
  state.updated_at = at;
  return state;
}

export function participantView(state: State): Data {
  const selected = materialsForHash(state.instrument_hash);
  requireValid(selected);
  const {instrument} = selected;
  const {screen, status, enrolled, paused} = state;
  const view: Data = {
    protocol_version: selected.protocol_version, world: 'E1', world_title: instrument.title,
    evidence_kind: state.evidence_kind, screen, total_screens: stages.length, status, paused, enrolled,
  };
  if (paused || status === 'stopped') return view;
  if (status === 'complete') return view;
  view.draft = state.draft;
  if (screen === 2) view.instructions = instrument.instructions;
  if (screen === 2 || screen === 5) view.confidence = instrument.confidence;
  const position = itemAt[screen];
  if (position) view.presentation = instrument.cases[caseAt(state, position)];
  if ('answer_confidence' in selected.instrument && (position === 1 || position === 2)) {
    const {question, choices} = selected.instrument.answer_confidence;
    view.answer_confidence = {question, choices};
  }
  if (screen === 4) view.guide = instrument.guide;
  if (screen === 8) view.reflection_question = instrument.reflection;
  return structuredClone(view);
}
