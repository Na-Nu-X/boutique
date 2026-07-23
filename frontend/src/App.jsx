import { useState, useEffect } from "react"
import "./App.css"
import NavigationBar from "./components/NavigationBar"
import Banner from "./components/Banner"
import Catalog from "./components/Catalog.tsx"

function App() {
  return (
    <div>
      <NavigationBar />
      <Banner />
      <Catalog />
    </div>
  )
}

export default App