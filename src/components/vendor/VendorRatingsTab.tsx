import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { StarRating } from "./StarRating";

interface Rating {
  id: string;
  quality: number;
  price_score: number;
  delivery: number;
  communication: number;
  comment: string | null;
  created_at: string;
}

export function VendorRatingsTab() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("partner_ratings")
      .select("id,quality,price_score,delivery,communication,comment,created_at")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRatings((data as Rating[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ratings.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
          {lang === "ar" ? "لم تستلم أي تقييمات بعد." : "You haven't received any ratings yet."}
        </CardContent>
      </Card>
    );
  }

  const Row = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <StarRating value={value} size="sm" />
    </div>
  );

  return (
    <div className="space-y-3">
      {ratings.map((r) => {
        const avg = (r.quality + r.price_score + r.delivery + r.communication) / 4;
        return (
          <Card key={r.id} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {avg.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground"> / 5</span>
                  </div>
                  <StarRating value={avg} size="sm" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-KW" : "en-GB")}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                <Row label={lang === "ar" ? "الجودة" : "Quality"} value={r.quality} />
                <Row label={lang === "ar" ? "السعر" : "Price"} value={r.price_score} />
                <Row label={lang === "ar" ? "التسليم" : "Delivery"} value={r.delivery} />
                <Row label={lang === "ar" ? "التواصل" : "Communication"} value={r.communication} />
              </div>
              {r.comment && (
                <div className="mt-3 text-sm bg-secondary/40 rounded p-3 text-foreground/80">
                  {r.comment}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
