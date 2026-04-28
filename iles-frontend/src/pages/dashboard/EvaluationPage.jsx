import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const EvaluationPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [placements, setPlacements] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [existingEvals, setExistingEvals] = useState([]);
  const [overallEval, setOverallEval] = useState(null);
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [placementsRes, criteriaRes] = await Promise.all([
        api.get('/placements/'),
        api.get('/evaluation-criteria/'),
      ]);
      setPlacements(placementsRes.data);
      setCriteria(criteriaRes.data.filter(c => c.is_active));
    } catch {
      toast.error('Failed to load evaluation data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlacement = async (placement) => {
    setSelectedPlacement(placement);
    setScores({});
    setOverallEval(null);
    try {
      const [evalsRes, overallRes] = await Promise.all([
        api.get(`/evaluations/?placement=${placement.id}`),
        api.get(`/overall-evaluations/`),
      ]);
      const placementEvals = evalsRes.data.filter(e => e.placement === placement.id);
      setExistingEvals(placementEvals);

      // Pre-fill scores from existing evaluations
      const scoreMap = {};
      placementEvals.forEach(e => { scoreMap[e.criteria] = e.score; });
      setScores(scoreMap);

      const overall = overallRes.data.find(o => o.placement === placement.id);
      setOverallEval(overall || null);
    } catch {
      toast.error('Failed to load existing evaluations.');
    }
  };

  const handleScoreChange = (criteriaId, value) => {
    const num = parseFloat(value);
    if (value === '' || (num >= 0 && num <= 100)) {
      setScores({ ...scores, [criteriaId]: value });
    }
  };

  const calculatePreview = () => {
    let total = 0;
    let complete = true;
    criteria.forEach(c => {
      const score = parseFloat(scores[c.id]);
      if (isNaN(score)) { complete = false; return; }
      total += score * parseFloat(c.weight);
    });
    return { total: complete ? total.toFixed(2) : null, complete };
  };

  const getGrade = (score) => {
    if (score >= 80) return { grade: 'A', label: 'Distinction', color: 'text-green-700 bg-green-100' };
    if (score >= 70) return { grade: 'B', label: 'Merit', color: 'text-blue-700 bg-blue-100' };
    if (score >= 60) return { grade: 'C', label: 'Pass', color: 'text-yellow-700 bg-yellow-100' };
    if (score >= 50) return { grade: 'D', label: 'Borderline', color: 'text-orange-700 bg-orange-100' };
    return { grade: 'F', label: 'Fail', color: 'text-red-700 bg-red-100' };
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedPlacement) return;
    const { complete } = calculatePreview();
    if (!complete) {
      toast.error('Please enter scores for all criteria before submitting.');
      return;
    }
    for (const c of criteria) {
      const score = parseFloat(scores[c.id]);
      if (score < 0 || score > 100) {
        toast.error(`Score for ${c.name} must be between 0 and 100.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      // Submit or update each evaluation
      for (const c of criteria) {
        const existing = existingEvals.find(e => e.criteria === c.id);
        const payload = {
          placement: selectedPlacement.id,
          criteria: c.id,
          score: parseFloat(scores[c.id]),
          evaluated_by: user.id,
        };
        if (existing) {
          await api.patch(`/evaluations/${existing.id}/`, payload);
        } else {
          await api.post('/evaluations/', payload);
        }
      }

      // Calculate overall score
      const { total } = calculatePreview();
      const { grade } = getGrade(parseFloat(total));

      const existingOverall = overallEval;
      if (existingOverall) {
        await api.patch(`/overall-evaluations/${existingOverall.id}/`, {
          placement: selectedPlacement.id,
          total_score: total,
          grade,
        });
      } else {
        await api.post('/overall-evaluations/', {
          placement: selectedPlacement.id,
          total_score: total,
          grade,
        });
      }

      toast.success(`Evaluation submitted! Final score: ${total} — Grade: ${grade}`);
      handleSelectPlacement(selectedPlacement);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.values(errors).forEach(msg => toast.error(String(msg)));
      else toast.error('Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const { total, complete } = calculatePreview();
  const gradeInfo = total ? getGrade(parseFloat(total)) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-xl font-bold">ILES</h1>
          <p className="text-indigo-200 text-xs">Evaluation Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/supervisor')}
            className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            ← Back
          </button>
          <span className="text-sm">{user?.first_name} {user?.last_name}</span>
          <button
            onClick={logout}
            className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Student Evaluations</h2>
          <p className="text-gray-500 text-sm mt-1">
            Score students using weighted criteria — Technical 40%, Communication 30%, Professionalism 30%
          </p>
        </div>

        {/* Placement Selection */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Select Student Placement</h3>
          {placements.length === 0 ? (
            <p className="text-gray-400 text-sm">No placements found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {placements.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlacement(p)}
                  className={`text-left p-4 rounded-lg border-2 transition ${
                    selectedPlacement?.id === p.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{p.student_name}</p>
                  <p className="text-sm text-gray-500">{p.company_name}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.start_date} → {p.end_date}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Evaluation Form */}
        {selectedPlacement && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-1">
              Evaluating: <span className="text-indigo-600">{selectedPlacement.student_name}</span>
            </h3>
            <p className="text-sm text-gray-400 mb-5">{selectedPlacement.company_name}</p>

            {/* Criteria Scores */}
            <div className="space-y-5 mb-6">
              {criteria.map(c => (
                <div key={c.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                      Weight: {(parseFloat(c.weight) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scores[c.id] || ''}
                      onChange={(e) => handleScoreChange(c.id, e.target.value)}
                      placeholder="0 – 100"
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-400 text-sm">/ 100</span>
                    {scores[c.id] !== undefined && scores[c.id] !== '' && (
                      <span className="text-indigo-600 text-sm font-medium">
                        Weighted: {(parseFloat(scores[c.id]) * parseFloat(c.weight)).toFixed(2)} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Score Preview */}
            {complete && gradeInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
                <h4 className="font-semibold text-gray-700 mb-3">Score Preview</h4>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-indigo-700">{total}</p>
                    <p className="text-xs text-gray-400 mt-1">Total Score / 100</p>
                  </div>
                  <div className={`px-6 py-3 rounded-xl font-bold text-2xl ${gradeInfo.color}`}>
                    {gradeInfo.grade}
                    <p className="text-sm font-normal mt-0.5">{gradeInfo.label}</p>
                  </div>
                  <div className="flex-1 text-sm text-gray-500 space-y-1">
                    {criteria.map(c => (
                      <div key={c.id} className="flex justify-between">
                        <span>{c.name} ({(parseFloat(c.weight) * 100).toFixed(0)}%)</span>
                        <span className="font-medium text-gray-700">
                          {scores[c.id] || 0} × {c.weight} = {(parseFloat(scores[c.id] || 0) * parseFloat(c.weight)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Existing Overall Result */}
            {overallEval && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm">
                <p className="font-semibold text-green-700">Previous Evaluation on Record</p>
                <p className="text-green-600 mt-1">
                  Score: {overallEval.total_score} — Grade: {overallEval.grade} — Evaluated: {new Date(overallEval.evaluated_at).toLocaleDateString()}
                </p>
              </div>
            )}

            <button
              onClick={handleSubmitEvaluation}
              disabled={submitting || !complete}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : overallEval ? 'Update Evaluation' : 'Submit Final Evaluation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationPage;