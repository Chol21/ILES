import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const theme = {
  bg: '#0f1117', surface: '#1a1f2e', border: '#2a2f3e',
  text: '#f1f5f9', muted: '#64748b', subtle: '#94a3b8',
  primary: '#6366f1', primaryLight: '#818cf8',
  success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
  font: "'Georgia', serif",
};
const card = { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' };

export default function EvaluationPage() {
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
    Promise.all([api.get('/placements/'), api.get('/evaluation-criteria/')])
      .then(([p, c]) => { setPlacements(p.data); setCriteria(c.data.filter(x => x.is_active)); })
      .catch(() => toast.error('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlacement = async (p) => {
    setSelectedPlacement(p); setScores({}); setOverallEval(null);
    try {
      const [evalsRes, overallRes] = await Promise.all([
        api.get(`/evaluations/?placement=${p.id}`),
        api.get('/overall-evaluations/'),
      ]);
      const evals = evalsRes.data.filter(e => e.placement === p.id);
      setExistingEvals(evals);
      const scoreMap = {};
      evals.forEach(e => { scoreMap[e.criteria] = e.score; });
      setScores(scoreMap);
      setOverallEval(overallRes.data.find(o => o.placement === p.id) || null);
    } catch { toast.error('Failed to load evaluations.'); }
  };

  const calculatePreview = () => {
    let total = 0; let complete = true;
    criteria.forEach(c => {
      const score = parseFloat(scores[c.id]);
      if (isNaN(score)) { complete = false; return; }
      total += score * parseFloat(c.weight);
    });
    return { total: complete ? total.toFixed(2) : null, complete };
  };

  const getGrade = (score) => {
    if (score >= 80) return { grade: 'A', label: 'Distinction', color: theme.success };
    if (score >= 70) return { grade: 'B', label: 'Merit', color: theme.primary };
    if (score >= 60) return { grade: 'C', label: 'Pass', color: theme.warning };
    if (score >= 50) return { grade: 'D', label: 'Borderline', color: '#f97316' };
    return { grade: 'F', label: 'Fail', color: theme.danger };
  };

  const handleSubmit = async () => {
    if (!selectedPlacement) return;
    const { complete } = calculatePreview();
    if (!complete) { toast.error('Please enter scores for all criteria.'); return; }
    setSubmitting(true);
    try {
      for (const c of criteria) {
        const existing = existingEvals.find(e => e.criteria === c.id);
        const payload = { placement: selectedPlacement.id, criteria: c.id, score: parseFloat(scores[c.id]), evaluated_by: user.id };
        if (existing) await api.patch(`/evaluations/${existing.id}/`, payload);
        else await api.post('/evaluations/', payload);
      }
      const { total } = calculatePreview();
      const { grade } = getGrade(parseFloat(total));
      if (overallEval) await api.patch(`/overall-evaluations/${overallEval.id}/`, { placement: selectedPlacement.id, total_score: total, grade });
      else await api.post('/overall-evaluations/', { placement: selectedPlacement.id, total_score: total, grade });
      toast.success(`Evaluation submitted! Score: ${total} — Grade: ${grade}`);
      handleSelectPlacement(selectedPlacement);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.values(errors).forEach(msg => toast.error(String(msg)));
      else toast.error('Failed to submit evaluation.');
    } finally { setSubmitting(false); }
  };

  const { total, complete } = calculatePreview();
  const gradeInfo = total ? getGrade(parseFloat(total)) : null;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.font }}>
      <div style={{ color: theme.muted }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: theme.font }}>

      {/* Navbar */}
      <nav style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: 'white' }}>I</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: theme.text }}>ILES</div>
            <div style={{ fontSize: '10px', color: theme.muted, letterSpacing: '1px' }}>EVALUATION PORTAL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/supervisor')} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '13px', cursor: 'pointer', fontFamily: theme.font }}>
            ← Back
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '11px', color: theme.muted }}>{user?.role === 'workplace' ? 'Workplace Supervisor' : 'Supervisor'}</div>
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '13px', cursor: 'pointer', fontFamily: theme.font }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>Student Evaluations</h1>
          <p style={{ color: theme.muted, fontSize: '14px' }}>
            Score students using weighted criteria — Technical 40% · Communication 30% · Professionalism 30%
          </p>
        </div>

        {/* Placement Selection */}
        <div style={{ ...card, marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '1px', marginBottom: '16px' }}>SELECT STUDENT PLACEMENT</div>
          {placements.length === 0 ? (
            <p style={{ color: theme.muted, fontSize: '14px' }}>No placements found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {placements.map(p => (
                <button key={p.id} onClick={() => handleSelectPlacement(p)} style={{
                  textAlign: 'left', padding: '16px', borderRadius: '10px', cursor: 'pointer', fontFamily: theme.font,
                  background: selectedPlacement?.id === p.id ? 'rgba(99,102,241,0.15)' : '#0f1117',
                  border: `1px solid ${selectedPlacement?.id === p.id ? theme.primary : theme.border}`,
                  transition: 'all 0.2s'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: theme.text, marginBottom: '4px' }}>{p.student_name}</div>
                  <div style={{ fontSize: '13px', color: theme.muted, marginBottom: '4px' }}>{p.company_name}</div>
                  <div style={{ fontSize: '11px', color: theme.border }}>{p.start_date} → {p.end_date}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Evaluation Form */}
        {selectedPlacement && (
          <div style={card}>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '1px', marginBottom: '4px' }}>EVALUATING</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: theme.text }}>{selectedPlacement.student_name}</div>
              <div style={{ fontSize: '13px', color: theme.muted }}>{selectedPlacement.company_name}</div>
            </div>

            {/* Criteria */}
            <div style={{ marginBottom: '24px' }}>
              {criteria.map((c, i) => (
                <div key={c.id} style={{ marginBottom: i < criteria.length - 1 ? '20px' : 0, padding: '16px', background: '#0f1117', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '2px' }}>{c.name}</div>
                      {c.description && <div style={{ fontSize: '12px', color: theme.muted }}>{c.description}</div>}
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: theme.primary, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {(parseFloat(c.weight) * 100).toFixed(0)}% weight
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="number" min="0" max="100"
                      value={scores[c.id] || ''}
                      onChange={e => {
                        const v = e.target.value;
                        if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 100)) setScores({ ...scores, [c.id]: v });
                      }}
                      placeholder="0 – 100"
                      style={{ width: '100px', padding: '10px 12px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', outline: 'none', fontFamily: theme.font }}
                    />
                    <span style={{ color: theme.muted, fontSize: '13px' }}>/ 100</span>
                    {scores[c.id] !== undefined && scores[c.id] !== '' && (
                      <span style={{ color: theme.primaryLight, fontSize: '13px', fontWeight: '600' }}>
                        Weighted: {(parseFloat(scores[c.id]) * parseFloat(c.weight)).toFixed(2)} pts
                      </span>
                    )}
                    {scores[c.id] !== undefined && scores[c.id] !== '' && (
                      <div style={{ flex: 1, height: '4px', background: theme.border, borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${scores[c.id]}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight})`, borderRadius: '10px', transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Score Preview */}
            {complete && gradeInfo && (
              <div style={{ padding: '20px', background: '#0f1117', borderRadius: '12px', border: `1px solid ${gradeInfo.color}30`, marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '1px', marginBottom: '16px' }}>SCORE PREVIEW</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: '800', color: theme.primary }}>{total}</div>
                    <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '0.5px' }}>TOTAL / 100</div>
                  </div>
                  <div style={{ padding: '16px 24px', borderRadius: '12px', border: `2px solid ${gradeInfo.color}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: gradeInfo.color }}>{gradeInfo.grade}</div>
                    <div style={{ fontSize: '12px', color: theme.muted }}>{gradeInfo.label}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {criteria.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: theme.muted }}>{c.name} ({(parseFloat(c.weight)*100).toFixed(0)}%)</span>
                        <span style={{ color: theme.subtle, fontWeight: '600' }}>
                          {scores[c.id] || 0} × {c.weight} = {(parseFloat(scores[c.id]||0)*parseFloat(c.weight)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Previous Result */}
            {overallEval && (
              <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                <span style={{ color: theme.success, fontWeight: '600' }}>Previous evaluation on record — </span>
                <span style={{ color: theme.muted }}>Score: {overallEval.total_score} · Grade: {overallEval.grade} · {new Date(overallEval.evaluated_at).toLocaleDateString()}</span>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !complete} style={{
              width: '100%', padding: '14px',
              background: submitting || !complete ? '#2a2f3e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '10px', color: submitting || !complete ? theme.muted : 'white',
              fontSize: '15px', fontWeight: '700', cursor: submitting || !complete ? 'not-allowed' : 'pointer',
              fontFamily: theme.font, letterSpacing: '0.3px'
            }}>
              {submitting ? 'Submitting...' : overallEval ? 'Update Evaluation →' : 'Submit Final Evaluation →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
