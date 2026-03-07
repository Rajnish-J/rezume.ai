"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/src/app/components/ui/sidebar"
import { Separator } from "@/src/app/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/src/app/components/ui/breadcrumb"
import * as t from "@/src/app/components/ui/animated-theme-toggler"

export const AppHeader = () => {
    const pathname = usePathname()

    const getBreadcrumb = () => {
        switch (pathname) {
            case "/dashboard":
                return (
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                )
            case "/resume":
                return (
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="#">Resume</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Builder</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                )
            case "/career":
                return (
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="#">Career</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Planning</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                )
            default:
                return null
        }
    }

    return (
        <header className="flex h-16 shrink-0 items-center justify-between px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <Breadcrumb>{getBreadcrumb()}</Breadcrumb>
            </div>
            <t.AnimatedThemeToggler />
        </header>
    )
}