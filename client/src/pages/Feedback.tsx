import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateFeedback } from "@/hooks/use-feedback";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";

export default function Feedback() {
  useLocale();
  const { toast } = useToast();
  const { mutate: createFeedback, isPending } = useCreateFeedback();

  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !message.trim()) {
      toast({
        title: t("feedback.error"),
        description: t("feedback.fill_required"),
        variant: "destructive",
      });
      return;
    }

    createFeedback(
      {
        category: category as "board" | "software" | "other",
        message: message.trim(),
        name: name.trim() || null,
        email: email.trim() || null,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setCategory("");
          setMessage("");
          setName("");
          setEmail("");
        },
        onError: () => {
          toast({
            title: t("feedback.error"),
            description: t("feedback.submit_failed"),
            variant: "destructive",
          });
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-primary" />
            {t("feedback.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("feedback.subtitle")}
          </p>
        </header>

        <Card className="bg-card border-white/10 max-w-2xl">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-display font-bold mb-2">
              {t("feedback.thank_you")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("feedback.thank_you_message")}
            </p>
            <Button onClick={() => setSubmitted(false)}>
              {t("feedback.send_another")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
          <MessageSquare className="w-10 h-10 text-primary" />
          {t("feedback.title")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("feedback.subtitle")}
        </p>
      </header>

      <Card className="bg-card border-white/10 max-w-2xl">
        <CardHeader>
          <CardTitle>{t("feedback.form_title")}</CardTitle>
          <CardDescription>
            {t("feedback.form_description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">
                {t("feedback.category_label")} <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background border-white/10">
                  <SelectValue placeholder={t("feedback.category_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board">{t("feedback.category_board")}</SelectItem>
                  <SelectItem value="software">{t("feedback.category_software")}</SelectItem>
                  <SelectItem value="other">{t("feedback.category_other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                {t("feedback.message_label")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("feedback.message_placeholder")}
                className="bg-background border-white/10 min-h-[150px]"
                required
              />
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                {t("feedback.contact_note")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("feedback.name_label")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("feedback.name_placeholder")}
                    className="bg-background border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("feedback.email_label")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("feedback.email_placeholder")}
                    className="bg-background border-white/10"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isPending || !category || !message.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isPending ? t("feedback.submitting") : t("feedback.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
