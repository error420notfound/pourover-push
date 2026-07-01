import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeInfo,
  Beaker,
  BookOpen,
  Check,
  ChevronDown,
  Circle,
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
  Table2,
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

const CONCEPT_PATH =
  '/Users/hs108/.codex/generated_images/019f1d15-1d14-7d91-b8dc-20abb0f38983/ig_0fbadc90bdcd76e7016a44e47478a081948b13f8b30e257b00.png';

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
  }, [activeIndex, elapsed, normalizedRecipe, soundEnabled, status]);

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
    lastActiveStep.current = -1;
    setStatus('brewing');
    setTab('Guide');
    playCue('start', soundEnabled);
  };

  const pauseBrew = () => setStatus((value) => (value === 'paused' ? 'brewing' : 'paused'));

  const resetBrew = () => {
    setElapsed(0);
    lastActiveStep.current = -1;
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
    <div className="app" data-theme={resolvedTheme}>
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

      <main className="workspace" aria-label="PourOver brewing workspace">
        <aside className="rail rail-left" aria-label="Recipe summary">
          <RecipeSummary recipe={normalizedRecipe} progress={progress} status={status} onEdit={() => setTab('Expert')} />
          <EquipmentPanel recipe={normalizedRecipe} />
          <NotesPanel notes={normalizedRecipe.notes} onNotesChange={(notes) => updateRecipe({ notes })} />
        </aside>

        <section className="guide-panel" aria-label="Brew guide">
          {tab === 'Guide' ? (
            <>
              <TimerHero
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
              <PourTimeline elapsed={elapsed} recipe={normalizedRecipe} schedule={schedule} activeIndex={activeIndex} />
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

      <span className="sr-only">Accepted visual concept: {CONCEPT_PATH}</span>
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
      <a className="brand" href="/" aria-label="PourOver home">
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
        <button className="button primary" onClick={onStart}>
          {status === 'brewing' ? 'Restart Brew' : 'Start Brew'}
          <Play size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
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
  return (
    <section className="timer-hero">
      <div className="step-label">
        <span className={`state-dot ${status}`} />
        <span>{activeStep?.name ?? 'Bloom'}</span>
        <span>·</span>
        <span>{activeStep?.id === 'bloom' ? 'First pour' : activeStep?.id === 'done' ? 'Drawdown' : 'Next pour'}</span>
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

      <div className="timeline-ruler" aria-label={`Brew progress ${Math.round(progress * 100)} percent`}>
        <span className="timeline-fill" style={{ width: `${progress * 100}%` }} />
        {buildSchedule(recipe).map((step) => (
          <span
            className={`timeline-marker ${elapsed >= step.start ? 'passed' : ''}`}
            key={step.id}
            style={{ left: `${Math.min((step.start / recipe.brewTime) * 100, 100)}%` }}
          />
        ))}
      </div>

      <div className="timeline-labels">
        {buildSchedule(recipe).map((step) => (
          <div key={step.id}>
            <strong>{step.name}</strong>
            <span>{formatTime(step.start)}</span>
            <span>{step.id === 'done' ? `${step.cumulative} g` : `${step.pour} g`}</span>
          </div>
        ))}
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

function PourTimeline({
  elapsed,
  recipe,
  schedule,
  activeIndex,
}: {
  elapsed: number;
  recipe: BrewRecipe;
  schedule: ReturnType<typeof buildSchedule>;
  activeIndex: number;
}) {
  return (
    <section className="table-panel">
      <div className="section-header">
        <h2>Pour Timeline</h2>
        <button className="button secondary small">
          <Table2 size={14} aria-hidden="true" />
          View as Table
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>Time</th>
              <th>Pour</th>
              <th>Total</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((step, index) => {
              const status = getStepStatus(step, activeIndex, index, elapsed);
              return (
                <tr key={step.id}>
                  <td>
                    <span className={`step-index ${status === 'Complete' ? 'done' : ''}`}>
                      {step.id === 'done' ? <Check size={14} aria-hidden="true" /> : index + 1}
                    </span>
                    {step.name}
                  </td>
                  <td>{step.id === 'done' ? formatApproxTime(recipe.brewTime) : formatTime(step.start)}</td>
                  <td>{step.pour ? `${step.pour} g` : '-'}</td>
                  <td>{step.cumulative} g</td>
                  <td>{step.duration ? formatTime(step.duration) : '-'}</td>
                  <td>
                    <span className={`status ${status.toLowerCase().replace(' ', '-')}`}>
                      <Circle size={8} aria-hidden="true" />
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
