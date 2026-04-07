"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardSession } from "@/components/auth/dashboard-session";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/services/api";
import { authStorage } from "@/store/auth-storage";

const PREFS_KEY = "documind_prefs_v1";

type LocalPrefs = {
  emailNotifications: boolean;
  autoProcessDocuments: boolean;
};

const defaultPrefs: LocalPrefs = {
  emailNotifications: true,
  autoProcessDocuments: true,
};

function loadPrefs(): LocalPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<LocalPrefs>;
    return {
      emailNotifications:
        typeof parsed.emailNotifications === "boolean" ? parsed.emailNotifications : defaultPrefs.emailNotifications,
      autoProcessDocuments:
        typeof parsed.autoProcessDocuments === "boolean" ? parsed.autoProcessDocuments : defaultPrefs.autoProcessDocuments,
    };
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(p: LocalPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

export function SettingsView() {
  const router = useRouter();
  const { user, refreshProfile } = useDashboardSession();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileOk, setProfileOk] = useState(false);
  const [prefs, setPrefs] = useState<LocalPrefs>(defaultPrefs);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user.name, user.email]);

  const persistPrefs = (next: LocalPrefs) => {
    setPrefs(next);
    savePrefs(next);
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await api.deleteAccount({ password: deletePassword });
      authStorage.clear();
      router.replace("/login");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileOk(false);
    setSaving(true);
    try {
      await api.updateProfile({ name: name.trim(), email: email.trim() });
      await refreshProfile();
      setProfileOk(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8 animate-fade-in pb-safe">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">Account and UI preferences</p>
      </div>

      <form onSubmit={handleSaveProfile} className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
        {profileOk ? <p className="text-sm text-primary font-medium">Profile saved.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="settings-name">Full name</Label>
            <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>

      <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Preferences</h2>
        <p className="text-xs text-muted-foreground">
          Stored on this device only (demo). The server always processes uploads in the background.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-xs text-muted-foreground">Placeholder toggle for future email digests</p>
            </div>
            <Switch
              checked={prefs.emailNotifications}
              onCheckedChange={(v) => persistPrefs({ ...prefs, emailNotifications: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Highlight auto-processing</p>
              <p className="text-xs text-muted-foreground">Reminder that uploads queue for extraction automatically</p>
            </div>
            <Switch
              checked={prefs.autoProcessDocuments}
              onCheckedChange={(v) => persistPrefs({ ...prefs, autoProcessDocuments: v })}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-destructive/25 bg-card p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Permanently delete your account, all documents, stored files, and chat history. This cannot be undone.
          </p>
        </div>
        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete my account
        </Button>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeletePassword("");
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your password to confirm. All uploads and conversations will be removed from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Password</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLoading || !deletePassword.trim()}
              onClick={() => void handleDeleteAccount()}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete forever"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
