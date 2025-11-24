import { useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { marketsApi } from "@/react-app/lib/api";
import { useApi } from "@/react-app/hooks/useApi";

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateMarketModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateMarketModalProps) {
  const [name, setName] = useState("");
  const { execute, loading, error } = useApi(marketsApi.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute({ name });
    if (result) {
      setName("");
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Mercado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do Mercado"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Supermercado ABC"
          error={error || undefined}
          required
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Criar Mercado
          </Button>
        </div>
      </form>
    </Modal>
  );
}
