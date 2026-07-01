import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeInfo,
  Beaker,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Coffee,
  Droplets,
  Gauge,
  ListChecks,
  Monitor,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  SlidersHorizontal,
  Sun,
  Thermometer,
  TimerReset,
  Trash2,
  Waves,
} from 'lucide-react';
import { agitationOptions, defaultRecipe, grindOptions, seedRecipes } from './data/defaults';
import {
  buildSchedule,
  createId,
  formatApproxTime,
  formatTime,
  getActiveStepIndex,
  getStepStatus,
  normalizeRecipe,
  updateRecipeCoffee,
  updateRecipeRatio,
  updateRecipeWater,
} from './lib/brew';
import { playCue } from './lib/audio';
import { loadBrewLog, loadRecipes, saveBrewLog, saveRecipes } from './lib/storage';
import type { BrewLogEntry, BrewRecipe, BrewStatus, GrindSize } from './types';

type Tab = 'Guide' | 'Expert';
type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'pourover.theme.v1';

const getStoredTheme = (): ThemePreference => {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  } catch {
    return 'system';
  }
};

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const getThemeLabel = (themePreference: ThemePreference) => {
  if (themePreference === 'system') return 'System';
  return themePreference === 'dark' ? 'Dark' : 'Light';
};

const getThemeIcon = (themePreference: ThemePreference) => {
  if (themePreference === 'system') return Monitor;
  return themePreference === 'dark' ? Moon : Sun;
};

export function App() {
  const [recipe, setRecipe] = useState<BrewRecipe>(() => loadRecipes()[0] ?? defaultRecipe);
  const [recipes, setRecipes] = useState<BrewRecipe[]>(loadRecipes);
  const [brewLog, setBrewLog] = useState<BrewLogEntry[]>(loadBrewLog);
  const [tab, setTab] = useState<Tab>('Guide');
  const [status, setStatus] = useState<BrewStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [themePreference, setThemePreference] = useState<ThemePreference>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);
  const lastActiveStep = useRef(-1);
  const guidePanelRef = useRef<HTMLElement | null>(null);
  const playedWarningTicks = useRef<Set<string>>(new Set());

  const normalizedRecipe = useMemo(() => normalizeRecipe(recipe), [recipe]);
  const schedule = useMemo(() => buildSchedule(normalizedRecipe), [normalizedRecipe]);
  const activeIndex = useMemo(() => getActiveStepIndex(schedule, elapsed), [elapsed, schedule]);
  const activeStep = schedule[activeIndex] ?? schedule[0];
  const progress = Math.min(elapsed / normalizedRecipe.brewTime, 1);
  const isBrewing = status === 'brewing' || status === 'paused';
  const resolvedTheme = themePreference === 'system' ? systemTheme : themePreference;

  useEffect(() => {
    if (status !== 'brewing') return undefined;
    const id = window.setInterval(() => {
      setElapsed((value) => Math.min(value + 1, normalizedRecipe.brewTime));
    }, 1000);
    return () => window.clearInterval(id);
  }, [normalizedRecipe.brewTime, status]);

  useEffect(() => {
    if (status !== 'brewing') return;
    schedule.forEach((step) => {
      const secondsUntilStep = step.start - elapsed;
      if (secondsUntilStep >= 1 && secondsUntilStep <= 5) {
        const tickKey = `${step.id}-${secondsUntilStep}`;
        if (!playedWarningTicks.current.has(tickKey)) {
          playedWarningTicks.current.add(tickKey);
          playCue('tick', soundEnabled);
        }
      }
    });
    if (elapsed >= normalizedRecipe.brewTime) {
      setStatus('complete');
      playCue('complete', soundEnabled);
      setBrewLog((entries) => [
        {
          id: createId('log'),
          recipe: normalizedRecipe,
          date: new Date().toLocaleDateString(),
          completed: true,
          elapsed: normalizedRecipe.brewTime,
        },
        ...entries,
      ]);
      return;
    }
    if (activeIndex !== lastActiveStep.current) {
      lastActiveStep.current = activeIndex;
      playCue(activeIndex === 0 ? 'start' : 'pour', soundEnabled);
    }
  }, [activeIndex, elapsed, normalizedRecipe, schedule, soundEnabled, status]);

  useEffect(() => {
    playedWarningTicks.current.clear();
  }, [schedule]);

  useEffect(() => {
    saveRecipes(recipes);
  }, [recipes]);

  useEffect(() => {
    saveBrewLog(brewLog);
  }, [brewLog]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themePreference);
  }, [themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const cycleTheme = () => {
    setThemePreference((value) => (value === 'system' ? 'light' : value === 'light' ? 'dark' : 'system'));
  };

  const startBrew = () => {
    setElapsed(0);
    lastActiveStep.current = 0;
    playedWarningTicks.current.clear();
    setStatus('brewing');
    setTab('Guide');
    playCue('start', soundEnabled);
    window.requestAnimationFrame(() => {
      guidePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      guidePanelRef.current?.focus({ preventScroll: true });
    });
  };

  const pauseBrew = () => setStatus((value) => (value === 'paused' ? 'brewing' : 'paused'));

  const resetBrew = () => {
    setElapsed(0);
    lastActiveStep.current = -1;
    playedWarningTicks.current.clear();
    setStatus('idle');
  };

  const saveRecipe = () => {
    const saved = { ...normalizedRecipe, id: createId('recipe') };
    setRecipe(saved);
    setRecipes((items) => [saved, ...items.filter((item) => item.name !== saved.name)]);
  };

  const newRecipe = () => {
    const next = { ...defaultRecipe, id: createId('recipe'), name: `Recipe ${recipes.length + 1}` };
    setRecipe(next);
    setRecipes((items) => [next, ...items]);
    resetBrew();
  };

  const loadRecipe = (next: BrewRecipe) => {
    setRecipe(next);
    resetBrew();
  };

  const deleteRecipe = (id: string) => {
    const nextRecipes = recipes.filter((item) => item.id !== id);
    setRecipes(nextRecipes.length ? nextRecipes : seedRecipes);
    if (recipe.id === id) setRecipe(nextRecipes[0] ?? defaultRecipe);
  };

  const updateRecipe = (patch: Partial<BrewRecipe>) => setRecipe((value) => normalizeRecipe({ ...value, ...patch }));

  const updateNumber = (field: keyof BrewRecipe, value: number) => {
    setRecipe((current) => {
      if (field === 'coffee') return updateRecipeCoffee(current, value);
      if (field === 'water') return updateRecipeWater(current, value);
      if (field === 'ratio') return updateRecipeRatio(current, value);
      if (field === 'bloom') return normalizeRecipe({ ...current, bloom: value, bloomEdited: true });
      return normalizeRecipe({ ...current, [field]: value });
    });
  };

  const activeTarget = activeStep?.id === 'done' ? `${normalizedRecipe.water} g` : activeStep?.target;

  return (
    <div className="app" data-brew-active={isBrewing} data-theme={resolvedTheme}>
      <TopNav
        tab={tab}
        setTab={setTab}
        onStart={startBrew}
        status={status}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        themePreference={themePreference}
        onCycleTheme={cycleTheme}
      />
      <BrewProgressBar activeStep={activeStep} progress={progress} status={status} />

      <main className="workspace" aria-label="PourOver brewing workspace">
        <aside className="rail rail-left" aria-label="Recipe summary">
          <RecipeSummary recipe={normalizedRecipe} progress={progress} status={status} onEdit={() => setTab('Expert')} />
          <EquipmentPanel recipe={normalizedRecipe} />
          <NotesPanel notes={normalizedRecipe.notes} onNotesChange={(notes) => updateRecipe({ notes })} />
        </aside>

        <section className="guide-panel" aria-label="Brew guide" ref={guidePanelRef} tabIndex={-1}>
          {tab === 'Guide' ? (
            <>
              <TimerHero
                activeIndex={activeIndex}
                activeStep={activeStep}
                activeTarget={activeTarget}
                elapsed={elapsed}
                progress={progress}
                recipe={normalizedRecipe}
                status={status}
                onPause={pauseBrew}
                onReset={resetBrew}
                isBrewing={isBrewing}
              />
              <CurrentInstruction activeStep={activeStep} />
              <BrewTip />
            </>
          ) : (
            <ExpertMobile
              recipe={normalizedRecipe}
              updateNumber={updateNumber}
              updateRecipe={updateRecipe}
              onSave={saveRecipe}
            />
          )}
        </section>

        <aside className="rail rail-right" aria-label="Expert recipe controls">
          <ExpertControls
            recipe={normalizedRecipe}
            updateNumber={updateNumber}
            updateRecipe={updateRecipe}
            onReset={() => setRecipe(defaultRecipe)}
            onSave={saveRecipe}
          />
          <SavedRecipes
            activeId={normalizedRecipe.id}
            recipes={recipes}
            onLoad={loadRecipe}
            onDelete={deleteRecipe}
            onNew={newRecipe}
          />
          <BrewLog entries={brewLog} onClear={() => setBrewLog([])} />
        </aside>
      </main>

      <MobileBrewControls
        elapsed={elapsed}
        onPause={pauseBrew}
        onReset={resetBrew}
        onStart={startBrew}
        status={status}
      />
    </div>
  );
}

function TopNav({
  tab,
  setTab,
  onStart,
  status,
  soundEnabled,
  setSoundEnabled,
  themePreference,
  onCycleTheme,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  onStart: () => void;
  status: BrewStatus;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  themePreference: ThemePreference;
  onCycleTheme: () => void;
}) {
  const ThemeIcon = getThemeIcon(themePreference);

  return (
    <header className="top-nav">
      <a className="brand" href={import.meta.env.BASE_URL} aria-label="PourOver home">
        PourOver
      </a>
      <nav className="tabs" aria-label="Primary">
        {(['Guide', 'Expert'] as const).map((item) => (
          <button key={item} className={`tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>
      <div className="nav-actions">
        <button
          className="button secondary compact"
          onClick={onCycleTheme}
          aria-label={`Theme mode: ${getThemeLabel(themePreference)}`}
        >
          <ThemeIcon size={16} aria-hidden="true" />
          {getThemeLabel(themePreference)}
        </button>
        <button className="button secondary compact" onClick={() => setSoundEnabled(!soundEnabled)}>
          <Waves size={16} aria-hidden="true" />
          {soundEnabled ? 'Audio On' : 'Audio Off'}
        </button>
        <button className="button secondary compact">
          <BookOpen size={16} aria-hidden="true" />
          Brew Log
        </button>
        <button className="button primary nav-start" onClick={onStart}>
          {status === 'brewing' ? 'Restart Brew' : 'Start Brew'}
          <Play size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function BrewProgressBar({
  activeStep,
  progress,
  status,
}: {
  activeStep: ReturnType<typeof buildSchedule>[number];
  progress: number;
  status: BrewStatus;
}) {
  if (status !== 'brewing' && status !== 'paused') return null;

  return (
    <div className="brew-progress-sticky" aria-label={`Brew progress ${Math.round(progress * 100)} percent`}>
      <div className="brew-progress-meta">
        <span>{status === 'paused' ? 'Paused' : activeStep?.name ?? 'Brewing'}</span>
        <strong>{Math.round(progress * 100)}%</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function MobileBrewControls({
  elapsed,
  onPause,
  onReset,
  onStart,
  status,
}: {
  elapsed: number;
  onPause: () => void;
  onReset: () => void;
  onStart: () => void;
  status: BrewStatus;
}) {
  const isActive = status === 'brewing' || status === 'paused';
  const canReset = elapsed > 0 || status === 'brewing' || status === 'paused' || status === 'complete';

  return (
    <div className="mobile-brew-controls" aria-label="Brew controls">
      {isActive ? (
        <button className="button primary" onClick={onPause}>
          {status === 'paused' ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          {status === 'paused' ? 'Resume' : 'Pause'}
        </button>
      ) : (
        <button className="button primary" onClick={onStart}>
          <Play size={16} aria-hidden="true" />
          {status === 'complete' ? 'Restart Brew' : 'Start Brew'}
        </button>
      )}
      <button className="button secondary" onClick={onReset} disabled={!canReset}>
        <RotateCcw size={16} aria-hidden="true" />
        Reset
      </button>
    </div>
  );
}

function RecipeSummary({
  recipe,
  progress,
  status,
  onEdit,
}: {
  recipe: BrewRecipe;
  progress: number;
  status: BrewStatus;
  onEdit: () => void;
}) {
  const rows = [
    { icon: Coffee, label: 'Coffee', value: `${recipe.coffee.toFixed(1)} g` },
    { icon: Droplets, label: 'Water', value: `${recipe.water} g` },
    { icon: Settings2, label: 'Ratio', value: `1:${recipe.ratio.toFixed(1)}` },
    { icon: Gauge, label: 'Grind', value: recipe.grind },
    { icon: Clock3, label: 'Total Time', value: formatApproxTime(recipe.brewTime) },
    { icon: ListChecks, label: 'Pours', value: String(recipe.pours) },
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="label-muted">Current Recipe</p>
          <h2>{recipe.name}</h2>
        </div>
        <button className="button secondary small" onClick={onEdit}>
          Edit
        </button>
      </div>
      <dl className="summary-list">
        {rows.map(({ icon: Icon, label, value }) => (
          <div className="summary-row" key={label}>
            <dt>
              <Icon size={16} aria-hidden="true" />
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="progress-block">
        <div className="progress-label">
          <span>Progress</span>
          <span>{status === 'complete' ? 'Complete' : `${Math.round(progress * 100)}%`}</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </section>
  );
}

function EquipmentPanel({ recipe }: { recipe: BrewRecipe }) {
  return (
    <section className="panel">
      <h2>Equipment</h2>
      <ul className="equipment-list">
        {recipe.equipment.map((item) => (
          <li key={item}>
            <Beaker size={17} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotesPanel({ notes, onNotesChange }: { notes: string; onNotesChange: (value: string) => void }) {
  return (
    <section className="panel notes-panel">
      <h2>Notes</h2>
      <label className="sr-only" htmlFor="brew-notes">
        Notes
      </label>
      <textarea id="brew-notes" value={notes} onChange={(event) => onNotesChange(event.target.value)} />
    </section>
  );
}

function TimerHero({
  activeIndex,
  activeStep,
  activeTarget,
  elapsed,
  progress,
  recipe,
  status,
  onPause,
  onReset,
  isBrewing,
}: {
  activeIndex: number;
  activeStep: ReturnType<typeof buildSchedule>[number];
  activeTarget: string;
  elapsed: number;
  progress: number;
  recipe: BrewRecipe;
  status: BrewStatus;
  onPause: () => void;
  onReset: () => void;
  isBrewing: boolean;
}) {
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const nodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const timelineSteps = useMemo(() => buildSchedule(recipe), [recipe]);
  const [timelineMetrics, setTimelineMetrics] = useState({ cursorTop: 18, trackHeight: 0, trackTop: 18 });
  const stepLabel = activeStep?.id === 'bloom' ? 'First pour' : activeStep?.id === 'done' ? 'Drawdown' : 'Next pour';

  useLayoutEffect(() => {
    const calculateTimelineMetrics = () => {
      const timelineElement = timelineRef.current;
      if (!timelineElement || !timelineSteps.length) return;

      const timelineRect = timelineElement.getBoundingClientRect();
      const centers = timelineSteps.map((_, index) => {
        const nodeElement = nodeRefs.current[index];
        if (!nodeElement) return null;
        const nodeRect = nodeElement.getBoundingClientRect();
        return nodeRect.top + nodeRect.height / 2 - timelineRect.top;
      });

      if (centers.some((center) => center === null)) return;

      const measuredCenters = centers as number[];
      const firstCenter = measuredCenters[0];
      const lastCenter = measuredCenters[measuredCenters.length - 1];
      const safeElapsed = Math.min(Math.max(elapsed, 0), recipe.brewTime);
      let cursorTop = firstCenter;

      for (let index = 1; index < timelineSteps.length; index += 1) {
        const previousStep = timelineSteps[index - 1];
        const nextStep = timelineSteps[index];

        if (safeElapsed <= nextStep.start) {
          const segmentDuration = Math.max(nextStep.start - previousStep.start, 1);
          const segmentProgress = Math.min(Math.max((safeElapsed - previousStep.start) / segmentDuration, 0), 1);
          cursorTop =
            measuredCenters[index - 1] + (measuredCenters[index] - measuredCenters[index - 1]) * segmentProgress;
          break;
        }

        cursorTop = measuredCenters[index];
      }

      setTimelineMetrics((current) => {
        const next = {
          cursorTop,
          trackHeight: Math.max(lastCenter - firstCenter, 0),
          trackTop: firstCenter,
        };
        const unchanged =
          Math.abs(current.cursorTop - next.cursorTop) < 0.5 &&
          Math.abs(current.trackHeight - next.trackHeight) < 0.5 &&
          Math.abs(current.trackTop - next.trackTop) < 0.5;
        return unchanged ? current : next;
      });
    };

    calculateTimelineMetrics();
    window.addEventListener('resize', calculateTimelineMetrics);
    return () => window.removeEventListener('resize', calculateTimelineMetrics);
  }, [elapsed, recipe.brewTime, timelineSteps]);

  useEffect(() => {
    if (status !== 'brewing' && status !== 'paused') return;
    const activeStepElement = stepRefs.current[activeIndex];
    if (!activeStepElement) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeStepElement.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [activeIndex, status]);

  return (
    <section className="timer-hero">
      <div className="timer-sticky">
        <div className="step-label">
          <span className={`state-dot ${status}`} />
          <span>{activeStep?.name ?? 'Bloom'}</span>
          <span>·</span>
          <span>{stepLabel}</span>
        </div>

        <div className="timer-row">
          <div className="time-display">{formatTime(elapsed)}</div>
          <div className="timer-actions">
            <button className="icon-button" onClick={onPause} disabled={!isBrewing}>
              <Pause size={22} aria-hidden="true" />
              <span>{status === 'paused' ? 'Resume' : 'Pause'}</span>
            </button>
            <button className="icon-button" onClick={onReset}>
              <RotateCcw size={22} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="vertical-timeline" ref={timelineRef} aria-label={`Brew progress ${Math.round(progress * 100)} percent`}>
        <span
          className="vertical-timeline-track"
          style={{ height: timelineMetrics.trackHeight, top: timelineMetrics.trackTop }}
          aria-hidden="true"
        />
        <span
          className="vertical-timeline-fill"
          style={{ height: Math.max(timelineMetrics.cursorTop - timelineMetrics.trackTop, 0), top: timelineMetrics.trackTop }}
          aria-hidden="true"
        />
        <span className="vertical-timeline-cursor" style={{ top: timelineMetrics.cursorTop }} aria-hidden="true" />
        {timelineSteps.map((step, index) => {
          const stepStatus = getStepStatus(step, activeIndex, index, elapsed);
          return (
            <div
              className={`timeline-step ${stepStatus.toLowerCase().replace(' ', '-')}`}
              key={step.id}
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
            >
              <span
                className="timeline-node"
                ref={(element) => {
                  nodeRefs.current[index] = element;
                }}
              >
                {stepStatus === 'Complete' ? <Check size={14} aria-hidden="true" /> : index + 1}
              </span>
              <div className="timeline-step-card">
                <div>
                  <strong>{step.name}</strong>
                  <span>{step.id === 'done' ? formatApproxTime(recipe.brewTime) : formatTime(step.start)}</span>
                </div>
                <dl>
                  <div>
                    <dt>Pour</dt>
                    <dd>{step.pour ? `${step.pour} g` : '-'}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{step.cumulative} g</dd>
                  </div>
                  <div>
                    <dt>Target</dt>
                    <dd>{step.duration ? formatTime(step.duration) : '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          );
        })}
      </div>

      <div className="target-strip">
        <span>Target</span>
        <strong>{activeTarget}</strong>
        <span>Flow Rate</span>
        <strong>{recipe.flowRate.toFixed(1)} g/s</strong>
      </div>
    </section>
  );
}

function CurrentInstruction({ activeStep }: { activeStep: ReturnType<typeof buildSchedule>[number] }) {
  return (
    <section className="instruction-panel">
      <div className="instruction-icon">
        <Droplets size={26} aria-hidden="true" />
      </div>
      <div>
        <h2>{activeStep?.id === 'bloom' ? 'Start the bloom.' : activeStep?.id === 'done' ? 'Finish the brew.' : `${activeStep.name}.`}</h2>
        <p>{activeStep?.instruction}</p>
        <div className="metric-grid">
          <div>
            <Thermometer size={16} aria-hidden="true" />
            <span>Target</span>
            <strong>{activeStep?.target}</strong>
          </div>
          <div>
            <Clock3 size={16} aria-hidden="true" />
            <span>Target Time</span>
            <strong>{formatTime(activeStep?.duration ?? 0)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrewTip() {
  return (
    <div className="tip">
      <BadgeInfo size={16} aria-hidden="true" />
      <strong>Tip:</strong>
      <span>Keep your pour steady and consistent. Let the water drain down between pours.</span>
    </div>
  );
}

function ExpertControls({
  recipe,
  updateNumber,
  updateRecipe,
  onReset,
  onSave,
}: {
  recipe: BrewRecipe;
  updateNumber: (field: keyof BrewRecipe, value: number) => void;
  updateRecipe: (patch: Partial<BrewRecipe>) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <section className="panel controls-panel">
      <div className="section-header">
        <h2>Adjust Recipe</h2>
        <button className="button secondary small" onClick={onReset}>
          <TimerReset size={14} aria-hidden="true" />
          Reset
        </button>
      </div>
      <NumberField icon={Coffee} label="Coffee" value={recipe.coffee} suffix="g" step={0.5} onChange={(value) => updateNumber('coffee', value)} />
      <NumberField icon={Droplets} label="Water" value={recipe.water} suffix="g" step={5} onChange={(value) => updateNumber('water', value)} />
      <NumberField icon={Settings2} label="Ratio" value={recipe.ratio} prefix="1:" step={0.1} onChange={(value) => updateNumber('ratio', value)} />
      <div className="control-row slider-row">
        <label>
          <Gauge size={16} aria-hidden="true" />
          Grind
        </label>
        <select value={recipe.grind} onChange={(event) => updateRecipe({ grind: event.target.value as GrindSize })}>
          {grindOptions.map((grind) => (
            <option value={grind} key={grind}>
              {grind}
            </option>
          ))}
        </select>
        <input
          aria-label="Grind size"
          type="range"
          min="0"
          max={grindOptions.length - 1}
          value={grindOptions.indexOf(recipe.grind)}
          onChange={(event) => updateRecipe({ grind: grindOptions[Number(event.target.value)] })}
        />
        <div className="range-labels">
          <span>Fine</span>
          <span>Medium</span>
          <span>Coarse</span>
        </div>
      </div>
      <NumberField icon={TimerReset} label="Bloom" value={recipe.bloom} suffix="g" step={1} onChange={(value) => updateNumber('bloom', value)} />
      <SegmentedControl
        label="Pours"
        value={recipe.pours}
        values={[3, 4, 5]}
        onChange={(value) => updateNumber('pours', value)}
      />
      <NumberField icon={Clock3} label="Brew Time" value={recipe.brewTime} suffix="s" step={5} onChange={(value) => updateNumber('brewTime', value)} />
      <NumberField icon={SlidersHorizontal} label="Flow Rate" value={recipe.flowRate} suffix="g/s" step={0.1} onChange={(value) => updateNumber('flowRate', value)} />
      <NumberField icon={Thermometer} label="Temperature" value={recipe.temperature} suffix="°C" step={1} onChange={(value) => updateNumber('temperature', value)} />
      <div className="control-row">
        <label htmlFor="agitation">
          <Waves size={16} aria-hidden="true" />
          Agitation
        </label>
        <div className="select-wrap">
          <select id="agitation" value={recipe.agitation} onChange={(event) => updateRecipe({ agitation: event.target.value })}>
            {agitationOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
      </div>
      <div className="control-footer">
        <button className="button primary wide" onClick={onSave}>
          <Save size={16} aria-hidden="true" />
          Save Recipe
        </button>
      </div>
    </section>
  );
}

function NumberField({
  icon: Icon,
  label,
  value,
  suffix,
  prefix,
  step,
  onChange,
}: {
  icon: typeof Coffee;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="control-row">
      <label htmlFor={label}>
        <Icon size={16} aria-hidden="true" />
        {label}
      </label>
      <div className="number-wrap">
        {prefix ? <span>{prefix}</span> : null}
        <input
          id={label}
          type="number"
          value={value}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <span>{suffix}</span> : null}
      </div>
    </div>
  );
}

function SegmentedControl({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: number;
  values: number[];
  onChange: (value: number) => void;
}) {
  return (
    <div className="control-row">
      <label>
        <Droplets size={16} aria-hidden="true" />
        {label}
      </label>
      <div className="segmented" role="group" aria-label={label}>
        {values.map((item) => (
          <button className={value === item ? 'selected' : ''} key={item} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function SavedRecipes({
  activeId,
  recipes,
  onLoad,
  onDelete,
  onNew,
}: {
  activeId: string;
  recipes: BrewRecipe[];
  onLoad: (recipe: BrewRecipe) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <section className="panel saved-panel">
      <div className="section-header">
        <h2>Saved Recipes</h2>
        <button className="button secondary small">Manage</button>
      </div>
      <ul className="recipe-list">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <button onClick={() => onLoad(recipe)}>
              <strong>{recipe.name}</strong>
              <span>
                1:{recipe.ratio.toFixed(0)} · {recipe.coffee.toFixed(0)} g / {recipe.water} g · {formatTime(recipe.brewTime)}
              </span>
            </button>
            {activeId === recipe.id ? <span className="active-pill">Active</span> : null}
            <button className="ghost-icon" onClick={() => onDelete(recipe.id)} aria-label={`Delete ${recipe.name}`}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button className="link-button" onClick={onNew}>
        <Plus size={16} aria-hidden="true" />
        New Recipe
      </button>
    </section>
  );
}

function BrewLog({ entries, onClear }: { entries: BrewLogEntry[]; onClear: () => void }) {
  return (
    <section className="panel log-panel">
      <div className="section-header">
        <h2>Brew Log</h2>
        <button className="button secondary small" onClick={onClear} disabled={!entries.length}>
          Clear Log
        </button>
      </div>
      {entries.length ? (
        <ul className="log-list">
          {entries.slice(0, 4).map((entry) => (
            <li key={entry.id}>
              <span>{entry.recipe.name}</span>
              <strong>{entry.completed ? 'Complete' : 'Stopped'}</strong>
              <small>
                {entry.date} · {formatTime(entry.elapsed)}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">No brews logged yet. Start Brew to create one.</p>
      )}
    </section>
  );
}

function ExpertMobile({
  recipe,
  updateNumber,
  updateRecipe,
  onSave,
}: {
  recipe: BrewRecipe;
  updateNumber: (field: keyof BrewRecipe, value: number) => void;
  updateRecipe: (patch: Partial<BrewRecipe>) => void;
  onSave: () => void;
}) {
  return (
    <div className="expert-mobile">
      <ExpertControls
        recipe={recipe}
        updateNumber={updateNumber}
        updateRecipe={updateRecipe}
        onReset={() => updateRecipe(defaultRecipe)}
        onSave={onSave}
      />
      <button className="button primary wide" onClick={onSave}>
        <Save size={16} aria-hidden="true" />
        Save Recipe
      </button>
    </div>
  );
}
