"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { catalog } from "@/lib/catalog";
import { rankListings, type RankedListing, type ResultTier, type SearchCriteria, type UseCase } from "@/lib/matching";

const defaults: SearchCriteria = {
  useCase: "Video Editing",
  cpu: "Any",
  gpu: "RTX 5080",
  ramGb: 32,
  storageTb: 1,
  motherboard: "Any",
  maxPrice: 3500,
  includeUnclear: true,
  hideWeakMatches: true,
};

const useCases: UseCase[] = ["Gaming", "Video Editing", "3D Rendering", "AI/ML", "General Use"];
const cpuOptions = ["Any", "Ryzen 9 9950X", "Ryzen 9 9900X", "Core Ultra 9 285K", "Core i9-14900KF"];
const gpuOptions = ["Any", "RTX 5090", "RTX 5080", "RTX 5070 Ti", "RTX 5070", "Radeon RX 9070 XT"];
const boardOptions = ["Any", "X870E", "X870", "B850", "Z890", "Z790"];

const groupDetails: Record<ResultTier, { title: string; copy: string }> = {
  exact: { title: "Exact Matches", copy: "Meets the requested specifications without a meaningful compromise." },
  close: { title: "Close Matches", copy: "One or more differences, shown plainly." },
  worth: { title: "Worth Considering", copy: "A workload or value advantage justifies the tradeoff." },
};

export default function Home() {
  const [criteria, setCriteria] = useState(defaults);
  const [submitted, setSubmitted] = useState(defaults);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return;
    const fromUrl = criteriaFromParams(params);
    setCriteria(fromUrl);
    setSubmitted(fromUrl);
  }, []);

  const results = useMemo(() => rankListings(catalog, submitted), [submitted]);
  const grouped = useMemo(() => ({
    exact: results.filter((result) => result.tier === "exact"),
    close: results.filter((result) => result.tier === "close"),
    worth: results.filter((result) => result.tier === "worth"),
  }), [results]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(criteria);
    window.history.replaceState({}, "", `${window.location.pathname}?${criteriaToParams(criteria)}`);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        <a className="brand" href="#top" aria-label="RigScout home"><span className="brand-mark">R</span><span>RigScout</span></a>
        <div className="nav-links"><a href="#how-it-works">How it works</a><a href="#results">Sample deals</a></div>
        <button className="ghost-button" type="button" onClick={shareSearch}>{copied ? "Link copied" : "Share this brief"}</button>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span className="pulse" /> PC deal search, backwards</div>
        <h1>Pick the parts.<br /><span>We will find the whole PC.</span></h1>
        <p className="hero-copy">Search prebuilt computers by the components you actually want. Compare exact, close, and workload-smart alternatives without opening forty tabs.</p>

        <form className="search-panel" onSubmit={submit}>
          <div className="panel-heading">
            <div><p className="step-label">YOUR BUILD BRIEF</p><h2>What belongs in the box?</h2></div>
            <span className="demo-badge">Prototype / sample inventory</span>
          </div>

          <div className="field-grid">
            <SelectField label="Primary use" value={criteria.useCase} options={useCases} onChange={(useCase) => setCriteria({ ...criteria, useCase: useCase as UseCase })} />
            <SelectField label="Processor" value={criteria.cpu} options={cpuOptions} onChange={(cpu) => setCriteria({ ...criteria, cpu })} />
            <SelectField label="Graphics card" value={criteria.gpu} options={gpuOptions} onChange={(gpu) => setCriteria({ ...criteria, gpu })} />
            <NumberField label="Minimum memory" value={criteria.ramGb} suffix="GB" step={16} min={16} onChange={(ramGb) => setCriteria({ ...criteria, ramGb })} />
            <NumberField label="Minimum storage" value={criteria.storageTb} suffix="TB" step={1} min={1} onChange={(storageTb) => setCriteria({ ...criteria, storageTb })} />
            <SelectField label="Motherboard chipset" value={criteria.motherboard} options={boardOptions} onChange={(motherboard) => setCriteria({ ...criteria, motherboard })} />
            <NumberField label="Maximum price" value={criteria.maxPrice} prefix="$" step={100} min={500} onChange={(maxPrice) => setCriteria({ ...criteria, maxPrice })} />
          </div>

          <div className="panel-footer">
            <div className="toggle-stack">
              <Toggle label="Include unclear secondary specs" checked={criteria.includeUnclear} onChange={(includeUnclear) => setCriteria({ ...criteria, includeUnclear })} />
              <Toggle label="Hide matches below 60%" checked={criteria.hideWeakMatches} onChange={(hideWeakMatches) => setCriteria({ ...criteria, hideWeakMatches })} />
            </div>
            <button className="primary-button" type="submit">Find matching PCs <span>-&gt;</span></button>
          </div>
        </form>
      </section>

      <section className="trust-strip shell" id="how-it-works" aria-label="How RigScout works">
        <div><strong>01</strong><span><b>You choose the parts</b>Exact models or minimums</span></div>
        <div><strong>02</strong><span><b>We weight the workload</b>Gaming, editing, AI, or general use</span></div>
        <div><strong>03</strong><span><b>You see the tradeoffs</b>Matched, missing, and unclear</span></div>
      </section>

      <section className="results-section shell" id="results">
        <div className="results-heading">
          <div><p className="step-label">MATCHED FOR {submitted.useCase.toUpperCase()}</p><h2>{results.length} sample systems worth a look</h2></div>
          <div className="result-meta"><span className="pulse" /> Demo inventory / not live retailer data</div>
        </div>

        <div className="result-groups">
          {(["exact", "close", "worth"] as ResultTier[]).map((tier) => grouped[tier].length > 0 && (
            <ResultGroup key={tier} tier={tier} results={grouped[tier]} />
          ))}
        </div>

        <p className="affiliate-note">RigScout may earn a commission when you purchase through our links. This does not affect your price or result ranking. Always verify final specifications, price, and availability with the retailer.</p>
      </section>
    </main>
  );
}

function ResultGroup({ tier, results }: { tier: ResultTier; results: RankedListing[] }) {
  const detail = groupDetails[tier];
  return (
    <section className="result-group" aria-labelledby={`group-${tier}`}>
      <div className="group-heading"><div><h3 id={`group-${tier}`}>{detail.title}</h3><p>{detail.copy}</p></div><span>{results.length}</span></div>
      <div className="results-list">{results.map((result, index) => <ResultCard key={result.listing.id} result={result} rank={index + 1} />)}</div>
    </section>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function NumberField({ label, value, onChange, prefix, suffix, min, step }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; suffix?: string; min: number; step: number }) {
  return <label className="field"><span>{label}</span><div className="number-wrap">{prefix && <i>{prefix}</i>}<input type="number" value={value} min={min} step={step} onChange={(event) => onChange(Number(event.target.value))} />{suffix && <i>{suffix}</i>}</div></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="toggle-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle" aria-hidden="true" />{label}</label>;
}

function ResultCard({ result, rank }: { result: RankedListing; rank: number }) {
  const { listing, score, reasons, differences, overrideBadge, judgmentConfidence } = result;
  return (
    <article className="result-card">
      <div className="rank">{String(rank).padStart(2, "0")}</div>
      <div className="result-main">
        <div className="result-topline">
          <span className={`match-pill ${result.tier}`}>{score}% match</span>
          <span className="merchant">{listing.retailer}</span>
          {overrideBadge && <span className="override-badge">{overrideBadge}</span>}
        </div>
        <h3>{listing.name}</h3>
        <div className="spec-row">
          <Spec label="CPU" value={listing.cpu} confidence={listing.confidence.cpu} />
          <Spec label="GPU" value={listing.gpu} confidence={listing.confidence.gpu} />
          <Spec label="Memory" value={`${listing.ramGb} GB`} confidence={listing.confidence.ram} />
          <Spec label="Storage" value={`${listing.storageTb} TB NVMe`} confidence={listing.confidence.storage} />
          <Spec label="Board" value={listing.motherboard ?? "Unclear"} confidence={listing.confidence.motherboard} />
        </div>
        <div className="upgrade-row" aria-label="Upgradeability details">
          <UpgradeBadge label="Case" value={listing.caseStandard} warning={listing.caseStandard === "Proprietary"} />
          <UpgradeBadge label="PSU" value={listing.psuTier} warning={listing.psuTier === "Generic"} />
          <UpgradeBadge label="RAM" value={listing.ramConfig} warning={listing.ramConfig === "Single-channel"} />
          <UpgradeBadge label="Cooling" value={listing.cooling} />
        </div>
        <div className="verdict">
          <span className={`confidence-dot ${judgmentConfidence.toLowerCase()}`} title={`${judgmentConfidence} judgment confidence`} />
          <p><b>{reasons[0] ?? "Within budget"}.</b> {differences.length ? `${differences.join("; ")}.` : "No meaningful differences found in the published specifications."}</p>
        </div>
      </div>
      <div className="price-block">
        {listing.wasPrice && <span className="was-price">${listing.wasPrice.toLocaleString()}</span>}
        <strong>${listing.price.toLocaleString()}</strong>
        {listing.wasPrice && <span className="savings">Save ${(listing.wasPrice - listing.price).toLocaleString()}</span>}
        <a className="deal-button" href={`/go/${listing.id}`} target="_blank" rel="sponsored noopener">View at {listing.retailer} <span>^</span></a>
        <small>Affiliate link / sample destination</small>
      </div>
    </article>
  );
}

function Spec({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  return <div className={confidence < .8 ? "spec uncertain" : "spec"}><span>{label}{confidence < .8 ? " / likely" : ""}</span><b>{value}</b></div>;
}

function UpgradeBadge({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  const unknown = value === "Unknown";
  return <span className={`upgrade-badge ${warning ? "warning" : ""} ${unknown ? "unknown" : ""}`}><i>{label}</i><b>{value}</b></span>;
}

function criteriaToParams(criteria: SearchCriteria) {
  return new URLSearchParams({
    use: criteria.useCase,
    cpu: criteria.cpu,
    gpu: criteria.gpu,
    ram: String(criteria.ramGb),
    storage: String(criteria.storageTb),
    board: criteria.motherboard,
    max: String(criteria.maxPrice),
    unclear: criteria.includeUnclear ? "1" : "0",
    weak: criteria.hideWeakMatches ? "1" : "0",
  }).toString();
}

function criteriaFromParams(params: URLSearchParams): SearchCriteria {
  const use = params.get("use");
  return {
    useCase: useCases.includes(use as UseCase) ? use as UseCase : defaults.useCase,
    cpu: params.get("cpu") ?? defaults.cpu,
    gpu: params.get("gpu") ?? defaults.gpu,
    ramGb: positiveNumber(params.get("ram"), defaults.ramGb),
    storageTb: positiveNumber(params.get("storage"), defaults.storageTb),
    motherboard: params.get("board") ?? defaults.motherboard,
    maxPrice: positiveNumber(params.get("max"), defaults.maxPrice),
    includeUnclear: params.get("unclear") !== "0",
    hideWeakMatches: params.get("weak") !== "0",
  };
}

function positiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
