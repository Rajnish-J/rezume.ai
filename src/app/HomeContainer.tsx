"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export const HomeContainer = () => {
    const router = useRouter()

    useEffect(() => {
        router.push("/dashboard")
    }, [router])

    return null
}