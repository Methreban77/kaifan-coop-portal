import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  to: string;
  accent?: "primary" | "accent" | "success";
}

const accents = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent-foreground",
  success: "bg-success/10 text-success",
};

export function PortalCard({
  icon: Icon, title, description, bullets, ctaLabel, to, accent = "primary",
}: Props) {
  return (
    <Card className="group flex flex-col h-full border-border/60 shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5">
      <CardContent className="p-6 flex flex-col h-full">
        <div className={`h-12 w-12 rounded-lg ${accents[accent]} flex items-center justify-center mb-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <ul className="space-y-1.5 text-sm text-foreground/80 mb-6 flex-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to={to}>
            {ctaLabel}
            <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
