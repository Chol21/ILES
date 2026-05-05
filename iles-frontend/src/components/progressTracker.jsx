import React from 'react';

// Props:
// logs      - array of log objects from the API
// placement - the student's placement object (needs start_date, end_date)

const ProgressTracker = ({ logs, placement }) => {
  if (!placement) return null;

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const start = new Date(placement.start_date);
  const end = new Date(placement.end_date);
  const today = new Date();

  // Total weeks in the entire placement
  const totalWeeks = Math.ceil((end - start) / MS_PER_WEEK);

  // Weeks that have passed so far (capped so it never exceeds totalWeeks)
  const elapsed = Math.min(
    Math.ceil((today - start) / MS_PER_WEEK),
    totalWeeks
  );

  // Count logs by status
  const byStatus = (s) => logs.filter((l) => l.status === s).length;
  const approved = byStatus('approved');
  const submitted = byStatus('submitted');
  const rejected = byStatus('rejected');
  const drafts = byStatus('draft');

  // What % of elapsed weeks have a log (any status counts)
  const pct = elapsed > 0 
    ? Math.min(Math.round((logs.length / elapsed) * 100), 100) 
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Internship Progress</h3>

      {/* Progress bar */}
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{logs.length} of {elapsed} expected logs submitted</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
        <div
          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Status breakdown */}
      <div className="flex flex-wrap gap-3 text-xs">
        <Pill count={approved} label="Approved" color="green" />
        <Pill count={submitted} label="Submitted" color="blue" />
        <Pill count={rejected} label="Rejected" color="red" />
        <Pill count={drafts} label="Draft" color="gray" />
        <span className="ml-auto text-gray-400 self-center">
          {totalWeeks} total weeks
        </span>
      </div>
    </div>
  );
};

// Small helper - coloured count pill
const COLOR = {
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-600',
  gray: 'bg-gray-100 text-gray-600',
};

const Pill = ({ count, label, color }) => (
  <span className={`px-3 py-1 rounded-full font-semibold ${COLOR[color]}`}>
    {count} {label}
  </span>
);

export default ProgressTracker;