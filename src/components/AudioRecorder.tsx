import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

const AudioRecorder = ({ onTranscriptionComplete, disabled }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTime = 3 * 60 * 60; // 3 hours in seconds

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Use webm format with opus codec for better compression
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // 128 kbps for good quality with reasonable size
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        await processRecording();
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop after 3 hours
          if (newTime >= maxRecordingTime) {
            stopRecording();
            toast.warning('Durasi maksimal 3 jam tercapai. Rekaman dihentikan otomatis.');
          }
          return newTime;
        });
      }, 1000);

      toast.success('Perekaman dimulai');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Gagal memulai perekaman. Pastikan mikrofon diizinkan.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error('Tidak ada data audio untuk diproses');
      return;
    }

    try {
      setIsTranscribing(true);
      toast.info('Menjalankan transkripsi dengan OpenAI Whisper...');

      // Create blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Log audio size
      const audioSizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`Audio size: ${audioSizeMB} MB`);

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];

          // Call transcription edge function
          const { data, error } = await supabase.functions.invoke('audio-transcribe', {
            body: {
              audio: base64Audio,
              format: 'webm'
            }
          });

          if (error) {
            console.error('Transcription error:', error);
            throw new Error(error.message || 'Gagal melakukan transkripsi');
          }

          if (!data || !data.text) {
            throw new Error('Tidak ada teks hasil transkripsi');
          }

          toast.success('Transkripsi selesai!');
          onTranscriptionComplete(data.text);
          
          // Reset recording time
          setRecordingTime(0);
        } catch (error) {
          console.error('Error in transcription:', error);
          toast.error(error instanceof Error ? error.message : 'Gagal melakukan transkripsi');
        } finally {
          setIsTranscribing(false);
        }
      };

      reader.onerror = () => {
        toast.error('Gagal membaca file audio');
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Gagal memproses rekaman');
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          variant="outline"
          size="sm"
          disabled={disabled || isTranscribing}
          className="hover:bg-accent/20 hover:text-accent font-mono"
          title="Rekam Suara (Maksimal 3 jam)"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mentranskripsi...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Rekam Suara
            </>
          )}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            onClick={stopRecording}
            variant="destructive"
            size="sm"
            className="font-mono animate-pulse"
          >
            <Square className="w-4 h-4 mr-2" />
            Hentikan
          </Button>
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
