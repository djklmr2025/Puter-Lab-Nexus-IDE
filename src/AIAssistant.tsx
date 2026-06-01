
import React, { useState } from 'react';

interface CanvasContext {
  // Define la estructura de tu contexto del canvas aquí
  // Esto debería coincidir con lo que `ai-assistant.js` espera.
  elements: Array<any>;
  connections: Array<any>;
  viewport: any; // o define una interfaz más específica
  // ... otros datos relevantes del canvas
}

// Propiedades que el componente AIAssistant podría recibir
interface AIAssistantProps {
  // Función para obtener el estado actual del canvas
  // En una aplicación real, esta función se pasaría desde el componente padre (e.g., App.tsx)
  // para que AIAssistant pueda obtener el estado real del editor.
  getCanvasContext: () => CanvasContext;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ getCanvasContext }) => {
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) {
      setError('Por favor, escribe un mensaje.');
      return;
    }

    setIsLoading(true);
    setAiResponse('');
    setError(null);

    try {
      const currentCanvasContext = getCanvasContext();

      // TODO: Reemplaza esta URL con la URL de tu endpoint ai-assistant.js desplegado
      const aiAssistantEndpointUrl = 'https://your-vercel-domain.com/api/ai-assistant';

      const response = await fetch(aiAssistantEndpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Si tu endpoint requiere autenticación, añade el token aquí
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN`,
        },
        body: JSON.stringify({
          message: userMessage,
          canvasContext: currentCanvasContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.reply);
        setUserMessage(''); // Limpiar el input después de enviar
      } else {
        const errorData = await response.json();
        setError(`Error del asistente: ${errorData.error || response.statusText}`);
      }
    } catch (err) {
      console.error('Error al llamar a ai-assistant:', err);
      setError('Ocurrió un error al comunicarse con el asistente de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '15px',
      borderRadius: '8px',
      maxWidth: '400px',
      margin: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3 style={{ marginTop: '0' }}>Asistente AIDA</h3>
      <textarea
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="Pregunta sobre tu diagrama o el editor..."
        rows={5}
        style={{ width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }}
        disabled={isLoading}
      />
      <button
        onClick={handleSendMessage}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#a0a0a0' : '#007bff',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {aiResponse && (
        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <h4>Respuesta de AIDA:</h4>
          <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>{aiResponse}</p>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
