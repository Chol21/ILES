import { useState, useEffect } from 'react';
import api from '../api/axios';

const EvaluationResults = ({ placementId }) => {
  const [overall, setOverall] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placementId) { setLoading(false); return; }
    fetchResults();
  }, [placementId]);

  const fetchResults = async () => {
    try {
      const [overallRes, evalsRes] = await Promise.all([
        api.get('/overall-evaluations/'),
        api.get(`/evaluations/?placement=${placementId}`),
      ]);
      setOverall(overallRes.data.find(o => o.placement === placementId) || null);
      setEvaluations(evalsRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const getGradeStyle = (grade) => {
    const styles = {
      A: 'bg-green-100 text-green-700 border-green-200',
      B: 'bg-blue-100 text-blue-700 border-blue-200',
      C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      D: 'bg-orange-100 text-orange-700 border-orange-200',
      F: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[grade] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) return null;

  if (!overall) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        No evaluation results yet. Your supervisor will evaluate you at the end of your internship.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Overall Score */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="text-center">
          <p className="text-4xl font-bold text-indigo-700">{overall.total_score}</p>
          <p className="text-xs text-gray-400 mt-1">Total Score / 100</p>
        </div>
        <div className={`px-6 py-3 rounded-xl border text-center font-bold text-3xl ${getGradeStyle(overall.grade)}`}>
          {overall.grade}
          <p className="text-sm font-normal mt-0.5">
            {overall.grade === 'A' ? 'Distinction' :
             overall.grade === 'B' ? 'Merit' :
             overall.grade === 'C' ? 'Pass' :
             overall.grade === 'D' ? 'Borderline' : 'Fail'}
          </p>
        </div>
        <div className="flex-1 text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Evaluated on:</p>
          <p>{new Date(overall.evaluated_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      {evaluations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3 text-sm">Score Breakdown</h4>
          <div className="space-y-3">
            {evaluations.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-40">{ev.criteria_name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full"
                    style={{ width: `${ev.score}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                  {ev.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationResults;