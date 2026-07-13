"use client";

import { FormEvent, useMemo, useState } from "react";
import type { PcListing } from "@/lib/catalog";
import {
  rankListings,
  type RankedListing,
  type ResultTier,
  type SearchCriteria,
  type UseCase,
} from "@/lib/matching";
import {
  BOARD_OPTIONS,
  CPU_OPTIONS,
  GPU_OPTIONS,
  USE_CASES,
  criteriaToParams,
} from "@/lib/search-criteria";
import {
  SPEC_REPORT_FIELDS,
  type SpecReportField,
} from "@/lib/spec-report-fields";

const groupDetails: Record<ResultTier, { title: string; copy: string }> = {
  exact: {
    title: "Exact Matches",
    copy: "Meets the requested specifications without a meaningful compromise.",
  },
  close: {
    title: "Close Matches",
    copy: "One or more differences, shown plainly.",
  },
  worth: {
    title: "Worth Considering",
    copy: "A workload advantage justifies the documented tradeoff.",
  },
};

export default function RigScoutSearch({
  initialCriteria,
  initialCatalog,
  inventorySource,
}: {
  initialCriteria: SearchCriteria;
  initialCatalog: PcListing[];
  inventorySource: "live" | "sample";
}) {
  const [criteria, setCriteria] = useState(initialCriteria);
  const [submitted, setSubmitted] = useState(initialCriteria);
  const [copied, setCopied] = useState(false);

  const results = useMemo(
    () => rankListings(initialCatalog, submitted),
    [initialCatalog, submitted],
  );

  const grouped = useMemo(
    () => ({
      exact: results.filter((result) => result.tier === "exact"),
      close: results.filter((result) => result.tier === "close"),
      worth: results.filter((result) => result.tier === "worth"),
    }),
    [results],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(criteria);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${criteriaToParams(criteria)}`,
    );
    document
      .getElementById("results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function shareSearch() {
    const url = `${window.location.origin}${window.location.pathname}?${criteriaToParams(submitted)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this build brief URL", url);
    }
  }

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Prebuilts.co home">
          <span className="brand-mark">P</span>
          <span>Prebuilts.co</span>
        </a>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#results">{inventorySource === "live" ? "Live deals" : "Sample deals"}</a>
          <a href="/about">About</a>
        </div>
        <button className="ghost-button" type="button" onClick={shareSearch}>
          {copied ? "Link copied" : "Share this brief"}
        </button>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow">
          <span className="pulse" /> PC deal search, backwards
        </div>
        <h1>
          Pick the parts.
          <br />
          <span>We will find the whole PC.</span>
        </h1>
        <p className="hero-copy">
          Search prebuilt computers by the components you actually want.
          Compare exact, close, and workload-smart alternatives without opening
          forty tabs.
        </p>

        <form className="search-panel" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <p className="step-label">YOUR BUILD BRIEF</p>
              <h2>What belongs in the box?</h2>
            </div>
            <span className="demo-badge">
              {inventorySource === "live" ? "Fresh retailer inventory" : "Prototype / sample inventory"}
            </span>
          </div>

          <div className="field-grid">
            <SelectField
              label="Primary use"
              value={criteria.useCase}
              options={USE_CASES}
              onChange={(useCase) =>
                setCriteria({ ...criteria, useCase: useCase as UseCase })
              }
            />
            <SelectField
              label="Processor"
              value={criteria.cpu}
              options={CPU_OPTIONS}
              onChange={(cpu) => setCriteria({ ...criteria, cpu })}
            />
            <SelectField
              label="Graphics card"
              value={criteria.gpu}
              options={GPU_OPTIONS}
              onChange={(gpu) => setCriteria({ ...criteria, gpu })}
            />
            <NumberField
              label="Minimum memory"
              value={criteria.ramGb}
              suffix="GB"
              step={16}
              min={16}
              onChange={(ramGb) => setCriteria({ ...criteria, ramGb })}
            />
            <NumberField
              label="Minimum storage"
              value={criteria.storageTb}
              suffix="TB"
              step={1}
              min={1}
              onChange={(storageTb) =>
                setCriteria({ ...criteria, storageTb })
              }
            />
            <SelectField
              label="Motherboard chipset"
              value={criteria.motherboard}
              options={BOARD_OPTIONS}
              onChange={(motherboard) =>
                setCriteria({ ...criteria, motherboard })
              }
            />
            <NumberField
              label="Maximum price"
              value={criteria.maxPrice}
              prefix="$"
              step={100}
              min={500}
              onChange={(maxPrice) =>
                setCriteria({ ...criteria, maxPrice })
              }
            />
          </div>

          <div className="panel-footer">
            <div className="toggle-stack">
              <Toggle
                label="Include listings with unclear secondary specs"
                checked={criteria.includeUnclear}
                onChange={(includeUnclear) =>
                  setCriteria({ ...criteria, includeUnclear })
                }
              />
              <Toggle
                label="Hide matches below 60%"
                checked={criteria.hideWeakMatches}
                onChange={(hideWeakMatches) =>
                  setCriteria({ ...criteria, hideWeakMatches })
                }
              />
            </div>
            <button className="primary-button" type="submit">
              Find matching PCs <span>-&gt;</span>
            </button>
          </div>
        </form>
      </section>

      <section
        className="trust-strip shell"
        id="how-it-works"
        aria-label="How Prebuilts.co works"
      >
        <div>
          <strong>01</strong>
          <span>
            <b>You choose the parts</b>Exact models or minimums
          </span>
        </div>
        <div>
          <strong>02</strong>
          <span>
            <b>We weight the workload</b>Gaming, editing, AI, or general use
          </span>
        </div>
        <div>
          <strong>03</strong>
          <span>
            <b>You see the tradeoffs</b>Matched, missing, and unclear
          </span>
        </div>
      </section>

      <section className="results-section shell" id="results">
        <div className="results-heading">
          <div>
            <p className="step-label">
              MATCHED FOR {submitted.useCase.toUpperCase()}
            </p>
            <h2>
              {results.length} {inventorySource === "live" ? "current" : "sample"} systems worth a look
            </h2>
          </div>
          <div className="result-meta">
            <span className="pulse" />{" "}
            {inventorySource === "live"
              ? "Retailer data refreshed daily"
              : "Demo inventory / not live retailer data"}
          </div>
        </div>

        <div className="result-groups">
          {(["exact", "close", "worth"] as ResultTier[]).map(
            (tier) =>
              grouped[tier].length > 0 && (
                <ResultGroup
                  key={tier}
                  tier={tier}
                  results={grouped[tier]}
                />
              ),
          )}
        </div>

        <p className="affiliate-note">
          Prebuilts.co may earn a commission when you purchase through eligible links.
          This does not affect your price or result ranking. Always verify final
          specifications, price, and availability with the retailer.
        </p>
      </section>
      <footer className="site-footer shell">
        <span>Prebuilts.co</span>
        <nav aria-label="Site information">
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/disclosure">Disclosure</a>
        </nav>
      </footer>
    </main>
  );
}

function ResultGroup({
  tier,
  results,
}: {
  tier: ResultTier;
  results: RankedListing[];
}) {
  const detail = groupDetails[tier];

  return (
    <section className="result-group" aria-labelledby={`group-${tier}`}>
      <div className="group-heading">
        <div>
          <h3 id={`group-${tier}`}>{detail.title}</h3>
          <p>{detail.copy}</p>
        </div>
        <span>{results.length}</span>
      </div>
      <div className="results-list">
        {results.map((result, index) => (
          <ResultCard
            key={result.listing.id}
            result={result}
            rank={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min: number;
  step: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="number-wrap">
        {prefix && <i>{prefix}</i>}
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(event) => {
            const nextValue = event.currentTarget.valueAsNumber;
            if (Number.isFinite(nextValue)) onChange(nextValue);
          }}
        />
        {suffix && <i>{suffix}</i>}
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle" aria-hidden="true" />
      {label}
    </label>
  );
}

function ResultCard({
  result,
  rank,
}: {
  result: RankedListing;
  rank: number;
}) {
  const {
    listing,
    score,
    reasons,
    differences,
    overrideBadge,
    judgmentConfidence,
  } = result;

  const differenceSummary = differences
    .map((difference) => difference.message)
    .join("; ");

  return (
    <article className={listing.imageUrl ? "result-card with-image" : "result-card"}>
      <div className="rank">{String(rank).padStart(2, "0")}</div>
      {listing.imageUrl && (
        <div className="product-image">
          <img src={listing.imageUrl} alt="" loading="lazy" />
          {listing.imageAttribution && <small>Image: {listing.imageAttribution}</small>}
        </div>
      )}
      <div className="result-main">
        <div className="result-topline">
          <span className={`match-pill ${result.tier}`}>{score}% match</span>
          <span className="merchant">{listing.retailer}</span>
          {overrideBadge && (
            <span className="override-badge">{overrideBadge}</span>
          )}
        </div>
        <h3>{listing.name}</h3>
        <div className="spec-row">
          <Spec
            label="CPU"
            value={listing.cpu}
            confidence={listing.confidence.cpu}
          />
          <Spec
            label="GPU"
            value={listing.gpu}
            confidence={listing.confidence.gpu}
          />
          <Spec
            label="Memory"
            value={`${listing.ramGb} GB`}
            confidence={listing.confidence.ram}
          />
          <Spec
            label="Storage"
            value={`${listing.storageTb} TB NVMe`}
            confidence={listing.confidence.storage}
          />
          <Spec
            label="Board"
            value={listing.motherboard ?? "Unclear"}
            confidence={listing.confidence.motherboard}
          />
        </div>
        <div className="upgrade-row" aria-label="Upgradeability details">
          <UpgradeBadge
            label="Case"
            value={listing.caseStandard}
            warning={listing.caseStandard === "Proprietary"}
          />
          <UpgradeBadge
            label="PSU"
            value={listing.psuTier}
            warning={listing.psuTier === "Generic"}
          />
          <UpgradeBadge
            label="RAM"
            value={listing.ramConfig}
            warning={listing.ramConfig === "Single-channel"}
          />
          <UpgradeBadge label="Cooling" value={listing.cooling} />
        </div>
        <div className="verdict">
          <span
            className={`confidence-dot ${judgmentConfidence.toLowerCase()}`}
            title={`${judgmentConfidence} judgment confidence`}
          />
          <p>
            <b>{reasons[0] ?? "Within budget"}.</b>{" "}
            {differenceSummary
              ? `${differenceSummary}.`
              : "No meaningful differences found in the published specifications."}
          </p>
        </div>
      </div>
      <div className="price-block">
        {listing.wasPrice && (
          <span className="was-price">
            ${listing.wasPrice.toLocaleString()}
          </span>
        )}
        <strong>${listing.price.toLocaleString()}</strong>
        {listing.wasPrice && (
          <span className="savings">
            Save ${(listing.wasPrice - listing.price).toLocaleString()}
          </span>
        )}
        <a
          className="deal-button"
          href={`/go/${listing.id}`}
          target="_blank"
          rel="sponsored noopener"
        >
          View at {listing.retailer} <span>^</span>
        </a>
        <small>
          {listing.id.startsWith("demo-")
            ? "Sample destination"
            : "Retailer link / verify final price"}
        </small>
      </div>
      <SpecReport listing={listing} />
    </article>
  );
}

function SpecReport({ listing }: { listing: PcListing }) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<SpecReportField>("cpu");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const formId = `spec-report-${listing.id}`;

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestedValue.trim() && !details.trim()) {
      setStatus("error");
      setMessage("Add a correction or a short note.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/reports/specs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          field,
          suggestedValue,
          details,
          website: formData.get("website"),
        }),
      });
      const body = await response.json().catch(() => ({})) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to send the report.");
      }

      setStatus("success");
      setMessage("Thanks. We will check this against the retailer source.");
      setSuggestedValue("");
      setDetails("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the report.",
      );
    }
  }

  function toggleReport() {
    setOpen((current) => !current);
    if (status !== "submitting") {
      setStatus("idle");
      setMessage("");
    }
  }

  return (
    <div className="spec-report">
      <button
        className="report-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={formId}
        onClick={toggleReport}
      >
        {open ? "Close report" : "Report incorrect specs"}
      </button>
      {open && (
        <form id={formId} className="report-form" onSubmit={submitReport}>
          <div className="report-copy">
            <b>What looks wrong?</b>
            <span>
              Reports are reviewed against the retailer listing before data is changed.
            </span>
          </div>
          <div className="report-grid">
            <label>
              <span>Specification</span>
              <select
                value={field}
                onChange={(event) =>
                  setField(event.target.value as SpecReportField)
                }
              >
                {SPEC_REPORT_FIELDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Suggested correction</span>
              <input
                value={suggestedValue}
                maxLength={160}
                placeholder="Example: RTX 5070 Ti, not RTX 5080"
                onChange={(event) => setSuggestedValue(event.target.value)}
              />
            </label>
            <label className="report-note">
              <span>Optional note</span>
              <textarea
                value={details}
                maxLength={600}
                rows={3}
                placeholder="Where did you find the conflicting information? Do not include personal information."
                onChange={(event) => setDetails(event.target.value)}
              />
            </label>
          </div>
          <label className="report-honeypot" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
          <div className="report-actions">
            <button
              className="report-submit"
              type="submit"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Sending..." : "Send report"}
            </button>
            {message && (
              <span
                className={`report-status ${status}`}
                role={status === "error" ? "alert" : "status"}
              >
                {message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Spec({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string;
  confidence: number;
}) {
  return (
    <div className={confidence < .8 ? "spec uncertain" : "spec"}>
      <span>
        {label}
        {confidence < .8 ? " / likely" : ""}
      </span>
      <b>{value}</b>
    </div>
  );
}

function UpgradeBadge({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  const unknown = value === "Unknown";

  return (
    <span
      className={`upgrade-badge ${warning ? "warning" : ""} ${unknown ? "unknown" : ""}`}
    >
      <i>{label}</i>
      <b>{value}</b>
    </span>
  );
}
