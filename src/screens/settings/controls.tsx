import type { ComponentChildren } from 'preact';

/** Linha de configuração: nome, explicação curta e o controle à direita. `data-name` serve à busca (realce da linha achada). */
export function Row({ name, desc, children }: { name: string; desc?: string; children: ComponentChildren }) {
  return (
    <div class="rlc-st-line" data-name={name}>
      <div class="rlc-st-line-text">
        <b>{name}</b>
        {desc ? <span>{desc}</span> : null}
      </div>
      <div class="rlc-st-line-ctl">{children}</div>
    </div>
  );
}

/** Interruptor: caixa de seleção nativa com cara de chave (teclado e leitor de tela de graça). */
export function Switch({ label, checked, onChange, dataKey }: { label: string; checked: boolean; onChange: (on: boolean, el: HTMLInputElement) => void; dataKey?: string }) {
  return <input type="checkbox" role="switch" class="rlc-st-switch" aria-label={label} data-key={dataKey} checked={checked} onChange={(e) => onChange(e.currentTarget.checked, e.currentTarget)} />;
}

/** Botões segmentados para poucas opções. */
export function Seg<T extends string | number>({ label, value, options, onPick, dataKey }: { label: string; value: T; options: Array<[T, string]>; onPick: (v: T) => void; dataKey?: string }) {
  return (
    <div class="rlc-st-seg" role="group" aria-label={label} data-key={dataKey}>
      {options.map(([v, text]) => (
        <button type="button" key={String(v)} aria-pressed={v === value} onClick={() => v !== value && onPick(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

/** Controle deslizante com o valor ao lado. `onInput` muda ao vivo; `onChange` só ao soltar (para gravações caras). */
export function Range(props: { label: string; value: number; min: number; max: number; step: number; text: string; dataKey?: string; onInput?: (v: number) => void; onChange?: (v: number, el: HTMLInputElement) => void }) {
  return (
    <span class="rlc-st-range">
      <input
        type="range"
        aria-label={props.label}
        data-key={props.dataKey}
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={props.onInput ? (e) => props.onInput!(Number(e.currentTarget.value)) : undefined}
        onChange={props.onChange ? (e) => props.onChange!(Number(e.currentTarget.value), e.currentTarget) : undefined}
      />
      <output>{props.text}</output>
    </span>
  );
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
