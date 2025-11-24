import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { ArrowLeft, User, LogOut, Camera } from "lucide-react";
import Button from "@/react-app/components/Button";
import Input from "@/react-app/components/Input";
import { useApi } from "@/react-app/hooks/useApi";

interface UserProfile {
  id: number;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const updateProfile = async (data: { display_name?: string; photo_url?: string }) => {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar perfil");
    return response.json();
  };

  const { execute: executeUpdate, loading: updating, error } = useApi(updateProfile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        setProfile(data);
        setDisplayName(data.display_name || "");
        setPhotoUrl(data.photo_url || "");
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await executeUpdate({
      display_name: displayName,
      photo_url: photoUrl || undefined,
    });
    if (result) {
      setProfile(result);
    }
  };

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja sair?")) {
      await logout();
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin">
          <User className="w-10 h-10 text-emerald-600" />
        </div>
      </div>
    );
  }

  const currentPhotoUrl = photoUrl || profile?.photo_url || user?.google_user_data.picture;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>

          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            </div>
            <p className="text-gray-600">Gerencie suas informações pessoais</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {currentPhotoUrl ? (
                <img
                  src={currentPhotoUrl}
                  alt="Foto de perfil"
                  className="w-32 h-32 rounded-full object-cover border-4 border-emerald-100 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border-4 border-emerald-100 shadow-lg">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome de Exibição"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              required
            />

            <Input
              label="URL da Foto (opcional)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              type="url"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" loading={updating} className="w-full">
              Salvar Alterações
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conta</h2>
          <Button
            onClick={handleLogout}
            variant="danger"
            className="w-full gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
