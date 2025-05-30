import React from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from "@/components/ui/toaster"

function Layout() {
  return (
    <>
    <Outlet/>
    <Toaster />
    </>
  )
}

export default Layout