export default function StatsCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 bg-surface rounded-md shadow">
      <div className="text-sm text-muted">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}

