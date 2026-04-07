"use client";

import { useState, useEffect, useCallback } from "react";
import { coreService } from "@/services/coreService";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BowlData {
  bowlId: string;
  name: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  numSections: number;
  templateRows: number;
  templateSeatsPerRow: number;
  templateInnerRadius: number;
  templateOuterRadius: number;
  sectionIds: string[];
}

/** The shape comes from FieldConfigMetadata JSON on the SeatingPlan */
type StadiumShape = "round" | "rectangle";

interface BowlLayoutMapProps {
  seatingPlanId: string;
  className?: string;
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function calcCapacity(bowl: BowlData): number {
  return (bowl.numSections || 0) * (bowl.templateRows || 0) * (bowl.templateSeatsPerRow || 0);
}

/** Arc-sector SVG path used for circular stadiums */
function sectorPath(cx: number, cy: number, r1: number, r2: number, a1: number, a2: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const s = rad(a1), e = rad(a2);
  const big = a2 - a1 > 180 ? 1 : 0;
  const P = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const f = (n: number) => n.toFixed(2);
  const [ax, ay] = P(r1, s), [bx, by] = P(r1, e);
  const [ex, ey] = P(r2, e), [dx, dy] = P(r2, s);
  return `M${f(ax)} ${f(ay)} A${r1} ${r1} 0 ${big} 1 ${f(bx)} ${f(by)} L${f(ex)} ${f(ey)} A${r2} ${r2} 0 ${big} 0 ${f(dx)} ${f(dy)}Z`;
}

// ─── Circular (round) stadium map ─────────────────────────────────────────────

function CircularMap({
  bowls,
  selectedBowlId,
  onSelectBowl,
}: {
  bowls: BowlData[];
  selectedBowlId: string | null;
  onSelectBowl: (id: string) => void;
}) {
  const CX = 250, CY = 250, SCALE = 200 / 450, GAP = 1.5;

  return (
    <svg width="100%" viewBox="0 0 500 520" style={{ display: "block" }}>
      {/* Pitch ellipse */}
      <ellipse cx={CX} cy={CY} rx={70} ry={48} fill="#052e16" />
      <ellipse cx={CX} cy={CY} rx={70} ry={48} fill="none" stroke="#166534" strokeWidth={1} />
      <ellipse cx={CX} cy={CY} rx={44} ry={28} fill="none" stroke="#166534" strokeWidth={0.6} strokeDasharray="3 2" />
      <line x1={CX} y1={CY - 48} x2={CX} y2={CY + 48} stroke="#166534" strokeWidth={0.6} strokeDasharray="3 2" />
      <circle cx={CX} cy={CY} r={5} fill="none" stroke="#166534" strokeWidth={0.6} />
      <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="central" fontSize={8} fill="#22c55e" opacity={0.55} fontFamily="inherit">FIELD</text>

      {/* Bowl rings */}
      {bowls.map((bowl) => {
        const iR = bowl.templateInnerRadius * SCALE;
        const oR = bowl.templateOuterRadius * SCALE;
        const n = Math.max(bowl.numSections || 1, 1);
        const seg = 360 / n;
        const isSel = selectedBowlId === bowl.bowlId;
        const isDim = selectedBowlId !== null && !isSel;
        const opacity = isDim ? 0.14 : isSel ? 0.92 : 0.72;

        return (
          <g key={bowl.bowlId}>
            {Array.from({ length: n }, (_, i) => {
              const a1 = -90 + i * seg + GAP / 2;
              const a2 = -90 + (i + 1) * seg - GAP / 2;
              const d = sectorPath(CX, CY, iR, oR, a1, a2);
              const midRad = (((a1 + a2) / 2) * Math.PI) / 180;
              const midR = (iR + oR) / 2;
              return (
                <g key={i} onClick={() => onSelectBowl(bowl.bowlId)} style={{ cursor: "pointer" }}>
                  <path
                    d={d}
                    fill={bowl.color || "#6366f1"}
                    fillOpacity={opacity}
                    stroke={isSel ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"}
                    strokeWidth={isSel ? 1.2 : 0.35}
                  />
                  {n <= 28 && (
                    <text
                      x={(CX + midR * Math.cos(midRad)).toFixed(1)}
                      y={(CY + midR * Math.sin(midRad)).toFixed(1)}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={6} fill="rgba(255,255,255,0.45)" fontFamily="inherit"
                      style={{ pointerEvents: "none" }}
                    >{i + 1}</text>
                  )}
                </g>
              );
            })}
            {/* Selection highlight rings */}
            {isSel && (
              <>
                <circle cx={CX} cy={CY} r={iR} fill="none" stroke={bowl.color} strokeWidth={1.2} strokeDasharray="6 4" opacity={0.55} />
                <circle cx={CX} cy={CY} r={oR} fill="none" stroke={bowl.color} strokeWidth={1.2} strokeDasharray="6 4" opacity={0.55} />
              </>
            )}
          </g>
        );
      })}

      {/* Legend */}
      {bowls.map((bowl, i) => {
        const lx = 14 + i * 158;
        const cap = calcCapacity(bowl);
        return (
          <g key={bowl.bowlId}>
            <circle cx={lx + 5} cy={508} r={4.5} fill={bowl.color || "#6366f1"} opacity={0.85} />
            <text x={lx + 13} y={512} fontSize={8.5} fill="#9ca3af" fontFamily="inherit" dominantBaseline="central">
              {bowl.name} · {cap > 0 ? cap.toLocaleString() : "—"} seats
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Rectangular (4-stand) stadium map ────────────────────────────────────────

/**
 * Renders a top-down rectangular stadium view with 4 stand bands:
 * North / South / East / West — one band per bowl, stacked outward.
 * Each stand is a rectangle that wraps 3 sides (N, S, E, W treated independently).
 * We draw the bands using layered rects clipped to each side.
 */
function RectangularMap({
  bowls,
  selectedBowlId,
  onSelectBowl,
}: {
  bowls: BowlData[];
  selectedBowlId: string | null;
  onSelectBowl: (id: string) => void;
}) {
  const VW = 500, VH = 500;
  const CX = VW / 2, CY = VH / 2;

  // Field (pitch) rectangle
  const PITCH_W = 190, PITCH_H = 120;
  const PITCH_X = CX - PITCH_W / 2, PITCH_Y = CY - PITCH_H / 2;

  // Each bowl adds a band of BAND_THICK pixels on all 4 sides
  const BAND_THICK = 24;
  const GAP = 2; // gap between bands

  const sides = ["North", "South", "East", "West"] as const;

  return (
    <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: "block" }}>
      {/* Pitch */}
      <rect x={PITCH_X} y={PITCH_Y} width={PITCH_W} height={PITCH_H} rx={4} fill="#052e16" stroke="#166534" strokeWidth={1.2} />
      {/* Centre circle */}
      <circle cx={CX} cy={CY} r={18} fill="none" stroke="#166534" strokeWidth={0.7} strokeDasharray="3 2" />
      {/* Half-way line */}
      <line x1={CX} y1={PITCH_Y} x2={CX} y2={PITCH_Y + PITCH_H} stroke="#166534" strokeWidth={0.7} strokeDasharray="3 2" />
      <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="central" fontSize={8} fill="#22c55e" opacity={0.5} fontFamily="inherit">FIELD</text>

      {/* Goal boxes (simplified) */}
      <rect x={PITCH_X} y={CY - 22} width={22} height={44} fill="none" stroke="#166534" strokeWidth={0.6} opacity={0.5} />
      <rect x={PITCH_X + PITCH_W - 22} y={CY - 22} width={22} height={44} fill="none" stroke="#166534" strokeWidth={0.6} opacity={0.5} />

      {/* Bowl stands — each bowl gets a band around the pitch */}
      {bowls.map((bowl, idx) => {
        const offset = idx * (BAND_THICK + GAP);
        const isSel = selectedBowlId === bowl.bowlId;
        const isDim = selectedBowlId !== null && !isSel;
        const fillOp = isDim ? 0.12 : isSel ? 0.88 : 0.65;
        const fill = bowl.color || "#6366f1";
        const stroke = isSel ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
        const sw = isSel ? 1.2 : 0.4;

        // Outer and inner extents of this band for each side
        const northInnerY = PITCH_Y - offset - GAP / 2;
        const northOuterY = northInnerY - BAND_THICK;
        const southInnerY = PITCH_Y + PITCH_H + offset + GAP / 2;
        const southOuterY = southInnerY + BAND_THICK;
        const westInnerX  = PITCH_X - offset - GAP / 2;
        const westOuterX  = westInnerX - BAND_THICK;
        const eastInnerX  = PITCH_X + PITCH_W + offset + GAP / 2;
        const eastOuterX  = eastInnerX + BAND_THICK;

        // Width of east/west bands (match the total N/S span so corners are filled)
        const totalHalf = offset + BAND_THICK;
        const ewBandH = PITCH_H + 2 * totalHalf;

        // N and S bands span the full E/W extent
        const nsBandW = PITCH_W + 2 * totalHalf;

        const sharedProps = { fill, fillOpacity: fillOp, stroke, strokeWidth: sw };

        return (
          <g key={bowl.bowlId} onClick={() => onSelectBowl(bowl.bowlId)} style={{ cursor: "pointer" }}>
            {/* North stand */}
            <rect x={CX - nsBandW / 2} y={northOuterY} width={nsBandW} height={BAND_THICK} rx={2} {...sharedProps} />
            {/* South stand */}
            <rect x={CX - nsBandW / 2} y={southInnerY} width={nsBandW} height={BAND_THICK} rx={2} {...sharedProps} />
            {/* West stand (corners excluded — just the side strip at pitch height) */}
            <rect x={westOuterX} y={PITCH_Y - offset - GAP / 2} width={BAND_THICK} height={PITCH_H + 2 * (offset + GAP / 2)} rx={2} {...sharedProps} />
            {/* East stand */}
            <rect x={eastInnerX} y={PITCH_Y - offset - GAP / 2} width={BAND_THICK} height={PITCH_H + 2 * (offset + GAP / 2)} rx={2} {...sharedProps} />

            {/* Stand labels — only at reasonable thickness */}
            {BAND_THICK >= 16 && (
              <>
                <text x={CX} y={northOuterY + BAND_THICK / 2} textAnchor="middle" dominantBaseline="central" fontSize={7} fill="rgba(255,255,255,0.5)" fontFamily="inherit" style={{ pointerEvents: "none" }}>
                  {bowl.name} N
                </text>
                <text x={CX} y={southInnerY + BAND_THICK / 2} textAnchor="middle" dominantBaseline="central" fontSize={7} fill="rgba(255,255,255,0.5)" fontFamily="inherit" style={{ pointerEvents: "none" }}>
                  {bowl.name} S
                </text>
              </>
            )}

            {/* Selection highlight outline */}
            {isSel && (
              <rect
                x={CX - nsBandW / 2 - 1}
                y={northOuterY - 1}
                width={nsBandW + 2}
                height={(southInnerY + BAND_THICK) - northOuterY + 2}
                fill="none"
                stroke={fill}
                strokeWidth={1.2}
                strokeDasharray="6 4"
                opacity={0.5}
                rx={3}
              />
            )}
          </g>
        );
      })}

      {/* Side labels */}
      {[
        { label: "NORTH", x: CX, y: 14 },
        { label: "SOUTH", x: CX, y: VH - 10 },
        { label: "WEST",  x: 14, y: CY, rotate: -90 },
        { label: "EAST",  x: VW - 14, y: CY, rotate: 90 },
      ].map(({ label, x, y, rotate }) => (
        <text
          key={label}
          x={x} y={y}
          textAnchor="middle" dominantBaseline="central"
          fontSize={8} fill="#374151"
          fontFamily="inherit"
          transform={rotate ? `rotate(${rotate}, ${x}, ${y})` : undefined}
          letterSpacing={1}
        >
          {label}
        </text>
      ))}

      {/* Legend */}
      {bowls.map((bowl, i) => {
        const lx = 14 + i * 158;
        const cap = calcCapacity(bowl);
        return (
          <g key={bowl.bowlId}>
            <rect x={lx} y={VH - 15} width={9} height={9} rx={2} fill={bowl.color || "#6366f1"} opacity={0.85} />
            <text x={lx + 13} y={VH - 11} fontSize={8.5} fill="#9ca3af" fontFamily="inherit" dominantBaseline="central">
              {bowl.name} · {cap > 0 ? cap.toLocaleString() : "—"} seats
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Bowl Detail Card ─────────────────────────────────────────────────────────

function BowlCard({
  bowl,
  isSelected,
  totalCapacity,
  shape,
  onSelect,
}: {
  bowl: BowlData;
  isSelected: boolean;
  totalCapacity: number;
  shape: StadiumShape;
  onSelect: (id: string) => void;
}) {
  const cap = calcCapacity(bowl);
  const pct = totalCapacity > 0 ? ((cap / totalCapacity) * 100).toFixed(1) : "—";
  const bandWidth = bowl.templateOuterRadius - bowl.templateInnerRadius;

  const fields: [string, string | number][] =
    shape === "rectangle"
      ? [
          ["Capacity", cap > 0 ? cap.toLocaleString() : "—"],
          ["Zone Share", cap > 0 ? `${pct}%` : "—"],
          ["Sections", bowl.numSections],
          ["Rows / section", bowl.templateRows],
          ["Seats / row", bowl.templateSeatsPerRow],
          ["Band depth", `${bandWidth}m`],
        ]
      : [
          ["Capacity", cap > 0 ? cap.toLocaleString() : "—"],
          ["Zone Share", cap > 0 ? `${pct}%` : "—"],
          ["Sections", bowl.numSections],
          ["Rows / section", bowl.templateRows],
          ["Seats / row", bowl.templateSeatsPerRow],
          ["Band width", `${bandWidth}m`],
          ["Inner radius", `${bowl.templateInnerRadius}m`],
          ["Outer radius", `${bowl.templateOuterRadius}m`],
        ];

  return (
    <div
      onClick={() => onSelect(bowl.bowlId)}
      className={cn(
        "rounded-xl border p-3 cursor-pointer transition-all duration-150 bg-black/20",
        !isSelected && "border-white/10 hover:border-white/20"
      )}
      style={{
        borderColor: isSelected ? bowl.color : undefined,
        boxShadow: isSelected ? `0 0 20px ${bowl.color}28` : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: bowl.color }} />
        <span className="text-sm font-semibold text-white flex-1 truncate">{bowl.name}</span>
        <span className="text-[10px] text-gray-500 font-mono">Zone {bowl.displayOrder}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
        {fields.map(([label, value]) => (
          <div key={label}>
            <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
            <div className="text-xs font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-500">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: bowl.isActive ? "#22c55e" : "#ef4444" }}
        />
        <span>
          {bowl.isActive ? "Active" : "Inactive"} ·{" "}
          {bowl.numSections * bowl.templateRows > 0
            ? `${bowl.numSections * bowl.templateRows} total rows`
            : "no row data"}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BowlLayoutMap({ seatingPlanId, className }: BowlLayoutMapProps) {
  const [bowls, setBowls] = useState<BowlData[]>([]);
  const [shape, setShape] = useState<StadiumShape>("round");
  const [selectedBowlId, setSelectedBowlId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!seatingPlanId) return;
    setLoading(true);
    setError(null);
    try {
      // Load bowls and field config in parallel
      const [bowlsRes, fieldRes] = await Promise.all([
        coreService.getBowls(seatingPlanId),
        coreService.getFieldConfig(seatingPlanId),
      ]);

      // Detect shape from FieldConfigMetadata
      if (fieldRes.success && fieldRes.data) {
        const s = fieldRes.data.shape as string | undefined;
        setShape(s === "rectangle" ? "rectangle" : "round");
      }

      if (bowlsRes.success && Array.isArray(bowlsRes.data)) {
        const normalized: BowlData[] = bowlsRes.data.map((b: any) => ({
          bowlId: b.bowlId ?? "",
          name: b.name ?? "Unnamed Bowl",
          color: b.color ?? "#6366f1",
          displayOrder: b.displayOrder ?? 0,
          isActive: b.isActive !== false,
          numSections: b.numSections ?? 0,
          templateRows: b.templateRows ?? 0,
          templateSeatsPerRow: b.templateSeatsPerRow ?? 0,
          templateInnerRadius: b.templateInnerRadius ?? 100,
          templateOuterRadius: b.templateOuterRadius ?? 150,
          sectionIds: Array.isArray(b.sectionIds) ? b.sectionIds : [],
        }));
        setBowls(normalized.sort((a, b) => a.displayOrder - b.displayOrder));
      } else {
        setError("Could not load bowl data.");
      }
    } catch {
      setError("Failed to fetch bowl configuration.");
    } finally {
      setLoading(false);
    }
  }, [seatingPlanId]);

  useEffect(() => { load(); }, [load]);

  const toggleBowl = (id: string) => setSelectedBowlId((p) => (p === id ? null : id));
  const totalCapacity = bowls.reduce((s, b) => s + calcCapacity(b), 0);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center gap-3 py-20 text-gray-500", className)}>
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
        </svg>
        <span className="text-sm">Loading bowl configuration…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400", className)}>
        {error}
      </div>
    );
  }

  const shapeLabel = shape === "rectangle" ? "Rectangular" : "Circular";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Metric strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ["Total Capacity", totalCapacity > 0 ? totalCapacity.toLocaleString() : "—", "estimated seats"],
          ["Bowl Zones", bowls.length, "seating tiers"],
          ["Total Sections", bowls.reduce((s, b) => s + (b.numSections || 0), 0), "across all zones"],
          ["Layout Shape", shapeLabel, "auto-detected"],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="rounded-xl border border-white/5 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-bold text-white leading-tight">{value}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Map + cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        {/* SVG Map area */}
        <div className="rounded-xl border border-white/5 bg-black/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Bowl Layout — {shapeLabel}
            </div>
            <div
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                borderColor: shape === "rectangle" ? "#60a5fa33" : "#34d39933",
                color: shape === "rectangle" ? "#60a5fa" : "#34d399",
                background: shape === "rectangle" ? "#60a5fa0a" : "#34d3990a",
              }}
            >
              {shape === "rectangle" ? "4-Stand" : "Ring"}
            </div>
          </div>
          <div className="text-[10px] text-gray-600 mb-3">
            Click any {shape === "rectangle" ? "stand band" : "bowl ring"} to inspect
          </div>

          {bowls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-600">
              <div className="text-4xl opacity-20">{shape === "rectangle" ? "▭" : "◎"}</div>
              <div className="text-sm">No bowl zones configured</div>
              <div className="text-xs text-gray-700">Add bowls in the Stadium Layout Builder</div>
            </div>
          ) : shape === "rectangle" ? (
            <RectangularMap bowls={bowls} selectedBowlId={selectedBowlId} onSelectBowl={toggleBowl} />
          ) : (
            <CircularMap bowls={bowls} selectedBowlId={selectedBowlId} onSelectBowl={toggleBowl} />
          )}
        </div>

        {/* Bowl cards */}
        <div className="flex flex-col gap-3">
          {bowls.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 rounded-xl border border-dashed border-white/10 text-gray-600 text-center text-sm">
              <span className="text-2xl opacity-20">○</span>
              No bowl data
            </div>
          ) : (
            bowls.map((bowl) => (
              <BowlCard
                key={bowl.bowlId}
                bowl={bowl}
                isSelected={selectedBowlId === bowl.bowlId}
                totalCapacity={totalCapacity}
                shape={shape}
                onSelect={toggleBowl}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BowlLayoutMap;
