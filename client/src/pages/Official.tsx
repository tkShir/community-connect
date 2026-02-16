import { useState } from "react";
import { useOfficialContent, useUpdateOfficialContent } from "@/hooks/use-official";
import { useMyProfile } from "@/hooks/use-profiles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Megaphone, ExternalLink, Mail, Pencil, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

type EditingField = "announcements" | "line_group_link" | "contact_info" | null;

export default function Official() {
  useLocale();
  const { data: content, isLoading } = useOfficialContent();
  const { data: profile } = useMyProfile();
  const { mutate: updateContent, isPending: isSaving } = useUpdateOfficialContent();
  const { toast } = useToast();

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState("");

  const isAdmin = profile?.isAdmin === true;

  const getContentValue = (key: string): string => {
    const item = content?.find((c) => c.key === key);
    return item?.value || "";
  };

  const startEdit = (field: EditingField) => {
    if (!field) return;
    setEditValue(getContentValue(field));
    setEditingField(field);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = () => {
    if (!editingField) return;
    updateContent(
      { key: editingField, value: editValue },
      {
        onSuccess: () => {
          toast({ title: t("official.save_success") });
          setEditingField(null);
          setEditValue("");
        },
        onError: () => {
          toast({
            title: t("official.save_failed"),
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[120px] w-full rounded-2xl" />
      </div>
    );
  }

  const announcements = getContentValue("announcements");
  const lineGroupLink = getContentValue("line_group_link");
  const contactInfo = getContentValue("contact_info");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-display font-bold text-foreground">
          {t("official.title")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("official.subtitle")}
        </p>
      </header>

      {/* Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{t("official.announcements")}</h2>
              </div>
              {isAdmin && editingField !== "announcements" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit("announcements")}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  {t("official.edit")}
                </Button>
              )}
            </div>

            {editingField === "announcements" ? (
              <div className="space-y-3">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={t("official.announcements_placeholder")}
                  rows={6}
                  className="resize-y"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
                    <X className="w-4 h-4 mr-1" />
                    {t("official.cancel")}
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-1" />
                    {isSaving ? t("official.saving") : t("official.save")}
                  </Button>
                </div>
              </div>
            ) : announcements ? (
              <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {announcements}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("official.no_announcements")}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* LINE Group */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">{t("official.line_group")}</h2>
              </div>
              {isAdmin && editingField !== "line_group_link" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit("line_group_link")}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  {t("official.edit")}
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {t("official.line_group_description")}
            </p>

            {editingField === "line_group_link" ? (
              <div className="space-y-3">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={t("official.line_group_placeholder")}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
                    <X className="w-4 h-4 mr-1" />
                    {t("official.cancel")}
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-1" />
                    {isSaving ? t("official.saving") : t("official.save")}
                  </Button>
                </div>
              </div>
            ) : lineGroupLink ? (
              <a
                href={lineGroupLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t("official.join_line_group")}
                </Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("official.line_link_not_set")}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">{t("official.contact")}</h2>
              </div>
              {isAdmin && editingField !== "contact_info" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit("contact_info")}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  {t("official.edit")}
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {t("official.contact_description")}
            </p>

            {editingField === "contact_info" ? (
              <div className="space-y-3">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={t("official.contact_placeholder")}
                  rows={3}
                  className="resize-y"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
                    <X className="w-4 h-4 mr-1" />
                    {t("official.cancel")}
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-1" />
                    {isSaving ? t("official.saving") : t("official.save")}
                  </Button>
                </div>
              </div>
            ) : contactInfo ? (
              <div className="whitespace-pre-wrap text-sm text-foreground bg-secondary/50 rounded-lg p-4">
                {contactInfo}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("official.no_contact")}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
