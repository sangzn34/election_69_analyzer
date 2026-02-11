import type { Summary } from '../types'

interface Props {
  summary: Summary
}

export default function SummaryCards({ summary }: Props) {
  return (
    <div className="summary-grid">
      <div className="summary-card">
        <div className="value">{summary.totalAreas}</div>
        <div className="label">จำนวนเขตทั้งหมด</div>
      </div>
      <div className="summary-card">
        <div className="value danger">{summary.totalSuspicious}</div>
        <div className="label">เขตที่น่าสงสัย</div>
      </div>
      <div className="summary-card">
        <div className="value danger">{summary.suspiciousPercent}%</div>
        <div className="label">อัตราความน่าสงสัย</div>
      </div>
      <div className="summary-card">
        <div className="value success">{summary.totalAreas - summary.totalSuspicious}</div>
        <div className="label">เขตปกติ</div>
      </div>
    </div>
  )
}
