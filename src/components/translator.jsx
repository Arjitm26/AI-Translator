import { useState, useRef, useEffect } from 'react';
// import { Globe2, Mic, Volume2, StopCircle } from 'lucide-react';

const TranslationApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en-US');
  const [targetLanguage, setTargetLanguage] = useState('es-ES');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const recognitionRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const translationTimeoutRef = useRef(null);

  const languageMapping = {
    'en-US': 'English',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'ja-JP': 'Japanese',
    'hi-IN': 'Hindi',
    'mr-IN': 'Marathi'
  };

  const languages = Object.entries(languageMapping).map(([code, name]) => ({
    code,
    name
  }));

  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setOriginalText(transcript);
        
        if (translationTimeoutRef.current) {
          clearTimeout(translationTimeoutRef.current);
        }
        
        translationTimeoutRef.current = setTimeout(() => {
          translateText(transcript);
        }, 500);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start();
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [sourceLanguage, isRecording]);

  const translateText = async (text) => {
    if (!text.trim() || isTranslating) return;
    
    setIsTranslating(true);
    try {
      const sourceLang = languageMapping[sourceLanguage];
      const targetLang = languageMapping[targetLanguage];

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDLdExsZh85LB5hrC_vA-WuwI1I0TCYLvU', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this text from ${sourceLang} to ${targetLang}.
              Also ensure medical terminologies are translated effectively.
              Only respond with the translation, 
              no additional text: "${text}"`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.1,
            topK: 1
          }
        })
      });
  
      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        setTranslatedText(data.candidates[0].content.parts[0].text);
      } else {
        throw new Error('Invalid translation response');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation error occurred. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = sourceLanguage;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const playAudio = (text, language) => {
    if (!text) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px'}}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Healthcare Translation Web App with Generative AI</h1>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label>Source Language</label>
            <select 
              value={sourceLanguage} 
              onChange={(e) => setSourceLanguage(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Target Language</label>
            <select 
              value={targetLanguage} 
              onChange={(e) => setTargetLanguage(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '10px' }}>
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isRecording ? '#ff4444' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                {isRecording ? 'Stop' : 'Speak'}
              </button>
              <button 
                onClick={() => playAudio(originalText, sourceLanguage)}
                disabled={!originalText}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: originalText ? 'pointer' : 'not-allowed',
                  opacity: originalText ? 1 : 0.6
                }}
              >
                Play Original
              </button>
            </div>
            <textarea
              value={originalText}
              readOnly
              placeholder="Speak or type your text here..."
              style={{ width: '100%', height: '200px', padding: '10px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '10px' }}>
              <button 
                onClick={() => playAudio(translatedText, targetLanguage)}
                disabled={!translatedText}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: translatedText ? 'pointer' : 'not-allowed',
                  opacity: translatedText ? 1 : 0.6
                }}
              >
                Play Translation
              </button>
              {isTranslating && (
                <span style={{ marginLeft: '10px', color: '#666' }}>
                  Translating...
                </span>
              )}
            </div>
            <textarea
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              style={{ width: '100%', height: '200px', padding: '10px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationApp;