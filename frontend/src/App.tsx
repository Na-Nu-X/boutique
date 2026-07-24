// @ts-ignore
import "./App.css"
import { useState, useEffect } from "react"
import NavigationBar from "./components/NavigationBar.tsx"
import Banner from "./components/Banner.jsx"
import Catalog from "./components/Catalog.tsx"

export interface CartItem {
  id:number,
  quantity:number
}

export default function App() {
  // Gets The Cart Items From The Local Storage
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart") // Gets The Cart From The Local Storage
    return saved ? (JSON.parse(saved) as CartItem[]) : [] // Returns The Cart Items
  })

  // Stores The Cart To The Local Storage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart)) // Stores The Cart
  }, [cart])

  // Function For Add The Item To The Cart
  const addToCart = (id:number) => {
    // Gets The Cart Items
    setCart((previous_cart:CartItem[]) => {
      const existing:CartItem|undefined = previous_cart.find((one_item) => one_item.id === id) // Gets The Already Existing Item In Cart (If Is Any) 

      // If The Item Is In Cart
      if(existing) {
        return previous_cart.map((one_item) =>
          one_item.id === id ? { ...one_item, quantity: one_item.quantity + 1 } : one_item // Increases The Quantity
        )
      }

      return [...previous_cart, { id: id, quantity: 1 }] // Adds The New Item
    })
  }

  return (
    <div>
      <NavigationBar cart={cart} setCart={setCart} />
      <Banner />
      <Catalog addToCart={addToCart} />
    </div>
  )
}