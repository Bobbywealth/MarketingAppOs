// Test page to demonstrate code editing capability
import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('Hello from the code editor!');

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>🎉 Code Editing Demo</h1>
      <p>This page was created/edited using the code editor.</p>
      <div style={{ 
        background: '#4CAF50', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        {message}
      </div>
      <button 
        onClick={() => setMessage('You clicked the button!')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Click Me
      </button>
    </div>
  );
}
