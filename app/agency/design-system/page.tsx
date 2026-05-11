import { ChannelLogo }      from '@/components/ds/ChannelLogo'
import { Tag }              from '@/components/ds/Tag'
import { Button }           from '@/components/ds/Button'
import { SparkLine }        from '@/components/ds/SparkLine'
import { KPI }              from '@/components/ds/KPI'
import { PacingBar }        from '@/components/ds/PacingBar'
import { ChannelPacingRow } from '@/components/ds/ChannelPacingRow'

// ─── Types locaux ─────────────────────────────────────────────────────────────

type SwatchRow = { name: string; hex: string; className: string }

// ─── Données de la démo ───────────────────────────────────────────────────────

const PALETTE: { label: string; swatches: SwatchRow[] }[] = [
  {
    label: 'Sand — neutres chauds',
    swatches: [
      { name: 'sand-50',  hex: '#FBF9F6', className: 'bg-sand-50'  },
      { name: 'sand-100', hex: '#F5F2EC', className: 'bg-sand-100' },
      { name: 'sand-200', hex: '#ECE7DD', className: 'bg-sand-200' },
      { name: 'sand-300', hex: '#DCD4C4', className: 'bg-sand-300' },
      { name: 'sand-400', hex: '#B8AC95', className: 'bg-sand-400' },
      { name: 'sand-500', hex: '#8B7E66', className: 'bg-sand-500' },
      { name: 'sand-600', hex: '#5C5240', className: 'bg-sand-600' },
      { name: 'sand-700', hex: '#3D362A', className: 'bg-sand-700' },
      { name: 'sand-800', hex: '#26221B', className: 'bg-sand-800' },
      { name: 'sand-900', hex: '#16140F', className: 'bg-sand-900' },
    ],
  },
  {
    label: 'Indigo — Deep Blue (primaire)',
    swatches: [
      { name: 'indigo-50',  hex: '#EAF2F7', className: 'bg-indigo-50'  },
      { name: 'indigo-100', hex: '#CCDFEA', className: 'bg-indigo-100' },
      { name: 'indigo-300', hex: '#6FA5BD', className: 'bg-indigo-300' },
      { name: 'indigo-500', hex: '#1F6E8C', className: 'bg-indigo-500' },
      { name: 'indigo-600', hex: '#023047', className: 'bg-indigo-600' },
      { name: 'indigo-700', hex: '#01233A', className: 'bg-indigo-700' },
      { name: 'indigo-900', hex: '#01182A', className: 'bg-indigo-900' },
    ],
  },
  {
    label: 'Sky — bleu lumineux secondaire',
    swatches: [
      { name: 'sky-50',  hex: '#F0F8FC', className: 'bg-sky-50'  },
      { name: 'sky-100', hex: '#DDEEF6', className: 'bg-sky-100' },
      { name: 'sky-300', hex: '#8ECAE6', className: 'bg-sky-300' },
      { name: 'sky-500', hex: '#5BB4D8', className: 'bg-sky-500' },
      { name: 'sky-700', hex: '#2E8AB0', className: 'bg-sky-700' },
    ],
  },
  {
    label: 'Terra — Tiger Orange (accent)',
    swatches: [
      { name: 'terra-50',  hex: '#FFEFDC', className: 'bg-terra-50'  },
      { name: 'terra-100', hex: '#FFDBB0', className: 'bg-terra-100' },
      { name: 'terra-300', hex: '#FFB770', className: 'bg-terra-300' },
      { name: 'terra-500', hex: '#FB8500', className: 'bg-terra-500' },
      { name: 'terra-600', hex: '#D86F00', className: 'bg-terra-600' },
      { name: 'terra-700', hex: '#A35200', className: 'bg-terra-700' },
    ],
  },
  {
    label: 'Flame — amber chaud',
    swatches: [
      { name: 'flame-50',  hex: '#FFF6DC', className: 'bg-flame-50'  },
      { name: 'flame-100', hex: '#FFE7A6', className: 'bg-flame-100' },
      { name: 'flame-300', hex: '#FFCB58', className: 'bg-flame-300' },
      { name: 'flame-500', hex: '#FFB703', className: 'bg-flame-500' },
      { name: 'flame-600', hex: '#D89900', className: 'bg-flame-600' },
      { name: 'flame-700', hex: '#A37200', className: 'bg-flame-700' },
    ],
  },
  {
    label: 'Sémantiques',
    swatches: [
      { name: 'emerald-50',  hex: '#ECF8F1', className: 'bg-emerald-50'  },
      { name: 'emerald-500', hex: '#2F9E63', className: 'bg-emerald-500' },
      { name: 'emerald-700', hex: '#1F6E45', className: 'bg-emerald-700' },
      { name: 'amber-50',    hex: '#FDF5E6', className: 'bg-amber-50'    },
      { name: 'amber-500',   hex: '#D89030', className: 'bg-amber-500'   },
      { name: 'amber-700',   hex: '#8C5A18', className: 'bg-amber-700'   },
      { name: 'rose-50',     hex: '#FCEEEE', className: 'bg-rose-50'     },
      { name: 'rose-500',    hex: '#D04848', className: 'bg-rose-500'    },
      { name: 'rose-700',    hex: '#8E2A2A', className: 'bg-rose-700'    },
    ],
  },
]

const SPARK_DATA = [8, 12, 10, 14, 18, 16, 24]

// ─── Composants de la démo ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-terra-600 mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-3">
      {label && (
        <span className="font-mono text-[11px] text-sand-400 w-28 shrink-0">{label}</span>
      )}
      {children}
    </div>
  )
}

function ColorSwatch({ name, hex, className }: SwatchRow) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className={`w-12 h-12 rounded-ds-md border border-sand-200 ${className}`} />
      <span className="font-mono text-[10px] text-sand-600">{name}</span>
      <span className="font-mono text-[10px] text-sand-400">{hex}</span>
    </div>
  )
}

function RadiusDemo({ label, radius }: { label: string; radius: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-12 h-12 bg-indigo-100 border border-indigo-200"
        style={{ borderRadius: radius }}
      />
      <span className="font-mono text-[10px] text-sand-600">{label}</span>
      <span className="font-mono text-[10px] text-sand-400">{radius}</span>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <div className="bg-sand-50 min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-sand-200 px-8 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-[11px] text-sand-400 uppercase tracking-[0.1em] mb-1">
            XXL Dashboard 2026
          </p>
          <h1 className="text-2xl font-semibold text-sand-900 tracking-tight">
            Design System — Fondations
          </h1>
          <p className="text-sm text-sand-500 mt-1">
            Palette · Typographie · Radii · Composants atomiques (Priorité 1)
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* ── Couleurs ── */}
        <Section title="Couleurs">
          {PALETTE.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="text-xs text-sand-500 font-medium mb-3">{group.label}</p>
              <div className="flex flex-wrap gap-3">
                {group.swatches.map((s) => (
                  <ColorSwatch key={s.name} {...s} />
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* ── Typographie ── */}
        <Section title="Typographie">
          <div className="bg-white border border-sand-200 rounded-ds-lg p-6 space-y-4">
            {[
              { label: 'Heading 1',    size: 'text-[40px]',  weight: 'font-semibold', sample: 'Résidence Galliéni' },
              { label: 'Heading 2',    size: 'text-[28px]',  weight: 'font-semibold', sample: 'Performances' },
              { label: 'Heading 3',    size: 'text-[22px]',  weight: 'font-semibold', sample: 'Détail par régie' },
              { label: 'Body',         size: 'text-[15px]',  weight: 'font-normal',   sample: '63 contacts reçus à un coût maîtrisé.' },
              { label: 'Body small',   size: 'text-[13px]',  weight: 'font-normal',   sample: 'Bati-Paris · Bagneux · 95 lots (19 BRS)' },
              { label: 'Label',        size: 'text-[12px]',  weight: 'font-medium',   sample: 'Budget engagé' },
              { label: 'Eyebrow',      size: 'text-[11px]',  weight: 'font-semibold', sample: 'CONTACTS REÇUS', extra: 'uppercase tracking-[0.12em] text-sand-500' },
              { label: 'Mono',         size: 'text-[13px]',  weight: 'font-normal',   sample: 'Temps · 75%   Budget · 82%', extra: 'font-mono' },
              { label: 'Mono small',   size: 'text-[11px]',  weight: 'font-normal',   sample: 'act_686525616939258', extra: 'font-mono text-sand-500' },
            ].map(({ label, size, weight, sample, extra = '' }) => (
              <div key={label} className="flex items-baseline gap-6 pb-4 border-b border-sand-100 last:border-0 last:pb-0">
                <span className="font-mono text-[11px] text-sand-400 w-24 shrink-0">{label}</span>
                <span className={`${size} ${weight} text-sand-900 ${extra} leading-tight`}>
                  {sample}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Radii ── */}
        <Section title="Radii">
          <div className="flex flex-wrap gap-6">
            <RadiusDemo label="ds-sm" radius="6px" />
            <RadiusDemo label="ds-md" radius="10px" />
            <RadiusDemo label="ds-lg" radius="14px" />
            <RadiusDemo label="ds-xl" radius="20px" />
            <RadiusDemo label="ds-full" radius="9999px" />
          </div>
        </Section>

        {/* ── Tag ── */}
        <Section title="Tag">
          <Row label="Variants">
            <Tag variant="default">default</Tag>
            <Tag variant="indigo">indigo</Tag>
            <Tag variant="emerald">● En ligne</Tag>
            <Tag variant="amber">amber</Tag>
            <Tag variant="rose">rose</Tag>
            <Tag variant="terra">terra</Tag>
          </Row>
          <Row label="Usage réel">
            <Tag variant="emerald">● Campagne active</Tag>
            <Tag variant="indigo">Plan validé</Tag>
            <Tag variant="amber">Assets en cours</Tag>
            <Tag variant="rose">Sous-performance</Tag>
            <Tag variant="terra">Brief en cours</Tag>
            <Tag variant="default">Non activé</Tag>
          </Row>
        </Section>

        {/* ── Button ── */}
        <Section title="Button">
          <Row label="primary">
            <Button variant="primary" size="md">+ Nouveau brief</Button>
            <Button variant="primary" size="sm">Générer le plan</Button>
          </Row>
          <Row label="default">
            <Button variant="default" size="md">Synchroniser</Button>
            <Button variant="default" size="sm">Aperçu PDF</Button>
          </Row>
          <Row label="ghost">
            <Button variant="ghost" size="md">← Retour</Button>
            <Button variant="ghost" size="sm">Tous · 4</Button>
          </Row>
          <Row label="disabled">
            <Button variant="primary" disabled>Désactivé</Button>
            <Button variant="default" disabled>Désactivé</Button>
          </Row>
        </Section>

        {/* ── SparkLine ── */}
        <Section title="SparkLine">
          <Row label="indigo (défaut)">
            <div className="bg-white border border-sand-200 rounded-ds-md px-4 py-3 flex items-center gap-4">
              <span className="text-xs text-sand-500">Contacts reçus</span>
              <SparkLine data={SPARK_DATA} />
            </div>
          </Row>
          <Row label="terra">
            <div className="bg-white border border-sand-200 rounded-ds-md px-4 py-3 flex items-center gap-4">
              <span className="text-xs text-sand-500">CPL</span>
              <SparkLine data={[28, 32, 38, 42, 40, 38, 40]} color="var(--terra-500)" />
            </div>
          </Row>
          <Row label="emerald">
            <div className="bg-white border border-sand-200 rounded-ds-md px-4 py-3 flex items-center gap-4">
              <span className="text-xs text-sand-500">Budget consommé</span>
              <SparkLine data={[10, 12, 11, 14, 16, 18, 18]} color="var(--emerald-500)" />
            </div>
          </Row>
        </Section>

        {/* ── KPI ── */}
        <Section title="KPI">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KPI
              label="Budget géré"
              value="18 300 €"
              sub="sur 4 programmes"
              spark={[10, 12, 11, 14, 16, 18, 18]}
            />
            <KPI
              label="Contacts reçus"
              value="171"
              sub="+24 cette semaine"
              tone="success"
              spark={SPARK_DATA}
            />
            <KPI
              label="CPL moyen"
              value="39,71 €"
              sub="cible 30 €"
              tone="warning"
              spark={[28, 32, 38, 42, 40, 38, 40]}
            />
            <KPI
              label="CPL Bricklane"
              value="201,33 €"
              sub="cible 18 €"
              tone="danger"
              spark={[18, 40, 80, 120, 160, 190, 201]}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Sans spark" value="63" sub="contacts reçus" />
            <KPI label="Sans sub" value="3,05 %" />
            <KPI label="Tone success" value="40,95 €" sub="en-dessous objectif" tone="success" />
            <KPI label="Investi" value="6 790 €" sub="37% du budget" />
          </div>
        </Section>

        {/* ── PacingBar ── */}
        <Section title="PacingBar">
          <div className="bg-white border border-sand-200 rounded-ds-lg p-5 space-y-5 max-w-sm">
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">on-track</p>
              <PacingBar timePct={75} budgetPct={82} status="on-track" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">under (sous-consommation)</p>
              <PacingBar timePct={50} budgetPct={19} status="under" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">over (sur-consommation)</p>
              <PacingBar timePct={40} budgetPct={75} status="over" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">début de campagne</p>
              <PacingBar timePct={10} budgetPct={4} status="under" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">fin de campagne</p>
              <PacingBar timePct={90} budgetPct={88} status="on-track" />
            </div>
          </div>
        </Section>

        {/* ── ChannelLogo ── */}
        <Section title="ChannelLogo">
          <Row label="Google">
            <ChannelLogo channel="google" size={14} />
            <ChannelLogo channel="google" size={20} />
            <ChannelLogo channel="google" size={28} />
            <ChannelLogo channel="google" size={40} />
          </Row>
          <Row label="Meta">
            <ChannelLogo channel="meta" size={14} />
            <ChannelLogo channel="meta" size={20} />
            <ChannelLogo channel="meta" size={28} />
            <ChannelLogo channel="meta" size={40} />
          </Row>
        </Section>

        {/* ── ChannelPacingRow ── */}
        <Section title="ChannelPacingRow">
          <div className="bg-white border border-sand-200 rounded-ds-lg p-5 space-y-4 max-w-sm">
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">Google — on-track</p>
              <ChannelPacingRow channel="google" timePct={90} budgetPct={82} status="on-track" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">Meta — on-track</p>
              <ChannelPacingRow channel="meta" timePct={90} budgetPct={74} status="on-track" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">Google — under</p>
              <ChannelPacingRow channel="google" timePct={50} budgetPct={19} status="under" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">Meta — non activé</p>
              <ChannelPacingRow channel="meta" notActive />
            </div>
            <div>
              <p className="font-mono text-[10px] text-sand-400 uppercase mb-2">Google — non activé</p>
              <ChannelPacingRow channel="google" notActive />
            </div>
          </div>
          {/* Exemple tableau portefeuille */}
          <div className="mt-4 bg-white border border-sand-200 rounded-ds-lg overflow-hidden max-w-lg">
            <div className="px-4 py-3 border-b border-sand-200">
              <p className="text-sm font-semibold text-sand-900">Exemple — Portefeuille</p>
            </div>
            {[
              { name: 'Résidence Galliéni', google: { time: 90, budget: 82, status: 'on-track' as const }, meta: { time: 90, budget: 74, status: 'on-track' as const } },
              { name: 'Promenade Nodier',   google: { time: 75, budget: 0,  status: 'over' as const   }, meta: { time: 75, budget: 12, status: 'over' as const } },
              { name: '6 Leclerc',          google: { time: 75, budget: 4,  status: 'under' as const  }, meta: null },
              { name: 'Bricklane',          google: { time: 50, budget: 30, status: 'under' as const  }, meta: null },
            ].map((p) => (
              <div key={p.name} className="px-4 py-3 border-t border-sand-100 flex items-center gap-4">
                <span className="text-sm font-medium text-sand-900 w-36 shrink-0">{p.name}</span>
                <div className="flex-1 space-y-1.5">
                  <ChannelPacingRow channel="google" {...p.google} />
                  {p.meta
                    ? <ChannelPacingRow channel="meta" {...p.meta} />
                    : <ChannelPacingRow channel="meta" notActive />
                  }
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Footer ── */}
        <div className="mt-8 pt-6 border-t border-sand-200 flex items-center justify-between">
          <p className="font-mono text-[11px] text-sand-400">
            feat/design-system · Phase fondations
          </p>
          <p className="font-mono text-[11px] text-sand-400">
            7 composants · Inter + JetBrains Mono · Deep Blue #023047
          </p>
        </div>
      </div>
    </div>
  )
}
