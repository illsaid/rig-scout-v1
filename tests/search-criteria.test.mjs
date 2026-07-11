import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CRITERIA,
  criteriaFromSearchParams,
  criteriaToParams,
} from "../lib/search-criteria.ts";

test("rejects arbitrary select values from shared URLs", () => {
  const criteria = criteriaFromSearchParams({
    use: "Mining",
    cpu: "Invented CPU",
    gpu: "Invented GPU",
    board: "Invented Board",
  });

  assert.equal(criteria.useCase, DEFAULT_CRITERIA.useCase);
  assert.equal(criteria.cpu, DEFAULT_CRITERIA.cpu);
  assert.equal(criteria.gpu, DEFAULT_CRITERIA.gpu);
  assert.equal(criteria.motherboard, DEFAULT_CRITERIA.motherboard);
});

test("round-trips a valid brief through URL parameters", () => {
  const expected = {
    ...DEFAULT_CRITERIA,
    useCase: "AI/ML",
    gpu: "RTX 5090",
    ramGb: 64,
    includeUnclear: false,
  };
  const params = Object.fromEntries(
    new URLSearchParams(criteriaToParams(expected)).entries(),
  );

  assert.deepEqual(criteriaFromSearchParams(params), expected);
});
