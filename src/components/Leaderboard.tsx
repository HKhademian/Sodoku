import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLeaderboard, LeaderboardEntry } from "@/lib/storage";
import { useEffect, useState } from "react";

export function Leaderboard() {
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        setScores(getLeaderboard());
    }, []);

    return (
        <Card className="w-full max-w-md mt-8">
            <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="local" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="local">Local</TabsTrigger>
                        <TabsTrigger value="cloud" disabled>Cloud (Coming Soon)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="local">
                        <div className="space-y-2">
                            {scores.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No scores yet.</p>
                            ) : (
                                scores.map((entry, i) => (
                                    <div key={i} className="flex justify-between items-center border-b last:border-0 pb-2">
                                        <div className="flex gap-2">
                                            <span className="font-bold w-6">{i + 1}.</span>
                                            <span>{entry.name || "Anonymous"}</span>
                                        </div>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span>{entry.difficulty}</span>
                                            <span>{entry.score}s</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="cloud">
                        <div className="text-center py-4 text-muted-foreground">
                            Cloud leaderboard requires sign-in.
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
