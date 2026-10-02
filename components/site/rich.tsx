import { Fragment } from 'react'

/**
 * Renderiza texto editável: quebras de linha viram <br>, *trechos* viram destaque.
 * `accent` é a classe do destaque (ex.: 'text-gold' ou 'text-gold italic').
 */
export function Rich({ text, accent = 'text-gold', base }: { text: string; accent?: string; base?: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*[^*]+\*)/g).map((part, j) =>
            part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
              <span key={j} className={accent}>
                {part.slice(1, -1)}
              </span>
            ) : part ? (
              base ? (
                <span key={j} className={base}>
                  {part}
                </span>
              ) : (
                <Fragment key={j}>{part}</Fragment>
              )
            ) : null,
          )}
        </Fragment>
      ))}
    </>
  )
}
