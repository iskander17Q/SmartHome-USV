"use client";

import { useState, useEffect } from "react";
import { Power, Lightbulb, Fan, Tv, Thermometer, Lock, Plus, X, Cpu, Speaker, Router, User, AlertCircle, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";

// String to Icon Component Mapping for DB storage
const ICON_MAP: Record<string, any> = {
  Lightbulb: Lightbulb,
  Fan: Fan,
  Tv: Tv,
  Thermometer: Thermometer,
  Lock: Lock,
  Cpu: Cpu,
  Speaker: Speaker,
  Router: Router
};

const AVAILABLE_ICONS = [
  { name: "Свет", iconName: "Lightbulb" },
  { name: "Климат", iconName: "Fan" },
  { name: "ТВ", iconName: "Tv" },
  { name: "Температура", iconName: "Thermometer" },
  { name: "Безопасность", iconName: "Lock" },
  { name: "Система", iconName: "Cpu" },
  { name: "Аудио", iconName: "Speaker" },
  { name: "Сеть", iconName: "Router" },
];

const API_URL = "";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // User State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Devices State
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  
  // Add Device State
  const [isAdding, setIsAdding] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);

  // Checks session on mount
  useEffect(() => {
    setMounted(true);
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch devices when session exists
  useEffect(() => {
    if (token) {
      fetchDevices();
    } else {
      setDevices([]);
    }
  }, [token]);

  const fetchDevices = async () => {
    try {
      setIsLoadingDevices(true);
      const res = await fetch(`${API_URL}/api/devices`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    setAuthError("");

    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const body = isRegistering 
        ? { email, password, firstName, lastName }
        : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Ошибка авторизации");
      }
      
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const toggleDevice = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setDevices(devices.map(d => 
      d.id === id ? { ...d, status: !currentStatus } : d
    ));

    try {
      const res = await fetch(`${API_URL}/api/devices/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: !currentStatus })
      });
      
      if (!res.ok) {
        // Revert on error
        setDevices(devices.map(d => 
          d.id === id ? { ...d, status: currentStatus } : d
        ));
        if (res.status === 401) handleLogout();
      }
    } catch (err) {
      console.error("Failed to update status", err);
      // Revert on error
      setDevices(devices.map(d => 
        d.id === id ? { ...d, status: currentStatus } : d
      ));
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    
    const iconName = AVAILABLE_ICONS[selectedIconIndex].iconName;
    
    try {
      const res = await fetch(`${API_URL}/api/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newDeviceName,
          icon: iconName,
          status: false
        })
      });
      
      if (res.ok) {
        const newDevice = await res.json();
        setDevices([newDevice, ...devices]);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Error creating device", err);
    }

    setNewDeviceName("");
    setSelectedIconIndex(0);
    setIsAdding(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Keep hydration safe
  if (!mounted) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"></div>;

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
        {/* Decorative light background elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none transition-colors duration-500" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-100/50 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none transition-colors duration-500" />

        {/* Theme Toggle for Auth Page */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 lg:p-3 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-300 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 relative z-10 transition-colors duration-500"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 rotate-3">
              <Power className="w-8 h-8 text-white -rotate-3" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-2">E Home</h1>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
            {isRegistering ? "Создайте аккаунт для управления домом" : "Войдите для управления умным домом"}
          </p>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{authError}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-4"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Имя"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      required={isRegistering}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Фамилия"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      required={isRegistering}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl px-4 py-3.5 transition-all mt-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoadingAuth ? "Загрузка..." : (isRegistering ? "Зарегистрироваться" : "Войти")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError("");
              }}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              {isRegistering ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const userFullName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ''}` 
    : user?.email;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 md:p-12 relative overflow-hidden transition-colors duration-500">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/60 dark:bg-blue-900/10 rounded-full blur-3xl transition-colors duration-500" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/60 dark:bg-indigo-900/10 rounded-full blur-3xl transition-colors duration-500" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-12 bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl rounded-2xl p-4 px-6 shadow-sm transition-colors duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <Power className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">E Home</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-300 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
              <User className="w-4 h-4" />
              {userFullName}
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Выйти
            </button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
              Привет, {userFullName} 👋
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Управляйте вашим домом из любой точки</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 font-medium"
          >
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Добавить устройство</span>
          </button>
        </div>

        {isLoadingDevices ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Загрузка устройств...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {devices.map((device) => {
                const Icon = ICON_MAP[device.icon] || Lightbulb;
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={device.id}
                    className={cn(
                      "relative overflow-hidden rounded-3xl p-6 border transition-all duration-300",
                      device.status 
                        ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-900/30" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:shadow-none"
                    )}
                  >
                    {/* Active state background glow */}
                    {device.status && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-500/10 dark:to-indigo-500/10 pointer-events-none" />
                    )}

                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                        device.status 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/50" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}>
                        <Icon className="w-7 h-7" />
                      </div>
                      
                      <button
                        onClick={() => toggleDevice(device.id, device.status)}
                        className={cn(
                          "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none",
                          device.status ? "bg-blue-500 shadow-inner" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ease-spring shadow-sm",
                            device.status ? "translate-x-7" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white tracking-tight">{device.name}</h3>
                      <p className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        device.status ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {device.status ? "Включено" : "Выключено"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!devices.length && (
              <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl border-dashed transition-colors duration-500">
                <Lightbulb className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p>У вас пока нет устройств. Добавьте первое!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl dark:shadow-black overflow-hidden transition-colors duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Новое устройство</h3>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddDevice} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Название</label>
                  <input
                    type="text"
                    placeholder="Например: Лампа в спальне"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Иконка</label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_ICONS.map((item, idx) => {
                      const Icon = ICON_MAP[item.iconName];
                      const isSelected = selectedIconIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedIconIndex(idx)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            isSelected 
                              ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm" 
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-[10px] font-semibold truncate w-full text-center">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newDeviceName.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-4 py-3.5 transition-all shadow-lg shadow-blue-500/30"
                >
                  Добавить устройство
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
