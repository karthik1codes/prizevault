type YCBadgeProps = {
  className?: string
  href?: string
}

export default function YCBadge({
  className = '',
  href = 'https://www.ycombinator.com/',
}: YCBadgeProps) {
  return (
    <a
      className={['pv-yc-badge', className].filter(Boolean).join(' ')}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Backed by Y Combinator"
    >
      <span className="pv-yc-badge__mark" aria-hidden>
        <span className="pv-yc-badge__y">Y</span>
      </span>
      <span className="pv-yc-badge__text">Backed by Y Combinator</span>
    </a>
  )
}
