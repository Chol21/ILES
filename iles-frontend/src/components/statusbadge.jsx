// src/components/StatusBadge.jsx
// A reusable coloured pill that shows a log's current status.
// Usage: <StatusBadge status={log.status} />
const STATUS_STYLES = {
draft: 'bg-gray-100 text-gray-600 border-gray-200',
submitted: 'bg-blue-100 text-blue-700 border-blue-200',
approved: 'bg-green-100 text-green-700 border-green-200',
rejected: 'bg-red-100 text-red-600 border-red-200',
};
const STATUS_LABELS = {
draft: 'Draft',
submitted: 'Submitted',
approved: 'Approved',
rejected: 'Rejected',
};
// status: one of 'draft' | 'submitted' | 'approved' | 'rejected'
const StatusBadge = ({ status }) => {
const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
const label = STATUS_LABELS[status] || status;
return (
<span
className={`
inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}
`}
>
{label}
</span>
);
};
export default StatusBadge;
