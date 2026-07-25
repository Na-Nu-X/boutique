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

interface CancelOrderResponse {
  success:boolean,
  message:string
}

const BACKEND_URL = "http://localhost:5000" // Defines The Back-End URL

export default function App() {
  // Gets The Cart Items From The Local Storage
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart") // Gets The Cart From The Local Storage
    return saved ? (JSON.parse(saved) as CartItem[]) : [] // Returns The Cart Items
  })

  // Checks The URL Parameters
  useEffect(() => {
    const query_params:URLSearchParams = new URLSearchParams(window.location.search) // Gets The Query Params
    const tracking_code:string|null = query_params.get("cancel_order_code") || null // Gets The Tracking Code

    if(tracking_code) {
      // Function For Cancel The Order
      const cancelOrder = async () => {
        try {
          // Gets The Response
          const response:Response = await fetch(`${BACKEND_URL}/api/cancel-order/${tracking_code}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })

          const cancel_order_response:CancelOrderResponse = await response.json() // Gets The Cancel Order Response

          if(cancel_order_response && cancel_order_response.success) alert(cancel_order_response.message) // Shows The Alert
          else console.error("Pri rušení objednávky došlo k chybe.") // Shows The Error
        }
        
        catch(error) {
          console.error(error) // Shows The Error
        }

        finally {
          const new_url:string = window.location.pathname // Creates The New URL
          window.history.replaceState(null, '', new_url) // Redirects To The New URL (Without The Refresh)
        }
      }

      cancelOrder() // Cancels The Order
    }
  }, [])

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