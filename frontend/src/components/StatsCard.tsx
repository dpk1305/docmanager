import { ReactNode } from 'react'

export default function StatsCard({ title, value, icon }: { title: string; value: string | number; icon?: ReactNode }) {
  return (
    <div className="kpi">
      {icon ? <div className="kpi-icon">{icon}</div> : null}
      <div>
        <div className="kpi-title text-sm">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  )
}
