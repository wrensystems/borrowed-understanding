// Structural assessment checks extracted from bu08_worker/src/ll10/ai.ts.
import {responseIds} from './study.mts';

export type AssessmentComponent = {score: 0 | 1 | 2; excerpt: string; rationale: string; uncertainty: string};
export type Assessment = {
  response_id: typeof responseIds[number];
  components: Record<'M' | 'I' | 'W', AssessmentComponent>;
  notes: string;
};

const object = <T extends Record<string, unknown>>(properties: T) => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false,
});
const string = {type: 'string'};
const excerpt = {type: 'string', minLength: 1};
const component = object({score: {type: 'integer', minimum: 0, maximum: 2}, excerpt, rationale: string, uncertainty: string});
const response_id = {type: 'string', enum: responseIds};

// The deployed Deep Echo assessment path requests nonempty excerpts.
export const assessmentSchema = object({response_id, components: object({M: component, I: component, W: component}), notes: string});

export class AssessmentValidationError extends Error {
  readonly field: string;
  readonly condition: string;

  constructor(field: string, condition: string) {
    super('invalid_ai_output');
    this.field = field;
    this.condition = condition;
  }
}

export function validateAssessment(value: unknown, response: {id: string; text: string}): Assessment {
  function reject(field: string, condition: string): never {
    throw new AssessmentValidationError(field, condition);
  }

  function shape(value: unknown, keys: string[], field: string) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) {
      reject(field, 'unexpected_fields');
    }
  }

  function text(value: unknown, field: string) {
    if (typeof value !== 'string' || [...value].length > 4000) reject(field, 'not_bounded_text');
  }

  shape(value, ['response_id', 'components', 'notes'], '$');
  const assessment = value as Assessment;
  if (!responseIds.some(id => id === response.id)) reject('response_id', 'unsupported_response');
  if (assessment.response_id !== response.id) reject('response_id', 'does_not_match_current_answer');
  shape(assessment.components, ['M', 'I', 'W'], 'components');
  text(assessment.notes, 'notes');

  for (const [dimension, component] of Object.entries(assessment.components)) {
    const field = 'components.' + dimension;
    shape(component, ['score', 'excerpt', 'rationale', 'uncertainty'], field);
    const {score, excerpt, rationale, uncertainty} = component;
    if (!Number.isInteger(score) || score < 0 || score > 2) reject(field + '.score', 'out_of_range');
    text(excerpt, field + '.excerpt');
    text(rationale, field + '.rationale');
    text(uncertainty, field + '.uncertainty');
    if (!rationale.trim()) reject(field + '.rationale', 'blank');
    if (!excerpt) reject(field + '.excerpt', 'empty');
    if (excerpt === 'not demonstrated') {
      if (score !== 0) reject(field + '.excerpt', 'zero_marker_with_nonzero_score');
    } else if (!response.text.includes(excerpt)) {
      reject(field + '.excerpt', 'not_exact_contiguous_substring');
    }
  }
  return assessment;
}
