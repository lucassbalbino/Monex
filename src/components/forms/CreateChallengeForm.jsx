
import React from 'react';
import { useToast } from '@/components/ui/use-toast';

const CreateChallengeForm = () => {
  const { toast } = useToast();

  // This component is no longer used, but kept to prevent file deletion.
  // Display a toast notification indicating it's unimplemented.
  React.useEffect(() => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: "Challenge creation functionality was removed as per the latest user request.",
      variant: "destructive"
    });
  }, [toast]);

  return (
    <div className="p-6 bg-[#1E293B] rounded-xl border border-[#14B8A6]/30 text-center text-gray-400">
      <p className="text-lg font-semibold mb-4">Recurso de Criação de Desafio Removido</p>
      <p>Este formulário foi desativado conforme a sua última solicitação. O foco agora é em 'Metas' financeiras.</p>
    </div>
  );
};

export default CreateChallengeForm;
