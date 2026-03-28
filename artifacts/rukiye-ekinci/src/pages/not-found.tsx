import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Shell>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-6">Sayfa Bulunamadı</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Aradığınız sayfa silinmiş, taşınmış veya hiç var olmamış olabilir.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full">
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </Shell>
  );
}
