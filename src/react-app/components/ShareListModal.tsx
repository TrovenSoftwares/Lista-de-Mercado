import { useState } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
import { useApi } from "@/react-app/hooks/useApi";
import { Share2, X } from "lucide-react";

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listId: number;
  sharedUsers: Array<{ email: string; display_name: string | null }>;
}

export default function ShareListModal({
  isOpen,
  onClose,
  onSuccess,
  listId,
  sharedUsers,
}: ShareListModalProps) {
  const [email, setEmail] = useState("");

  const shareList = async (data: { email: string }) => {
    const response = await fetch(`/api/lists/${listId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao compartilhar lista");
    }
    return response.json();
  };

  const unshareList = async (userId: string) => {
    const response = await fetch(`/api/lists/${listId}/share/${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao remover compartilhamento");
    return response.json();
  };

  const { execute: executeShare, loading, error } = useApi(shareList);
  const { execute: executeUnshare } = useApi(unshareList);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await executeShare({ email });
    if (result) {
      setEmail("");
      onSuccess();
    }
  };

  const handleRemoveShare = async (userId: string) => {
    if (confirm("Tem certeza que deseja remover o acesso deste usuário?")) {
      const result = await executeUnshare(userId);
      if (result) {
        onSuccess();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compartilhar Lista">
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <Input
          label="Email do usuário"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="exemplo@email.com"
          error={error || undefined}
          required
        />

        <Button type="submit" loading={loading} className="w-full gap-2">
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>
      </form>

      {sharedUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Compartilhado com:
          </h3>
          <div className="space-y-2">
            {sharedUsers.map((sharedUser) => (
              <div
                key={sharedUser.email}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {sharedUser.display_name || sharedUser.email}
                  </p>
                  {sharedUser.display_name && (
                    <p className="text-xs text-gray-500 truncate">{sharedUser.email}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveShare(sharedUser.email)}
                  className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
