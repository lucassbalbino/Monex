import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Ticket, Settings, LogOut, Loader2, Menu, X, Lock, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useFinancialData } from '@/context/FinancialContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/customSupabaseClient';
import NotificationBell from '@/components/clawdbot/NotificationBell';
import { useClawdBotContext } from '@/context/ClawdBotContext';

const Header = ({ onShowLanding, onToggleSidebar, isSidebarOpen }) => {
  const { toast } = useToast();
  const { userProfile, creditCards, debts, updateUserProfile } = useFinancialData();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // ClawdBot — usa o contexto centralizado (instância única)
  const {
    notifications: clawdNotifications,
    unreadCount: clawdUnread,
    handleMarkAllRead,
    handleInsightAction,
    handleDismiss,
  } = useClawdBotContext();
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    newPassword: ''
  });

  // Password change flow state
  const [passwordStep, setPasswordStep] = useState(1); // 1 = verify current, 2 = set new
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Admin check based on role from profiles
  const isAdmin = userProfile?.role === 'admin';

  // --- Profile Logic ---
  const handleOpenProfile = () => {
    setProfileForm({
      full_name: userProfile?.full_name || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || '',
      password: '',
      newPassword: ''
    });
    // Reset password change flow
    setPasswordStep(1);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowProfileDialog(true);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone
        })
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      updateUserProfile({ ...userProfile, full_name: profileForm.full_name, phone: profileForm.phone });
      toast({ title: "Perfil atualizado com sucesso!", className: "bg-green-600 text-white" });
      setShowProfileDialog(false);

    } catch (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      toast({ title: "Senha obrigatória", description: "Digite sua senha atual.", variant: "destructive" });
      return;
    }
    setVerifyingPassword(true);
    try {
      // Verify current password by signing in
      const { error } = await supabase.auth.signInWithPassword({
        email: userProfile?.email,
        password: currentPassword
      });
      if (error) throw new Error("Senha atual incorreta.");

      // Password is correct, move to step 2
      setPasswordStep(2);
      toast({ title: "Senha verificada!", description: "Agora defina sua nova senha.", className: "bg-green-600 text-white" });
    } catch (error) {
      toast({ title: "Senha incorreta", description: error.message, variant: "destructive" });
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast({ title: "Senha obrigatória", description: "Digite a nova senha.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Senha fraca", description: "Use ao menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Senhas não coincidem", description: "A confirmação deve ser igual à nova senha.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Senha alterada com sucesso!", className: "bg-green-600 text-white" });
      setShowProfileDialog(false);
    } catch (error) {
       toast({ title: "Erro na alteração", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navigateToPlans = () => {
    // DOUBLE CHECK: Prevent any action if user is not admin
    if (!isAdmin) return;
    window.location.href = '/landing#plans';
  };

  return (
    <header className="bg-[#1E293B] border-b border-[#14B8A6]/30 px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden text-gray-200 hover:bg-[#334155]" 
            onClick={onToggleSidebar}
            aria-label="Abrir menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <img 
              src="https://horizons-cdn.hostinger.com/26fb3ff4-2941-4291-a8b9-2757b63ade4c/4d34c56b0a0a4f437b2e1b698d3b5297.jpg" 
              alt="Logo Monex" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold text-[#14B8A6]">Monex</span>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 md:gap-4"
        >
          {/* ClawdBot Notification Bell — unifica notificações legacy + insights */}
          <NotificationBell
            notifications={clawdNotifications}
            unreadCount={clawdUnread}
            onMarkAllRead={handleMarkAllRead}
            onAction={handleInsightAction}
            onDismiss={handleDismiss}
          />

          {/* 
            ADMIN "VER PLANOS" BUTTON
            - Strictly strictly hidden for non-admins (userProfile.email check)
            - Visually consistent with other icons (ghost/icon variant)
            - Protected navigation
          */}
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={navigateToPlans}
              className="hover:bg-[#334155] transition-colors"
              title="Ver planos (Admin)"
            >
              <Ticket className="h-5 w-5 text-gray-300" />
            </Button>
          )}

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-[#334155] transition-colors"
              >
                <User className="h-5 w-5 text-gray-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1E293B] border-[#14B8A6]/30 text-white">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#334155]" />
              <DropdownMenuItem onClick={handleOpenProfile} className="focus:bg-[#334155] cursor-pointer gap-2">
                <Settings className="h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-900/20 text-red-400 focus:text-red-300 cursor-pointer gap-2 mt-2">
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>

      {/* Profile Settings Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-[#1E293B] border-[#14B8A6]/30 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurações da Conta</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="profile" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 bg-[#0F172A]">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  value={profileForm.full_name} 
                  onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                  className="bg-[#0F172A] border-[#14B8A6]/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={profileForm.email} 
                  disabled 
                  className="bg-[#0F172A] border-[#14B8A6]/30 text-white opacity-60 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={profileForm.phone} 
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                  className="bg-[#0F172A] border-[#14B8A6]/30 text-white"
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={loading} className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white mt-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 py-4">
              {passwordStep === 1 ? (
                /* Step 1: Verify current password */
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-[#14B8A6]/20 p-2 rounded-full">
                      <Lock className="h-4 w-4 text-[#14B8A6]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Verificar identidade</p>
                      <p className="text-xs text-gray-400">Digite sua senha atual para continuar</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha atual"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleVerifyCurrentPassword()}
                        className="bg-[#0F172A] border-[#14B8A6]/30 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handleVerifyCurrentPassword}
                    disabled={verifyingPassword || !currentPassword}
                    className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white mt-2"
                  >
                    {verifyingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {verifyingPassword ? 'Verificando...' : 'Verificar senha'}
                  </Button>
                </>
              ) : (
                /* Step 2: Set new password */
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => { setPasswordStep(1); setNewPassword(''); setConfirmNewPassword(''); }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="bg-green-500/20 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-400">Identidade verificada</p>
                      <p className="text-xs text-gray-400">Defina sua nova senha abaixo</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="bg-[#0F172A] border-[#14B8A6]/30 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repita a nova senha"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                        className="bg-[#0F172A] border-[#14B8A6]/30 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                      <p className="text-xs text-red-400">As senhas não coincidem</p>
                    )}
                    {confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 6 && (
                      <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Senhas coincidem</p>
                    )}
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={loading || !newPassword || newPassword !== confirmNewPassword}
                    className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {loading ? 'Atualizando...' : 'Atualizar Senha'}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;