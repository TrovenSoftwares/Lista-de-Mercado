import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, ShoppingCart, Store, Trash2, Copy, TrendingDown, User } from "lucide-react";
import Button from "@/react-app/components/Button";
import CreateListModal from "@/react-app/components/CreateListModal";
import { listsApi } from "@/react-app/lib/api";
import type { ListWithMarkets } from "@/shared/types";

export default function Home() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ListWithMarkets[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const data = await listsApi.getAll();
      setLists(data);
    } catch (error) {
      console.error("Erro ao carregar listas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      try {
        await listsApi.delete(id);
        fetchLists();
      } catch (error) {
        console.error("Erro ao excluir lista:", error);
      }
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await listsApi.duplicate(id);
      fetchLists();
    } catch (error) {
      console.error("Erro ao duplicar lista:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Lista de Mercado
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Organize suas compras e controle seus gastos
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate("/profile")}
                variant="secondary"
                className="gap-2 flex-1 sm:flex-none"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Perfil</span>
              </Button>
              <Button
                onClick={() => navigate("/analytics")}
                variant="secondary"
                className="gap-2 flex-1 sm:flex-none"
              >
                <TrendingDown className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                onClick={() => navigate("/markets")}
                variant="secondary"
                className="gap-2 flex-1 sm:flex-none"
              >
                <Store className="w-5 h-5" />
                <span className="hidden sm:inline">Mercados</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="mb-6">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            Nova Lista
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-lg animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma lista criada
            </h3>
            <p className="text-gray-600 mb-6">
              Crie sua primeira lista de compras para começar
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Criar Lista
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-emerald-200"
                onClick={() => navigate(`/lists/${list.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {list.name}
                      </h3>
                      {list.is_shared && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Compartilhada
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(list.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {list.markets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {list.markets.map((market) => (
                      <span
                        key={market.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium"
                      >
                        <Store className="w-3 h-3" />
                        {market.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(list.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(list.id, list.name);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchLists}
      />
    </div>
  );
}
