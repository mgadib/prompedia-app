import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

const MAX_RECORDING_SECONDS = 17 * 60; // 17 minutes

export const VoiceRecorder = ({ onTranscriptionComplete, disabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopRecording(false);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Use webm codec for better compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await handleRecordingStop();
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          
          // Auto-stop at 17 minutes
          if (newTime >= MAX_RECORDING_SECONDS) {
            toast.warning('Recording reached maximum duration (17 minutes) and was stopped automatically.');
            stopRecording(true);
            return MAX_RECORDING_SECONDS;
          }
          
          return newTime;
        });
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone permission denied. Please allow microphone access.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone found. Please connect a microphone.');
        } else {
          toast.error('Failed to access microphone. Please check your settings.');
        }
      } else {
        toast.error('Recording failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const stopRecording = (shouldTranscribe: boolean = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);

    if (shouldTranscribe) {
      toast.success('Recording stopped — preparing file for transcription...');
    }
  };

  const handleRecordingStop = async () => {
    if (chunksRef.current.length === 0) {
      toast.error('No audio data recorded');
      return;
    }

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const audioSize = (audioBlob.size / 1024 / 1024).toFixed(2);
    console.log(`Audio recorded: ${audioSize} MB`);

    // Convert to base64
    try {
      setIsTranscribing(true);
      toast.loading('Transcription in progress...', { id: 'transcribe' });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // Call transcription edge function
          const { data, error } = await supabase.functions.invoke('audio-transcribe', {
            body: {
              audio: base64Audio,
              mimeType: 'audio/webm'
            }
          });

          if (error) {
            console.error('Transcription error:', error);
            throw new Error(error.message || 'Transcription failed');
          }

          if (!data || !data.text) {
            throw new Error('No transcription returned');
          }

          toast.success('Transcription complete — inserted into Prompt Editor', { id: 'transcribe' });
          onTranscriptionComplete(data.text);
        } catch (error) {
          console.error('Transcription failed:', error);
          toast.error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'transcribe' });
        } finally {
          setIsTranscribing(false);
          chunksRef.current = [];
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read audio file', { id: 'transcribe' });
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error('Failed to process recording:', error);
      toast.error('Failed to process recording', { id: 'transcribe' });
      setIsTranscribing(false);
    }
  };

  const isDisabled = disabled || isTranscribing;

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          disabled={isDisabled}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Mic className="h-4 w-4" />
          Start Recording
        </Button>
      ) : (
        <>
          <Button
            onClick={() => stopRecording(true)}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
          <span className="text-sm font-mono text-muted-foreground">
            Recording — {formatTime(recordingTime)}
            {recordingTime >= MAX_RECORDING_SECONDS - 60 && (
              <span className="text-destructive ml-1">
                ({formatTime(MAX_RECORDING_SECONDS - recordingTime)} left)
              </span>
            )}
          </span>
        </>
      )}
      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcribing...
        </div>
      )}
    </div>
  );
};
