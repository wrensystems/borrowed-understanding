// Public projection of bu08_worker/src/bue1/instrument.ts and materials.json.
const confidence = {
  "question": "How confident are you that you could reason through an unfamiliar cause-and-effect claim **without help**?",
  "choices": [
    "Not at all confident",
    "Slightly confident",
    "Moderately confident",
    "Very confident",
    "Extremely confident"
  ]
};
const cases = {
  A: {id: 'A', title: 'Synthetic matched case A'},
  B: {id: 'B', title: 'Synthetic matched case B'},
  museum: {id: 'museum', title: 'Synthetic transfer case'},
};
const fixture = {
  title: 'The Other Explanation (synthetic materials)',
  instructions: 'Synthetic rehearsal of the participant sequence.',
  cases,
  confidence,
  guide: ['Synthetic placeholder for the fixed guide stage.'],
  reflection: 'Synthetic optional reflection.',
};
const answer_confidence = {
  question: "How confident are you in the explanation you just gave?",
  choices: confidence.choices,
  positions: [1, 2] as const,
};

export type PublicRevision = 'original' | 'v2' | 'v3';

const versions = {
  original: {
    public_revision: 'original' as const,
    protocol_version: 'BU-E1.0',
    rubric_version: 'BU-E1.0-rubric-v1',
    instrument_hash: '9a577f9d94bc9aa08d4686a47e681aecefd854365b093a2422beb7cb5fa65407',
    protocol_hash: '23d74093c7d9b3c9e28a38b3ed27f902cfdc07901c2c55a20d85b78a6d55b2ef',
    instrument: fixture,
  },
  v2: {
    public_revision: 'v2' as const,
    protocol_version: 'BU-E1.0',
    protocol_revision: 'BU-E1.0-protocol-v2',
    instrument_version: 'BU-E1.0-instrument-v2',
    instrument_hash: '4b09e435078a1048348780781d9796bec24859747d374d63067f8d34d07db937',
    protocol_hash: 'eef8078eac8041768d4a0204e736719440d831c599828c3fdb8711c309a98454',
    predecessor_protocol_hash: '23d74093c7d9b3c9e28a38b3ed27f902cfdc07901c2c55a20d85b78a6d55b2ef',
    rubric_version: 'BU-E1.0-rubric-v1',
    instrument: {...fixture, answer_confidence},
  },
  v3: {
    public_revision: 'v3' as const,
    protocol_version: 'BU-E1.0',
    protocol_revision: 'BU-E1.0-protocol-v3',
    instrument_version: 'BU-E1.0-instrument-v3',
    instrument_hash: 'd4debdd90290b32bbb67a8e7cf72cc3e2f721378c510eacd3353af044e5a2480',
    protocol_hash: 'fb4ae76999e9fad9027155de4d893c73dc5a670bcc1b3f6b897c4d97fdeb0c7d',
    predecessor_protocol_hash: 'eef8078eac8041768d4a0204e736719440d831c599828c3fdb8711c309a98454',
    rubric_version: 'BU-E1.0-rubric-v1',
    instrument: {...fixture, answer_confidence},
  },
};

export function materialsForVersion(version: PublicRevision) {
  return Object.hasOwn(versions, version) ? structuredClone(versions[version]) : undefined;
}

export function materialsForHash(hash: string) {
  if (hash === versions.v3.instrument_hash) return materialsForVersion('v3');
  if (hash === versions.original.instrument_hash) return materialsForVersion('original');
  if (hash === versions.v2.instrument_hash) return materialsForVersion('v2');
  return undefined;
}
