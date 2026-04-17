'use client';

import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Camera, CheckCircle2, Ruler, User, UserCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { biometricProfileSchema, zodValidator } from '@/lib/form-validation';
import { cn } from '@/lib/utils';

// ─── types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean | null;
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  preferredUnit: 'metric' | 'imperial' | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  return { ft: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
}

function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54 * 10) / 10;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

// ─── field components ─────────────────────────────────────────────────────────

function FieldError({ errors }: { errors: unknown[] }) {
  const first = errors.find((e) => typeof e === 'string') as string | undefined;
  if (!first) return null;
  return <p className="text-sm text-destructive mt-1">{first}</p>;
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

const textInputCls =
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive py-3 text-xl font-semibold';

const numberInputCls =
  'w-full border rounded-2xl px-6 py-4 text-2xl font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

// ─── main component ───────────────────────────────────────────────────────────

export function BiometricProfileForm() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { data, isLoading } = useQuery<{ profile: ProfileData }>({
    queryKey: ['profile'],
    queryFn: () => fetch('/api/profile').then((r) => r.json()),
  });

  const profile = data?.profile;

  const form = useForm({
    defaultValues: {
      name: '',
      dateOfBirth: '',
      gender: '' as string,
      preferredUnit: 'metric' as 'metric' | 'imperial',
      heightCm: '' as string | number,
      weightKg: '' as string | number,
      heightFt: '' as string | number,
      heightIn: '' as string | number,
      weightLbs: '' as string | number,
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (!profile) return;

    const unit = profile.preferredUnit ?? 'metric';
    let heightCm: string | number = '';
    let weightKg: string | number = '';
    let heightFt: string | number = '';
    let heightIn: string | number = '';
    let weightLbs: string | number = '';

    if (profile.heightCm) {
      if (unit === 'metric') {
        heightCm = profile.heightCm;
      } else {
        const { ft, inches } = cmToFtIn(profile.heightCm);
        heightFt = ft;
        heightIn = inches;
      }
    }

    if (profile.weightKg) {
      if (unit === 'metric') {
        weightKg = profile.weightKg;
      } else {
        weightLbs = kgToLbs(profile.weightKg);
      }
    }

    form.reset({
      name: profile.name,
      dateOfBirth: profile.dateOfBirth ?? '',
      gender: profile.gender ?? '',
      preferredUnit: unit,
      heightCm,
      weightKg,
      heightFt,
      heightIn,
      weightLbs,
    });

    if (profile.image) setAvatarPreview(null); // use server image
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (values: typeof form.state.values) => {
      const unit = values.preferredUnit;
      let heightCm: number | null = null;
      let weightKg: number | null = null;

      if (unit === 'metric') {
        heightCm = values.heightCm !== '' ? Number(values.heightCm) : null;
        weightKg = values.weightKg !== '' ? Number(values.weightKg) : null;
      } else {
        const ft = values.heightFt !== '' ? Number(values.heightFt) : 0;
        const inches = values.heightIn !== '' ? Number(values.heightIn) : 0;
        if (ft || inches) heightCm = ftInToCm(ft, inches);
        if (values.weightLbs !== '') weightKg = lbsToKg(Number(values.weightLbs));
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          dateOfBirth: values.dateOfBirth || null,
          gender: values.gender || null,
          preferredUnit: unit,
          heightCm,
          weightKg,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);

    const fd = new FormData();
    fd.append('avatar', file);

    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch {
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  const currentAvatar = avatarPreview ?? profile?.image ?? null;
  const currentName = form.state.values.name || profile?.name || '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(form.state.values);
      }}
      className="space-y-20"
    >
      {/* ── Identity & Age ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-4 pt-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-headline font-extrabold">Identity &amp; Age</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your age and identity are critical factors in determining your Basal Metabolic Rate (BMR)
            and caloric needs.
          </p>
        </div>

        <div className="space-y-8">
          {/* Avatar */}
          <div className="flex justify-center md:justify-start">
            <div
              className="group relative w-32 h-32 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="w-32 h-32 border-2 border-transparent group-hover:border-primary/20 transition-all">
                <AvatarImage src={currentAvatar ?? undefined} alt={currentName} />
                <AvatarFallback className="bg-muted text-muted-foreground text-4xl">
                  {currentName ? getInitials(currentName) : <UserCircle className="w-16 h-16 opacity-30" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-full">
                {avatarUploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-tighter mt-1 text-center px-2">
                      Change Photo
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Email + verified (read-only) */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <SectionLabel>Email</SectionLabel>
              <div className="text-base font-semibold px-1">{profile?.email}</div>
            </div>
            <div>
              <SectionLabel>Email Verified?</SectionLabel>
              <div className="flex items-center gap-1.5 text-base font-semibold px-1">
                {profile?.emailVerified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                    <span>Yes</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <form.Field
            name="name"
            validators={{ onChange: zodValidator(biometricProfileSchema.shape.name) }}
          >
            {(field) => (
              <div className="space-y-3">
                <SectionLabel>Full Name</SectionLabel>
                <input
                  id="name"
                  type="text"
                  className={cn(textInputCls, field.state.meta.errors.length && 'border-destructive')}
                  placeholder="John Doe"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Date of Birth */}
          <form.Field name="dateOfBirth">
            {(field) => (
              <div className="space-y-3">
                <SectionLabel>Date of Birth</SectionLabel>
                <div className="relative">
                  <input
                    id="dateOfBirth"
                    type="date"
                    className={cn(textInputCls, 'pr-14')}
                    value={field.state.value as string}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 pointer-events-none" />
                </div>
              </div>
            )}
          </form.Field>

          {/* Gender */}
          <form.Field name="gender">
            {(field) => (
              <div className="space-y-3">
                <SectionLabel>Gender Identity</SectionLabel>
                <Select
                  value={field.state.value as string}
                  onValueChange={(v) => field.handleChange(v)}
                >
                  <SelectTrigger className="w-full h-14! px-5 text-base font-semibold">
                    <SelectValue placeholder="Select Identity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="woman">Woman</SelectItem>
                    <SelectItem value="man">Man</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
        </div>
      </section>

      {/* ── Physical Dimensions ────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-4 pt-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary-foreground">
            <Ruler className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-headline font-extrabold">Physical Dimensions</h2>
          <p className="text-muted-foreground leading-relaxed">
            Accurate height and weight data allow us to calculate your BMI and track body composition
            changes over time.
          </p>
        </div>

        <div className="space-y-8">
          {/* Metric / Imperial segmented toggle */}
          <form.Field name="preferredUnit">
            {(field) => (
              <div className="flex p-1.5 bg-muted rounded-2xl w-full">
                {(['metric', 'imperial'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => {
                      const current = field.state.value as 'metric' | 'imperial';
                      if (current === unit) return;

                      // Convert displayed values when switching units
                      const vals = form.state.values;
                      if (unit === 'imperial') {
                        // metric → imperial
                        const cm = vals.heightCm !== '' ? Number(vals.heightCm) : null;
                        const kg = vals.weightKg !== '' ? Number(vals.weightKg) : null;
                        if (cm) {
                          const { ft, inches } = cmToFtIn(cm);
                          form.setFieldValue('heightFt', ft);
                          form.setFieldValue('heightIn', inches);
                        }
                        if (kg) form.setFieldValue('weightLbs', kgToLbs(kg));
                        form.setFieldValue('heightCm', '');
                        form.setFieldValue('weightKg', '');
                      } else {
                        // imperial → metric
                        const ft = vals.heightFt !== '' ? Number(vals.heightFt) : 0;
                        const inches = vals.heightIn !== '' ? Number(vals.heightIn) : 0;
                        const lbs = vals.weightLbs !== '' ? Number(vals.weightLbs) : null;
                        if (ft || inches) form.setFieldValue('heightCm', ftInToCm(ft, inches));
                        if (lbs) form.setFieldValue('weightKg', lbsToKg(lbs));
                        form.setFieldValue('heightFt', '');
                        form.setFieldValue('heightIn', '');
                        form.setFieldValue('weightLbs', '');
                      }
                      field.handleChange(unit);
                    }}
                    className={cn(
                      'flex-1 text-center py-3 rounded-xl text-sm font-black uppercase tracking-wider text-muted-foreground transition-all',
                      field.state.value === unit && 'bg-background text-foreground shadow-sm',
                    )}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            )}
          </form.Field>

          {/* Height */}
          <form.Subscribe selector={(s) => s.values.preferredUnit}>
            {(unit) => (
              <div className="space-y-3">
                <SectionLabel>Height</SectionLabel>
                {unit === 'metric' ? (
                  <form.Field name="heightCm">
                    {(field) => (
                      <>
                        <div className="relative">
                          <input
                            type="number"
                            min="50"
                            max="300"
                            step="0.1"
                            placeholder="180"
                            className={cn(numberInputCls, 'pr-20')}
                            value={field.state.value as string | number}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase pointer-events-none">
                            cm
                          </span>
                        </div>
                        <FieldError errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <form.Field name="heightFt">
                      {(field) => (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="9"
                            placeholder="5"
                            className={cn(numberInputCls, 'pr-16')}
                            value={field.state.value as string | number}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase pointer-events-none">
                            ft
                          </span>
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="heightIn">
                      {(field) => (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="11"
                            step="0.1"
                            placeholder="10"
                            className={cn(numberInputCls, 'pr-16')}
                            value={field.state.value as string | number}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase pointer-events-none">
                            in
                          </span>
                        </div>
                      )}
                    </form.Field>
                  </div>
                )}
              </div>
            )}
          </form.Subscribe>

          {/* Weight */}
          <form.Subscribe selector={(s) => s.values.preferredUnit}>
            {(unit) => (
              <div className="space-y-3">
                <SectionLabel>Current Weight</SectionLabel>
                {unit === 'metric' ? (
                  <form.Field name="weightKg">
                    {(field) => (
                      <>
                        <div className="relative">
                          <input
                            type="number"
                            min="10"
                            max="500"
                            step="0.1"
                            placeholder="75.5"
                            className={cn(numberInputCls, 'pr-20')}
                            value={field.state.value as string | number}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase pointer-events-none">
                            kg
                          </span>
                        </div>
                        <FieldError errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                ) : (
                  <form.Field name="weightLbs">
                    {(field) => (
                      <>
                        <div className="relative">
                          <input
                            type="number"
                            min="22"
                            max="1100"
                            step="0.1"
                            placeholder="165.3"
                            className={cn(numberInputCls, 'pr-20')}
                            value={field.state.value as string | number}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase pointer-events-none">
                            lbs
                          </span>
                        </div>
                        <FieldError errors={field.state.meta.errors} />
                      </>
                    )}
                  </form.Field>
                )}
              </div>
            )}
          </form.Subscribe>
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div className="pt-12 pb-4 border-t border-border/20 flex flex-col items-center gap-4">
        {saveStatus === 'success' && (
          <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Profile updated successfully.
          </p>
        )}
        {saveStatus === 'error' && (
          <p className="text-sm font-semibold text-destructive">Failed to save. Please try again.</p>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full max-w-sm rounded-2xl py-6 text-lg font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          {mutation.isPending ? 'Saving…' : 'Update Profile'}
        </Button>
      </div>
    </form>
  );
}
