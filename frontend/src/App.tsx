// @ts-ignore
import "./App.css"
import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import NavigationBar from "./components/NavigationBar.tsx"
import Banner from "./components/Banner.jsx"
import Catalog from "./components/Catalog.tsx"
import ContactForm from "./components/ContactForm.tsx"
import Footer from "./components/Footer.tsx"
import SuccessPayment from "./components/SuccessPayment.tsx"
import SuccessOrder from "./components/SuccessOrder.tsx"
import Order from "./components/Order.tsx"

export interface CartItem {
  id:number,
  quantity:number,

  selected_modifiers?:Record<
    number,
    
    {
      id:number,
      title:string,
      extra_price:number
    }[]
  >
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
    if(cart.length === 0) localStorage.removeItem("cart") // Removes The Cart
    else localStorage.setItem("cart", JSON.stringify(cart)) // Stores The Cart
  }, [cart])

  // Function For Add The Item To The Cart
  const addToCart = (
    id:number, 

    selected_modifiers:Record<
      number, 
    
      {
        id:number,
        title:string,
        extra_price:number
      }[]
    >|undefined = {}
  ) => {
    setCart((previous_cart:CartItem[]) => {
      const existing_cart_item:CartItem|undefined = previous_cart.find((one_item) => one_item.id === id && JSON.stringify(one_item.selected_modifiers) === JSON.stringify(selected_modifiers)) // Checks If There Is Already The Same Item (Same ID, Same Modifiers) In The Cart

      // Increases The Quantity Of An Existing Item
      if(existing_cart_item) {
        return previous_cart.map((one_item) =>
          one_item === existing_cart_item 
            ? { ...one_item, quantity: one_item.quantity + 1 } 
            : one_item
        )
      }

      // Adds The New Item To The Cart
      return [
        ...previous_cart,

        {
          id: id,
          quantity: 1,
          selected_modifiers: selected_modifiers
        }
      ]
    })
  }

  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={
              <div>
                <NavigationBar cart={cart} setCart={setCart} />
                <Banner />
                <Catalog addToCart={addToCart} />
                <ContactForm />
                <Footer />
              </div>
            } />
            
            <Route path="/platba-uspesna" element={
              <div>
                <NavigationBar cart={cart} setCart={setCart} />
                <SuccessPayment setCart={setCart} />
                <Footer />
              </div>
            } />

            <Route path="/objednavka-uspesna" element={
              <div>
                <NavigationBar cart={cart} setCart={setCart} />
                <SuccessOrder setCart={setCart} />
                <Footer />
              </div>
            } />

            <Route path="/objednavka/:tracking_code" element={
              <div>
                <NavigationBar cart={cart} setCart={setCart} />
                <Order />
                <Footer />
              </div>
            } />
        </Routes>
    </BrowserRouter>
  )
}