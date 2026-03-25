'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Calendar, Languages, LogOut, Leaf, Layers, Eye, EyeOff, ChevronRight, Lock, Camera, X, Loader2, Copy, Check, Pencil, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { plantsApi, shelvesApi, Plant, Shelf } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { getAvatarUrl } from '@/lib/api/users';
import { compressImage } from '@/lib/utils/image-compression';
import { isHeic, convertHeicToJpeg } from '@/lib/utils/heic';
import { PlantCard } from '@/components/plants/PlantCard';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import Link from 'next/link';
import Image from 'next/image';
import { AvatarViewer } from '@/components/profile/AvatarViewer';
import { EditNameModal } from '@/components/profile/EditNameModal';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';
import { SocialLink } from '@/lib/types/user';
import { followsApi, FollowStats } from '@/lib/api/follows';
import { FollowersDialog } from '@/components/follows/FollowersDialog';

const DESKTOP_PREVIEW = 5;
const MOBILE_PREVIEW = 3;

export default function ProfilePage() {
  const t = useTranslations('ProfilePage');
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const uploadAvatar = useAuthStore((state) => state.uploadAvatar);
  const removeAvatar = useAuthStore((state) => state.removeAvatar);
  const logout = useAuthStore((state) => state.logout);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [isBioEditing, setIsBioEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [isBioSaving, setIsBioSaving] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [loadingShelves, setLoadingShelves] = useState(true);
  const [isAvatarViewerOpen, setIsAvatarViewerOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats | null>(null);
  const [followDialog, setFollowDialog] = useState<'followers' | 'following' | null>(null);
  const [isProfileLinkCopied, setIsProfileLinkCopied] = useState(false);
  const [privacyConfirm, setPrivacyConfirm] = useState<{ field: 'showPlants' | 'showPlantHistory' } | null>(null);

  useEffect(() => {
    plantsApi.getAll().then(setPlants).catch(() => {}).finally(() => setLoadingPlants(false));
    shelvesApi.getAll().then(setShelves).catch(() => {}).finally(() => setLoadingShelves(false));
    if (user?.id) {
      followsApi.getStats(user.id).then(setFollowStats).catch(() => {});
    }
  }, [user?.id]);

  const handleLanguageChange = async (language: string) => {
    setIsUpdating(true);
    try {
      const targetLanguage = language === 'ru' ? 'ru' : 'en';
      await updateProfile({ preferredLanguage: targetLanguage });
      trackEvent('profile_language_changed', { language: targetLanguage });
      toast.success(t('preferences.successToast'));
    } catch (error) {
      toast.error(t('preferences.errorToast'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrivacyChange = async (field: 'showPlants' | 'showShelves' | 'showPlantHistory', value: boolean) => {
    if (!value && (field === 'showPlants' || field === 'showPlantHistory')) {
      setPrivacyConfirm({ field });
      return;
    }
    await applyPrivacyChange(field, value);
  };

  const applyPrivacyChange = async (field: 'showPlants' | 'showShelves' | 'showPlantHistory', value: boolean) => {
    try {
      const update = field === 'showPlants' && value === false
        ? { showPlants: false, showShelves: false, showPlantHistory: false }
        : { [field]: value };
      await updateProfile(update);
      trackEvent('profile_privacy_changed', { field, value });
      toast.success(t('privacy.successToast'));
    } catch (error) {
      toast.error(t('privacy.errorToast'));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    trackEvent('profile_avatar_selected');
    try {
      const converted = isHeic(file) ? await convertHeicToJpeg(file) : file;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(converted);
      });
      setCropImageSrc(dataUrl);
    } catch {
      toast.error(t('avatarUpload.errorToast'));
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleAvatarCropComplete = async (croppedFile: File) => {
    setCropImageSrc(null);
    setIsAvatarLoading(true);
    try {
      const compressed = await compressImage(croppedFile);
      await uploadAvatar(compressed);
      trackEvent('profile_avatar_uploaded');
      toast.success(t('avatarUpload.successToast'));
    } catch {
      toast.error(t('avatarUpload.errorToast'));
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setIsAvatarLoading(true);
    try {
      await removeAvatar();
      trackEvent('profile_avatar_removed');
      toast.success(t('avatarRemove.successToast'));
    } catch {
      toast.error(t('avatarRemove.errorToast'));
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      trackEvent('user_logged_out');
      router.push('/login');
      toast.success(t('logout.successToast'));
    } catch (error) {
      toast.error(t('logout.errorToast'));
    }
  };

  const handleCopyProfileLink = async () => {
    if (!user?.id) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const profileUrl = `${baseUrl}/profile/${user.id}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setIsProfileLinkCopied(true);
      trackEvent('profile_link_copied');
      toast.success(t('copyLink.successToast'));
      setTimeout(() => setIsProfileLinkCopied(false), 2000);
    } catch (error) {
      toast.error(t('copyLink.errorToast'));
      console.error('Failed to copy profile link:', error);
    }
  };

  const handleBioEdit = () => {
    setBioInput(user?.bio || '');
    setIsBioEditing(true);
    trackEvent('profile_bio_edit_started');
  };

  const handleBioSave = async () => {
    setIsBioSaving(true);
    try {
      await updateProfile({ bio: bioInput.trim() });
      trackEvent('profile_bio_saved', { length: bioInput.trim().length });
      toast.success(t('bio.successToast'));
      setIsBioEditing(false);
    } catch {
      toast.error(t('bio.errorToast'));
    } finally {
      setIsBioSaving(false);
    }
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">{t('avatar.loading')}</div>
      </div>
    );
  }

  const previewPlants = plants.slice(0, DESKTOP_PREVIEW);
  const previewShelves = shelves.slice(0, DESKTOP_PREVIEW);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight hidden sm:block">{t('header.title')}</h1>
        <p className="text-lg text-muted-foreground hidden sm:block">
          {t('header.description')}
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => { if (user.avatar) { setIsAvatarViewerOpen(true); trackEvent('profile_avatar_viewed'); } }}
                className={`w-20 h-20 rounded-3xl overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center ${
                  user.avatar ? 'cursor-pointer' : ''
                } transition-all hover:scale-105`}
                title={user.avatar ? t('avatar.viewTooltip') : undefined}
              >
                {user.avatar ? (
                  <Image
                    src={getAvatarUrl(user.avatar)!}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
                {isAvatarLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </button>
              {/* Upload overlay */}
              {!isAvatarLoading && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={t('avatar.changeTooltip')}
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              )}
              {/* Remove button */}
              {user.avatar && !isAvatarLoading && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={t('avatar.deleteTooltip')}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
              <div>
                <div className="flex flex-col flex-wrap gap-1">
                  <CardTitle className="text-xl break-all">{user.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsNameModalOpen(true)}
                      className="h-7 w-7 shrink-0"
                      title={t('name.editTooltip')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyProfileLink}
                      className="h-7 w-7 shrink-0"
                      title={t('copyProfileLink')}
                    >
                      {isProfileLinkCopied ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {/* <p className="text-muted-foreground">{user.email.length > 23 ? user.email.slice(0, 23) + '..' : user.email}</p> */}
              </div>
            </div>

            {/* Follow stats — desktop only */}
            {followStats && (
              <div className="hidden md:flex gap-2 shrink-0">
                <button
                  onClick={() => { setFollowDialog('followers'); trackEvent('profile_followers_dialog_opened'); }}
                  className="flex flex-col items-center px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors w-[88px]"
                >
                  <span className="text-lg font-bold leading-tight select-none">{followStats.followersCount}</span>
                  <span className="text-xs text-muted-foreground select-none">{t('follow.followers')}</span>
                </button>
                <button
                  onClick={() => { setFollowDialog('following'); trackEvent('profile_following_dialog_opened'); }}
                  className="flex flex-col items-center px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors w-[88px]"
                >
                  <span className="text-lg font-bold leading-tight select-none">{followStats.followingCount}</span>
                  <span className="text-xs text-muted-foreground select-none">{t('follow.following')}</span>
                </button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Follow stats — mobile only */}
          {followStats && (
            <div className="flex md:hidden gap-2 mb-2">
              <button
                onClick={() => setFollowDialog('followers')}
                className="flex flex-col items-center px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors w-[88px]"
              >
                <span className="text-lg font-bold leading-tight">{followStats.followersCount}</span>
                <span className="text-xs text-muted-foreground">{t('follow.followersMobile')}</span>
              </button>
              <button
                onClick={() => setFollowDialog('following')}
                className="flex flex-col items-center px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors w-[88px]"
              >
                <span className="text-lg font-bold leading-tight">{followStats.followingCount}</span>
                <span className="text-xs text-muted-foreground">{t('follow.followingMobile')}</span>
              </button>
            </div>
          )}

          <div className="grid mt-3 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">{t('profile.fullName')}</span>
              </div>
              <p className="font-medium">{user.name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-semibold">{t('profile.email')}</span>
              </div>
              <p className="font-medium">{user.email}</p>
            </div>

            {/* <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">Роль аккаунта</span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-sm font-semibold text-primary capitalize">{user.role}</span>
              </div>
            </div> */}

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold">{t('profile.memberSince')}</span>
              </div>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('bio.title')}</CardTitle>
            {!isBioEditing && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleBioEdit}>
                <Pencil className="w-4 h-4" />
                {t('bio.edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isBioEditing ? (
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value.slice(0, 80))}
                  placeholder={t('bio.placeholder')}
                  className="resize-none"
                  rows={2}
                  maxLength={80}
                  disabled={isBioSaving}
                />
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">{bioInput.length}/80</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleBioSave} disabled={isBioSaving}>
                  {isBioSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : t('bio.save')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsBioEditing(false)} disabled={isBioSaving}>
                  {t('bio.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className={user.bio ? 'text-sm whitespace-pre-wrap' : 'text-sm text-muted-foreground italic'}>
              {user.bio || t('bio.placeholder')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {t('privacy.title')}
          </CardTitle>
          <CardDescription>
            {t('privacy.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {(user.showPlants ?? true) ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{t('privacy.showPlants.label')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('privacy.showPlants.description')}
              </p>
            </div>
            <Switch
              checked={user.showPlants ?? true}
              onCheckedChange={(v) => handlePrivacyChange('showPlants', v)}
            />
          </div>

          <div className={`border-t pt-4 flex items-center justify-between gap-4 ${!(user.showPlants ?? true) ? 'opacity-50' : ''}`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {(user.showShelves ?? true) ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{t('privacy.showShelves.label')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {!(user.showPlants ?? true)
                  ? t('privacy.showShelves.requiresPlants')
                  : t('privacy.showShelves.description')}
              </p>
            </div>
            <Switch
              checked={user.showShelves ?? true}
              onCheckedChange={(v) => handlePrivacyChange('showShelves', v)}
              disabled={!(user.showPlants ?? true)}
            />
          </div>

          <div className={`border-t pt-4 flex items-center justify-between gap-4 ${!(user.showPlants ?? true) ? 'opacity-50' : ''}`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {(user.showPlantHistory ?? true) ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{t('privacy.showPlantHistory.label')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {!(user.showPlants ?? true)
                  ? t('privacy.showPlantHistory.requiresPlants')
                  : t('privacy.showPlantHistory.description')}
              </p>
            </div>
            <Switch
              checked={user.showPlantHistory ?? true}
              onCheckedChange={(v) => handlePrivacyChange('showPlantHistory', v)}
              disabled={!(user.showPlants ?? true)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy disable confirmation dialog */}
      <AlertDialog open={!!privacyConfirm} onOpenChange={(open) => { if (!open) setPrivacyConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('privacy.disableConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {privacyConfirm && t(`privacy.disableConfirm.${privacyConfirm.field}`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('privacy.disableConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (privacyConfirm) {
                  await applyPrivacyChange(privacyConfirm.field, false);
                  setPrivacyConfirm(null);
                }
              }}
            >
              {t('privacy.disableConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('socialLinks.title')}</CardTitle>
          <CardDescription>
            {t('socialLinks.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialLinksSection
            socialLinks={user.socialLinks || []}
            onUpdate={async (socialLinks: SocialLink[]) => {
              await updateProfile({ socialLinks });
              toast.success(t('socialLinks.successToast'));
            }}
          />
        </CardContent>
      </Card>

      {/* Admin panel link — mobile only */}
      {user.role === 'admin' && (
        <Link href="/admin/info" className="md:hidden block">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{t('admin.link')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Settings Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Preferences - only show for RU */}
        {locale === 'ru' && (<Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('preferences.title')}</CardTitle>
            <CardDescription>{t('preferences.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Languages className="w-4 h-4" />
                <span className="text-sm font-semibold">{t('preferences.languageLabel')}</span>
              </div>
              <Select
                value={user.preferredLanguage || 'ru'}
                onValueChange={handleLanguageChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('preferences.languagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('preferences.languageDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Logout */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('logout.title')}</CardTitle>
            <CardDescription>{t('logout.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} className="w-full gap-2" variant="outline">
              <LogOut className="w-4 h-4" />
              {t('logout.button')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Plants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                {t('plants.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {loadingPlants ? t('plants.loading') : t('plants.total', { count: plants.length })}
              </CardDescription>
            </div>
            {plants.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href="/plants">
                  {t('plants.showAll')} <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingPlants ? (
            <div className="text-center text-muted-foreground py-6">{t('plants.loadingText')}</div>
          ) : plants.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <Leaf className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>{t('plants.empty.title')}</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/plants">{t('plants.empty.button')}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previewPlants.map((plant, i) => (
                  <div key={plant._id} className={i >= MOBILE_PREVIEW ? 'hidden sm:block' : ''}>
                    <PlantCard plant={plant} index={i} />
                  </div>
                ))}
              </div>
              {plants.length > DESKTOP_PREVIEW && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/plants">{t('plants.showAllCount', { count: plants.length })}</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* My Shelves */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                {t('shelves.title')}
              </CardTitle>
              <CardDescription className="mt-1">
                {loadingShelves ? t('shelves.loading') : t('shelves.total', { count: shelves.length })}
              </CardDescription>
            </div>
            {shelves.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href="/shelves">
                  {t('shelves.showAll')} <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingShelves ? (
            <div className="text-center text-muted-foreground py-6">{t('shelves.loadingText')}</div>
          ) : shelves.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>{t('shelves.empty.title')}</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/shelves">{t('shelves.empty.button')}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previewShelves.map((shelf, i) => (
                  <div key={shelf._id} className={i >= MOBILE_PREVIEW ? 'hidden sm:block' : ''}>
                    <ShelfCard shelf={shelf} index={i} />
                  </div>
                ))}
              </div>
              {shelves.length > DESKTOP_PREVIEW && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/shelves">{t('shelves.showAllCount', { count: shelves.length })}</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Name Modal */}
      <EditNameModal
        open={isNameModalOpen}
        onOpenChange={setIsNameModalOpen}
        currentName={user.name}
      />

      {/* Avatar Crop */}
      {cropImageSrc && (
        <ImageCropModal
          open={true}
          imageSrc={cropImageSrc}
          onCropComplete={handleAvatarCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      {/* Avatar Viewer */}
      {isAvatarViewerOpen && user.avatar && (
        <AvatarViewer
          avatarUrl={getAvatarUrl(user.avatar)!}
          userName={user.name}
          onClose={() => setIsAvatarViewerOpen(false)}
        />
      )}

      {/* Followers / Following Dialog */}
      {followDialog && (
        <FollowersDialog
          userId={user.id}
          type={followDialog}
          isOpen={true}
          onClose={() => setFollowDialog(null)}
        />
      )}
    </div>
  );
}
