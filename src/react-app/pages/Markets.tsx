import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Store, Edit2, Trash2 } from "lucide-react";
import Button from "@/react-app/components/Button";
import CreateMarketModal from "@/react-app/components/CreateMarketModal";
import { marketsApi } from "@/react-app/lib/api";
import type { Market } from "@/shared/types";
import Modal from "@/react-app/components/Modal";
import Input from "@/react-app/components/Input";
import { useApi } from "@/react-app/hooks/useApi";

export default function Markets() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [editName, setEditName] = useState("");
  const { execute, loading: updating, error } = useApi(marketsApi.update);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await marketsApi.getAll();
      setMarkets(data);
    } catch (error) {
      console.error("Erro ao carregar mercados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const handleEdit = (market: Market) => {
    setEditingMarket(market);
    setEditName(market.name);
    setShowEditModal(true);
  };

  const handleUpdateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarket) return;

    const result = await execute(editingMarket.id, { name: editName });
    if (result) {
      setShowEditModal(false);
      setEditingMarket(null);
      fetchMarkets();
    }
  };

  const handleDelete = async (market: Market) => {
    if (
      confirm(
        `Tem certeza que deseja excluir "${market.name}"? Isso removerá o mercado de todas as listas associadas.`
      )
    ) {
      try {
        await marketsApi.delete(market.id);
        fetchMarkets();
      } catch (error) {
        console.error("Erro ao excluir mercado:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Store className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Gerenciar Mercados
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Adicione e organize os mercados onde você faz compras
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Novo Mercado
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-md animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum mercado cadastrado
            </h3>
            <p className="text-gray-600 mb-6">
              Adicione mercados para organizar suas listas de compras
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Mercado
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {markets.map((market) => (
              <div
                key={market.id}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {market.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Criado em{" "}
                        {new Date(market.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(market)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(market)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateMarketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchMarkets}
      />

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMarket(null);
        }}
        title="Editar Mercado"
      >
        <form onSubmit={handleUpdateMarket} className="space-y-4">
          <Input
            label="Nome do Mercado"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Ex: Supermercado ABC"
            error={error || undefined}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                setEditingMarket(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={updating}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
