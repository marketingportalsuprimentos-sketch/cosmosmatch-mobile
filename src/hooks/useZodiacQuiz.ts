import { useState, useEffect } from 'react'; 
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api'; 
import { toast } from '../lib/toast';

export interface Answer {
  questionId: number;
  score: number; // 0 a 10
  sign: string;
}

interface SubmitQuizPayload {
  answers: number[]; // Array de números
}

const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitQuizPayload) => {
      const { data } = await api.put('/profile/behavioral', payload); 
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success('Sintonia atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar sintonia.');
    }
  });
};

export const useZodiacQuiz = (initialSign: string = 'Cosmos', existingAnswers: number[] = []) => {
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const zodiacSigns = [initialSign]; 
  const currentSign = zodiacSigns[currentSignIndex];
  const totalSigns = zodiacSigns.length;

  const { mutate: submit, isPending: isSubmitting } = useSubmitQuiz();

  // --- CORREÇÃO CRÍTICA: Sincronizar answers quando existingAnswers mudar ---
  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0) {
      const mappedAnswers = existingAnswers.map((score, index) => ({
        questionId: index + 1,
        score: score,
        sign: initialSign
      }));
      setAnswers(mappedAnswers);
    }
  }, [existingAnswers, initialSign]); 
  // --------------------------------------------------------------------------

  const addAnswer = (questionId: number, score: number) => {
    setAnswers((prev) => {
      const filtered = prev.filter(a => a.questionId !== questionId);
      return [...filtered, { questionId, score, sign: currentSign }];
    });
  };

  const goToNextSign = () => {
    if (currentSignIndex < totalSigns - 1) {
      setCurrentSignIndex(prev => prev + 1);
    }
  };

  const goToPreviousSign = () => {
    if (currentSignIndex > 0) {
      setCurrentSignIndex(prev => prev - 1);
    }
  };

  const submitQuiz = () => {
    const finalScores = Array.from({ length: 20 }, (_, i) => {
        const qId = i + 1;
        const ans = answers.find(a => a.questionId === qId);
        return ans ? ans.score : 0; 
    });

    submit({ answers: finalScores });
  };

  return {
    currentSign,
    currentSignIndex,
    totalSigns,
    zodiacSigns,
    answers,
    isSubmitting,
    addAnswer,
    goToNextSign,
    goToPreviousSign,
    submitQuiz
  };
};