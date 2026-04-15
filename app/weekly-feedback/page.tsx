'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import api from '@/lib/api/client';

const JOINTS = [
  { key: 'SHOULDER', label: 'Shoulder' },
  { key: 'ELBOW', label: 'Elbow' },
  { key: 'WRIST', label: 'Wrist' },
  { key: 'HIP', label: 'Hip' },
  { key: 'KNEE', label: 'Knee' },
  { key: 'ANKLE', label: 'Ankle' },
  { key: 'LOWER_BACK', label: 'Lower Back' },
];

function ScoreSlider({
  label,
  description,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: '#e2e2e8' }}>
          {label}
        </p>
        <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', fontWeight: 700, color: '#b1c5ff' }}>
          {value}/10
        </p>
      </div>
      <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#444650', marginBottom: '12px' }}>
        {description}
      </p>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: '#b1c5ff' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontFamily: 'Manrope', fontSize: '0.625rem', color: '#444650', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {lowLabel}
        </span>
        <span style={{ fontFamily: 'Manrope', fontSize: '0.625rem', color: '#444650', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {highLabel}
        </span>
      </div>
    </div>
  );
}

function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

export default function WeeklyFeedbackPage() {
  const router = useRouter();

  const [motivationScore, setMotivationScore] = useState(5);
  const [fatiguePerception, setFatiguePerception] = useState(5);
  const [performanceFeeling, setPerformanceFeeling] = useState(5);
  const [sleepQualityAvg, setSleepQualityAvg] = useState(5);
  const [stressLevelAvg, setStressLevelAvg] = useState(5);
  const [jointPainMap, setJointPainMap] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function setJointPain(joint: string, value: number) {
    setJointPainMap((prev) => ({ ...prev, [joint]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      await api.post('/feedback/weekly', {
        weekNumber: getCurrentWeekNumber(),
        motivationScore,
        fatiguePerception,
        performanceFeeling,
        sleepQualityAvg,
        stressLevelAvg,
        jointPainMap,
        notes: notes || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (typeof msg === 'string' && msg.toLowerCase().includes('unique')) {
        setError('You have already submitted feedback for this week.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
        <AppHeader title="Weekly Check-in" showBack backHref="/dashboard" />
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', textAlign: 'center',
          gap: '16px', padding: '0 24px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: '#0a1f10',
            border: '1px solid #59d8de',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#59d8de', fontSize: '24px' }}>✓</span>
          </div>

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem', fontWeight: 700,
            letterSpacing: '-0.03em', color: '#e2e2e8',
          }}>
            Week logged.
          </h2>

          <p style={{
            fontFamily: 'Manrope', fontSize: '0.875rem',
            color: '#8e909c', maxWidth: '280px', lineHeight: 1.7,
          }}>
            Your feedback helps the engine adapt next week's training volume and intensity.
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
            style={{ color: '#002c70', marginTop: '8px', width: '220px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader title="Weekly Check-in" showBack backHref="/dashboard" />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>
        <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#8e909c', marginBottom: '32px', lineHeight: 1.7 }}>
          Reflect on your training week. This shapes next week's prescriptions.
        </p>

        {/* Training quality section */}
        <div style={{
          backgroundColor: '#1a1c20',
          borderTopRightRadius: '0.75rem',
          borderBottomLeftRadius: '0px',
          borderTopLeftRadius: '0.125rem',
          borderBottomRightRadius: '0.125rem',
          padding: '20px',
          marginBottom: '12px',
        }}>
          <p className="label-sm" style={{ color: '#b1c5ff', marginBottom: '20px' }}>
            Training quality
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <ScoreSlider
              label="Motivation"
              description="How driven did you feel to train this week?"
              value={motivationScore}
              onChange={setMotivationScore}
              lowLabel="Very low"
              highLabel="Very high"
            />
            <ScoreSlider
              label="Performance"
              description="How did your sessions feel performance-wise?"
              value={performanceFeeling}
              onChange={setPerformanceFeeling}
              lowLabel="Poor"
              highLabel="Excellent"
            />
            <ScoreSlider
              label="Fatigue"
              description="How fatigued did you feel overall this week?"
              value={fatiguePerception}
              onChange={setFatiguePerception}
              lowLabel="Fresh"
              highLabel="Exhausted"
            />
          </div>
        </div>

        {/* Recovery section */}
        <div style={{
          backgroundColor: '#1a1c20',
          borderTopRightRadius: '0.75rem',
          borderBottomLeftRadius: '0px',
          borderTopLeftRadius: '0.125rem',
          borderBottomRightRadius: '0.125rem',
          padding: '20px',
          marginBottom: '12px',
        }}>
          <p className="label-sm" style={{ color: '#b1c5ff', marginBottom: '20px' }}>
            Recovery
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <ScoreSlider
              label="Sleep quality"
              description="Average sleep quality across the week."
              value={sleepQualityAvg}
              onChange={setSleepQualityAvg}
              lowLabel="Poor"
              highLabel="Great"
            />
            <ScoreSlider
              label="Life stress"
              description="How much external stress did you carry this week?"
              value={stressLevelAvg}
              onChange={setStressLevelAvg}
              lowLabel="None"
              highLabel="Very high"
            />
          </div>
        </div>

        {/* Joint pain section */}
        <div style={{
          backgroundColor: '#1a1c20',
          borderTopRightRadius: '0.75rem',
          borderBottomLeftRadius: '0px',
          borderTopLeftRadius: '0.125rem',
          borderBottomRightRadius: '0.125rem',
          padding: '20px',
          marginBottom: '12px',
        }}>
          <p className="label-sm" style={{ color: '#b1c5ff', marginBottom: '4px' }}>
            Joint pain
          </p>
          <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#444650', marginBottom: '20px' }}>
            Rate any joints that bothered you. Leave at 0 if no pain.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {JOINTS.map((joint) => (
              <div key={joint.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontFamily: 'Manrope', fontSize: '0.875rem', color: '#c5c6d2' }}>
                    {joint.label}
                  </p>
                  <p style={{
                    fontFamily: 'Manrope', fontSize: '0.75rem', fontWeight: 700,
                    color: (jointPainMap[joint.key] ?? 0) >= 6 ? '#ffb4ab'
                      : (jointPainMap[joint.key] ?? 0) >= 3 ? '#a2e7ff'
                      : '#444650',
                  }}>
                    {jointPainMap[joint.key] ?? 0}/10
                  </p>
                </div>
                <input
                  type="range" min={0} max={10}
                  value={jointPainMap[joint.key] ?? 0}
                  onChange={(e) => setJointPain(joint.key, parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#b1c5ff' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes section */}
        <div style={{
          backgroundColor: '#1a1c20',
          borderTopRightRadius: '0.75rem',
          borderBottomLeftRadius: '0px',
          borderTopLeftRadius: '0.125rem',
          borderBottomRightRadius: '0.125rem',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <p className="label-sm" style={{ color: '#b1c5ff', marginBottom: '12px' }}>
            Notes (optional)
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth noting about this week..."
            style={{
              width: '100%', backgroundColor: '#0c0e12',
              border: 'none', borderBottom: '2px solid #444650',
              color: '#e2e2e8', fontFamily: 'Manrope', fontSize: '0.875rem',
              padding: '12px 0', outline: 'none', resize: 'none',
              height: '80px', lineHeight: 1.6,
            }}
            onFocus={(e) => { e.target.style.borderBottomColor = '#b1c5ff'; }}
            onBlur={(e) => { e.target.style.borderBottomColor = '#444650'; }}
          />
        </div>

        {error && (
          <p style={{ fontFamily: 'Manrope', fontSize: '0.75rem', color: '#ffb4ab', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
          style={{ color: '#002c70' }}
        >
          {loading ? 'Submitting...' : 'Submit weekly check-in'}
        </button>
      </div>
    </div>
  );
}