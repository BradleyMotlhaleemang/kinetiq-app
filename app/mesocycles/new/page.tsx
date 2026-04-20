'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { mesocyclesApi } from '@/lib/api/mesocycles';
import { ChevronLeft, Zap } from 'lucide-react';

export default function NewMesocyclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalWeeks: 4,
    templateId: '',
  });

  const [recommendations, setRecommendations] = useState<any>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      const res = await mesocyclesApi.recommend();
      const data = res.data;
      setRecommendations({
        recommended: data.recommended ?? data.template ?? null,
        alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
      });
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      console.log('Creating mesocycle with data:', {
        name: formData.name,
        totalWeeks: formData.totalWeeks,
        templateId: formData.templateId || undefined,
      });
      const result = await mesocyclesApi.generate({
        name: formData.name,
        totalWeeks: formData.totalWeeks,
        templateId: formData.templateId || undefined,
      });
      console.log('Mesocycle created successfully:', result);
      router.push('/mesocycles');
    } catch (err) {
      console.error('Failed to create mesocycle:', err);
      alert('Failed to create mesocycle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', paddingBottom: '96px' }}>
      <AppHeader
        title="Create Block"
        showBack
        backHref="/mesocycles"
      />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 20px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Name */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Manrope',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#e2e2e8',
              marginBottom: '8px',
            }}>
              Block Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Strength Phase 1"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1c20',
                border: '1px solid #282a2e',
                borderRadius: '8px',
                color: '#e2e2e8',
                fontFamily: 'Manrope',
                fontSize: '0.875rem',
              }}
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Manrope',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#e2e2e8',
              marginBottom: '8px',
            }}>
              Duration (weeks)
            </label>
            <select
              value={formData.totalWeeks}
              onChange={(e) => setFormData(prev => ({ ...prev, totalWeeks: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a1c20',
                border: '1px solid #282a2e',
                borderRadius: '8px',
                color: '#e2e2e8',
                fontFamily: 'Manrope',
                fontSize: '0.875rem',
              }}
            >
              <option value={4}>4 weeks</option>
              <option value={6}>6 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
            </select>
          </div>

          {/* Template Selection */}
          {recommendations && (
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'Manrope',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#e2e2e8',
                marginBottom: '8px',
              }}>
                Training Split
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.recommended && (
                  <div>
                    <p style={{
                      fontFamily: 'Manrope',
                      fontSize: '0.75rem',
                      color: '#8e909c',
                      marginBottom: '8px',
                    }}>
                      Recommended for you:
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, templateId: recommendations.recommended.id }))}
                      style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: formData.templateId === recommendations.recommended.id ? '#59d8de' : '#1a1c20',
                        border: formData.templateId === recommendations.recommended.id ? '2px solid #59d8de' : '1px solid #282a2e',
                        borderRadius: '8px',
                        color: '#e2e2e8',
                        fontFamily: 'Manrope',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        {recommendations.recommended.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8e909c' }}>
                        {recommendations.recommended.splitTypeLabel} • {recommendations.recommended.daysPerWeek} days/week
                      </div>
                    </button>
                  </div>
                )}

                {recommendations.alternatives && recommendations.alternatives.length > 0 && (
                  <div>
                    <p style={{
                      fontFamily: 'Manrope',
                      fontSize: '0.75rem',
                      color: '#8e909c',
                      marginBottom: '8px',
                    }}>
                      Other options:
                    </p>
                    {recommendations.alternatives.map((alt: any) => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, templateId: alt.id }))}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          marginBottom: '8px',
                          backgroundColor: formData.templateId === alt.id ? '#59d8de' : '#1a1c20',
                          border: formData.templateId === alt.id ? '2px solid #59d8de' : '1px solid #282a2e',
                          borderRadius: '8px',
                          color: '#e2e2e8',
                          fontFamily: 'Manrope',
                          fontSize: '0.875rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                          {alt.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8e909c' }}>
                          {alt.splitTypeLabel} • {alt.daysPerWeek} days/week
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#444650' : 'linear-gradient(45deg, #b1c5ff, #002560)',
              border: 'none',
              borderRadius: '8px',
              color: loading ? '#8e909c' : '#002c70',
              fontFamily: 'Manrope',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '16px',
            }}
          >
            {loading ? 'Creating...' : 'Create Block'}
          </button>
        </form>
      </div>
    </div>
  );
}