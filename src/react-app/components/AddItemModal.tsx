import { useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { itemsApi } from "@/react-app/lib/api";
import { useApi } from "@/react-app/hooks/useApi";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listId: number;
}

export default function AddItemModal({
  isOpen,
  onClose,
  onSuccess,
  listId,
}: AddItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const { execute, loading, error } = useApi(itemsApi.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute(listId, {
      name,
      category: category || undefined,
      notes: notes || undefined,
    });
    if (result) {
      setName("");
      setCategory("");
      setNotes("");
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Produto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do Produto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Arroz 5kg"
          error={error || undefined}
          required
        />
        
        <Input
          label="Categoria (opcional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex: Grãos, Limpeza, Bebidas"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Marca preferida, tamanho específico"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
