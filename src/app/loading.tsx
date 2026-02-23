import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="p-4 bg-primary/10 rounded-full animate-pulse border border-primary/20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground font-medium animate-pulse text-sm uppercase tracking-widest text-sharp">
                Đang tải dữ liệu...
            </p>
        </div>
    );
}
