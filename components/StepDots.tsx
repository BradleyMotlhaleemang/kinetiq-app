interface StepDotsProps {
  total: number;
  current: number;
}

export default function StepDots({ total, current }: StepDotsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '6px',
            width: i === current ? '16px' : '6px',
            borderRadius: '9999px',
            backgroundColor: i === current ? '#b1c5ff' : '#444650',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}