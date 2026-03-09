"use client"

import * as t from "@/src/components/ui/animated-theme-toggler"

export const AppHeader = () => {
    return (
        <header className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-semibold">Rezume.ai</h1>
            <t.AnimatedThemeToggler />
        </header>
    )
}