// @ts-ignore
import "./NavigationBar.scss"
import { useState, Dispatch, SetStateAction, useRef, useEffect } from "react"
import { CartItem } from "../App.tsx"

import type { ClothingResponse, Clothing } from "./Catalog.tsx"

interface StatusResponse {
  success:boolean,
  message:string,
  is_open?:boolean,
  status?:string,
  reason?:string
  open_till?:string,
  next_open?:string
}

export interface CartProductDetail extends Clothing {
  quantity:number,
  active_image?:number
}

interface Customer {
  first_name:string,
  last_name:string,
  address:string,
  city:string,
  phone_number:string,
  message:string|null
}

interface ValidateCouponResponse {
  success:string,
  message:string,
  code?:string,
  discount_percent?:number
}

interface NavigationBarProps {
  cart:CartItem[]
  setCart:Dispatch<SetStateAction<CartItem[]>>
}

const BACKEND_URL = "http://localhost:5000" // Defines The Back-End URL

export default function NavigationBar({ cart, setCart }:NavigationBarProps) {
  const [is_open, setIsOpen] = useState<boolean>(false) // Stores The Information If Is Open

  useEffect(() => {
    const getStatus = async () => {
      try {
        // Gets The Response
        const response:Response = await fetch(`${BACKEND_URL}/api/get-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: ""
        })

        const status_response:StatusResponse = await response.json() // Gets The Status Response

        if(status_response && status_response.success && status_response.status) setIsOpen(status_response.is_open || false) // Sets The Information If Is Open
        else console.error(status_response.message) // Shows The Error Message
      }
      
      catch(error) {
        console.error(error) // Shows The Error
      }
    }

    getStatus()
  }, [])

  const [is_cart_open, setIsCartOpen] = useState<boolean>(false) // Checks If The Cart Is Open
  const [cart_items, setCartItems] = useState<CartProductDetail[]>([]) // Stores The Cart Items
  const [loading, setLoading] = useState<boolean>(true) // Checks If Is Loading
  const [current_index, setCurrentIndex] = useState<number>(0) // Stores The Current Index Of Active Item In Cart
  const [coupon_code, setCouponCode] = useState<string>("") // Stores The Entered Coupon Code
  const [applied_coupon, setAppliedCoupon] = useState<string|null>(null) // Stores The Applied Coupon Code
  const [applied_discount, setAppliedDiscount] = useState<number>(0) // Stores The Applied Discount
  const [coupon_message, setCouponMessage] = useState<string>("") // Stores The Coupon Message
  const [selected_tip, setSelectedTip] = useState<number>(10) // Stores The Selected Tip Percentage (10% By Default)

  // Gets The Customer's Delivery Data
  const [customer, setCustomer] = useState<Customer>(() => {
    const saved:string|null = localStorage.getItem("customer") || null // Gets The Customer From The Local Storage

    // Returns The Customer
    return saved 
      ? (JSON.parse(saved) as Customer) 
      : {
        first_name: "",
        last_name: "",
        address: "",
        city: "",
        phone_number: "",
        message: null
      }
  })

  // Function For Handle The Customer Delivery Input Change
  const handleInputChange = (event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const { name, value } = event.target // Gets The Name And Value Of Input

    setCustomer((previous_customer) => ({
      ...previous_customer, // Copies All Other Customer's Data
      [name]: value, // Updates The Changed Value
    }))
  }

  const total_cart_items:number = cart.reduce((sum, item) => sum + item.quantity, 0) // Gets The Total Amount Of The Cart Items
  const cart_modal_ref:React.RefObject<HTMLDialogElement|null> = useRef<HTMLDialogElement>(null) // Gets The Cart Modal Ref

  useEffect(() => {
    const cart_modal:HTMLDialogElement|null = cart_modal_ref.current // Gets The Cart Modal

    if(!cart_modal) return

    if(is_cart_open) cart_modal.showModal() // Shows The Cart Modal
    else cart_modal.close() // Closes The Cart Modal
  }, [is_cart_open])

  // Function For Scroll To The Selected Element
  const scrollTo = (selector:string) => {
    const element:HTMLElement|null = document.querySelector(selector) as HTMLElement || null // Gets The Element

    if(element) {
      let offset:number = 60 // Stores The Offset
      
      if(element.classList.contains("all_products")) offset = 65 // Sets The Offset (Navigation Bar)
      if(element.classList.contains("contact_form")) offset = 65 + 20 // Sets The Offset (Navigation Bar + Padding)

      const element_position:number = element.getBoundingClientRect().top + window.scrollY // Gets The Element's Position

      window.scrollTo({ top: element_position - offset, behavior: "smooth" }) // Starts The Scroll Animation
    }
  }

  // Function For Save The Customer's Delivery Data To The Local Storage
  const saveCustomerToStorage = () => {
    localStorage.setItem("customer", JSON.stringify(customer)) // Saves The Customer Data To The Local Storage
  }

  // Function For Toggle Show / Hide The Cart
  const toggleShowCart = () => {
    const next_state = !is_cart_open // Gets The Next State (Opened / Closed)
    setIsCartOpen(next_state) // Shows / Closes The Cart
    if(next_state && cart.length > 0) getCartItems() // Gets The Cart Items
  }

  // Function For Get The Cart Items
  const getCartItems = async () => {
    setLoading(true) // Sets The State As Not Loaded

    try {
      const ids:number[] = cart.map((item) => item.id) // Gets The Cart Item IDs

      // Gets The Cart Items
      const response:Response = await fetch(`${BACKEND_URL}/api/cart-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      const clothing_response:ClothingResponse = await response.json() // Gets The Clothing

      if(clothing_response.success && clothing_response.clothing) {
        const cart_clothing:Clothing[] = clothing_response.clothing // Stores The Clothing From Cart
    
        const cart_items:CartProductDetail[] = cart.map((cart_item:CartItem) => {
          const product = cart_clothing.find((c) => c.id === cart_item.id) // Gets The Product
  
          return {
            ...(product || {}), // Data From API
            ...cart_item, // Local Data (Quantity, Selected Modifiers)
          } as CartProductDetail
        })
    
        setCartItems(cart_items) // Sets The Cart Items
      }

      else {
        console.error(clothing_response.message) // Shows The Error
      }
    }
    
    catch(error) {
      console.error(error) // Shows The Error
    }
    
    finally {
      setLoading(false) // Sets The State As Loaded
    }
  }

  // Function For Change The Cart Item
  const changeCartItem = (index:number) => {
    setCurrentIndex(index) // Changes The Current Index Of The Active Item
  }

  // Function For Remove The Item From Cart
  const removeFromCart = (id: number) => {
    const new_cart_items:CartProductDetail[] = cart_items
      .map((one_item:CartProductDetail) => {
        if(one_item.id === id) return { ...one_item, quantity: one_item.quantity - 1 } // Returns The Item And Decreases The Quantity
        return one_item // Returns The Item
      })
      .filter((one_item:CartProductDetail) => one_item.quantity > 0) // Removes The Item Which Quantity Drops To 0

    setCartItems(new_cart_items) // Stores The Cart Items

    setCart((previous_cart) =>
      previous_cart
        .map((one_item) => {
          if(one_item.id === id) return { ...one_item, quantity: one_item.quantity - 1 }
          return one_item
        })
        .filter((one_item) => one_item.quantity > 0)
    )

    if(current_index >= new_cart_items.length) setCurrentIndex(Math.max(0, new_cart_items.length - 1)) // Sets The Current Index Of The Active Item
  }

  // Method For Validate The Applied Coupon
  const validateCoupon = async () => {
    if(!coupon_code) return // Do Nothing If The Coupon Wasn't Entered

    try {
      // Validates The Coupon
      const response:Response = await fetch(`${BACKEND_URL}/api/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon_code: coupon_code.toUpperCase() }),
      })

      const validate_coupon_response:ValidateCouponResponse = await response.json() // Gets The Response Data

      if(validate_coupon_response && validate_coupon_response.success && validate_coupon_response.code && validate_coupon_response.discount_percent) {
        setAppliedCoupon(validate_coupon_response.code) // Sets The Applied Coupon Code
        setAppliedDiscount(validate_coupon_response.discount_percent) // Sets The Applied Discount
        setCouponMessage(`Kupón ${validate_coupon_response.code} (${validate_coupon_response.discount_percent}%) bol uplatnený!`) // Sets The Coupon Message
      }

      else {
        setAppliedCoupon(null) // Removes The Applied Coupon Code
        setAppliedDiscount(0) // Removes The Applied Discount
        setCouponMessage(validate_coupon_response.message) // Sets The Coupon Message
      }
    }
    
    catch(error) {
      console.error(error) // Shows The Error
      setCouponMessage("Pri overovaní kupónu došlo k chybe.") // Sets The Coupon Message
    }
  }

  // Method For Remove The Coupon
  const removeCoupon = () => {
    setCouponCode("") // Removes The Coupon Code
    setAppliedCoupon(null) // Removes The Applied Coupon Code
    setAppliedDiscount(0) // Removes The Applied Discount
    setCouponMessage("") // Removes The Coupon Message
  }

  // Function For Change The Tip Amount
  const changeTipAmount = (value:number) => {
    setSelectedTip(value) // Sets The Selected Tip
  }

  const total_price:number = cart_items.reduce((sum, one_item) => sum + (one_item.price * (one_item.quantity || 1)), 0) // Gets The Total Price In Cents (Subtotal Without Discount)
  const discount_multiplier:number = (!applied_discount || applied_discount <= 0) ? 1.0 : (100 - applied_discount) / 100 // Gets The Discount Multiplier (10% = 0.9)

  // Gets The Price After Discount In Cents
  const discounted_total_price:number = cart_items.reduce((sum:number, one_item:CartProductDetail) => {
    const quantity:number = one_item.quantity || 1
    const discounted_unit:number = Math.round(one_item.price * discount_multiplier)
    return sum + (discounted_unit * quantity)
  }, 0)

  const discount_amount:number = total_price - discounted_total_price // Gets The Discount Amount
  const tip_amount:number = selected_tip <= 0 ? 0 : Math.round(discounted_total_price * (selected_tip / 100)) // Gets The Tip Amount In Cents
  const grand_total_price:number = discounted_total_price + tip_amount // Gets The Grand Total Price (Price Of Items - Discount + Tip)
  const price_after_discount:number = discounted_total_price // Gets The Total Price After Discount Without The Tip (For Cash On Delivery)

  // Function For Pay All Items In Cart
  const payAll = async () => {
    // If The Cart Is Empty
    if(cart_items.length === 0) {
      alert("Košík je prázdny.") // Shows The Alert
      return
    }

    // If The Customer's Delivery Details Isn't Filled
    if (
      !customer.first_name.trim() ||
      !customer.last_name.trim() ||
      !customer.address.trim() ||
      !customer.city.trim() ||
      !customer.phone_number.trim()
    ) {
      alert("Prosím, vyplňte všetky povinné kontaktné údaje pre doručenie.") // Shows The Alert
      return
    }

    saveCustomerToStorage() // Updates The Customer's Delivery Data In The Local Storage

    try {
      // Creates The Checkout Session
      const response:Response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(
          { 
            cart_items,
            tip_amount,
            selected_tip,
            customer,
            applied_coupon
          }
        )
      })

      const data = await response.json() // Gets The Response Data

      if(data && data.success && data.url) {
        window.location.href = data.url // Redirects To The Responded URL
      }

      else {
        console.error(data.message) // Shows The Error Message
      }
    }
    
    catch(error) {
      console.error(error) // Shows The Error
      alert("Pri spracovávaní platby došlo k chybe.") // Shows The Alert
    }
  }

  // Function For Order All Items In Cart (Pay With Cash On Delivery)
  const orderAll = async () => {
    // If The Cart Is Empty
    if(cart_items.length === 0) {
      alert("Košík je prázdny.") // Shows The Alert
      return
    }

    // If The Customer's Delivery Details Isn't Filled
    if (
      !customer.first_name.trim() ||
      !customer.last_name.trim() ||
      !customer.address.trim() ||
      !customer.city.trim() ||
      !customer.phone_number.trim()
    ) {
      alert("Prosím, vyplňte všetky povinné kontaktné údaje pre doručenie.") // Shows The Alert
      return
    }

    saveCustomerToStorage() // Updates The Customer's Delivery Data In The Local Storage

    try {
      // Creates The Checkout Session
      const response:Response = await fetch(`${BACKEND_URL}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(
          { 
            cart_items,
            customer,
            applied_coupon
          }
        ),
      })

      const data = await response.json() // Gets The Response Data

      if(data && data.success && data.url) {
        window.location.href = data.url // Redirects To The Responded URL
      }

      else {
        console.error(data.message) // Shows The Error Message
      }
    }
    
    catch(error) {
      console.error(error) // Shows The Error
      alert("Pri spracovávaní objednávky došlo k chybe.") // Shows The Alert
    }
  }

  // Function For Calculate The Cart Item Price (Item + Extra Price For The Modifier)
  const calculateItemPrice = (item:CartProductDetail) => {
    let base_price:number = item.price || 0 // Stores The Item Base Price
    let modifiers_extra_price:number = 0 // Stores The Extra Price Of The Modifiers

    if(item.selected_modifiers) {
      Object.values(item.selected_modifiers).forEach((group_items) => {
        if(Array.isArray(group_items)) {
          group_items.forEach((mod) => {
            modifiers_extra_price += mod.extra_price || 0
          })
        }
      })
    }

    return (base_price + modifiers_extra_price) * (item.quantity || 1)
  }

  // Function For Change The Clothing Image
  const changeClothingImage = (cart_item_index:number, image_index:number) => {
    setCartItems((previous_cart_items) =>
      previous_cart_items.map((one_cart_item:CartProductDetail, index:number) =>
        index === cart_item_index 
          ? { ...one_cart_item, active_image: image_index }
          : one_cart_item
      )
    )
  }
  
  return (
    <div>
      <nav className="navigation_bar">
        <h2 className="logo" onClick={() => window.location.reload()}>Butik</h2>
        
        <ul className="links">
          <li>
            <a href="/" aria-label="Domov">Domov</a>
          </li>
  
          <li onClick={() => scrollTo(".all_products")}>Produkty</li>
          <li onClick={() => scrollTo('.contact_form')}>Kontakt</li>
        </ul>
  
        <div className="cart">
          <p className="amount">{total_cart_items || 0}</p>
  
          <button className="show_cart" title="Zobraziť košík" aria-label="Zobraziť košík" onClick={toggleShowCart}>
            <i className="fa-solid fa-basket-shopping"></i> {/* https://fontawesome.com/icons/basket-shopping */}
          </button>
        </div>
      </nav>
      
      <dialog ref={cart_modal_ref} className="cart_modal">
        <div className="cart_modal_container" >
          <div className="top">
              <h2>Môj košík</h2>

              <button className="close" title="Zavrieť" aria-label="Zavrieť" onClick={toggleShowCart}>
                  <i className="fa-solid fa-xmark"></i> {/* https://fontawesome.com/icons/xmark */}
              </button>
          </div>

          <div className="middle">
            {cart.length === 0 && <p className="empty_message">Košík je prázdny.</p>}
            
            {!loading && cart.length > 0 && (
              <div 
                className="all_items" 
                style={{ transform: `translateX(calc(${-current_index * 100}% + ${current_index * 20}px))` }}
              >
                {cart_items.map((one_item:CartProductDetail, index:number) => (
                  <div className="one_item" key={index} onClick={() => changeCartItem(index)}>
                    <div className="images_container">
                      <div 
                        className="images" 
                        style={{ transform: `translateX(-${(one_item.active_image || 0) * 100}%)` }}
                      >
                        {one_item.images.map((one_image) => (
                          <img 
                            key={one_image.id} 
                            className="one_image" 
                            src={`http://localhost:5000${one_image.url}`} 
                            alt={one_image.alt_text} 
                          />
                        ))}
                      </div>

                      {one_item.images.length > 1 && (
                        <div className="bars">
                          {one_item.images.map((one_bar, image_index:number) => (
                            <div 
                              key={one_bar.id} 
                              className={`one_bar ${one_item.active_image === image_index ? "active" : ""}`} 
                              onClick={() => changeClothingImage(index, image_index)}
                            ></div>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="title">{ one_item.title }</p>

                    {one_item.selected_modifiers && 
                      Object.values(one_item.selected_modifiers).flat().map((one_selected_modifier) => (
                        one_selected_modifier.extra_price > 0 && (
                          <p className="modifier" key={one_selected_modifier.id}>
                            {one_selected_modifier.title} +{(one_selected_modifier.extra_price / 100).toFixed(2).replace(".", ",")}€
                          </p>
                        )
                      ))
                    }

                    <div className="bottom">
                      <p className="price">{(calculateItemPrice(one_item) / 100).toFixed(2).replace(".", ",")}<span>€</span></p>

                      {one_item.quantity > 1 && (
                        <p className="quantity">{one_item.quantity}×</p>
                      )}

                      <button 
                        className="remove_from_cart" 
                        title="Odstrániť z košíka" 
                        aria-label="Odstrániť z košíka"
                        onClick={() => removeFromCart(one_item.id)}
                      >
                        <i className="fa-solid fa-basket-shopping"></i> Odstrániť {/* https://fontawesome.com/icons/basket-shopping */}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && cart.length > 1 && (
              <div className="bars">
                {cart_items.map((one_bar:CartProductDetail, index:number) => (
                  <div 
                    key={index} 
                    className={`one_bar ${current_index === index ? "active" : ""}`} 
                    onClick={() => changeCartItem(index)}
                  ></div>
                ))}
              </div>
            )}
          </div>

          {!loading && cart.length > 0 && (
            <div className="bottom">
              <form className="customer_form" action="">
                <div className="name_container">
                  <input 
                    type="text" 
                    name="first_name" 
                    placeholder="Meno" 
                    maxLength={20}
                    required 
                    value={customer.first_name}
                    onChange={handleInputChange}
                  />

                  <input 
                    type="text" 
                    name="last_name" 
                    placeholder="Priezvisko" 
                    maxLength={50} 
                    required 
                    value={customer.last_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="address_container">
                  <input 
                    type="text" 
                    name="address" 
                    placeholder="Adresa" 
                    maxLength={100} 
                    required 
                    value={customer.address}
                    onChange={handleInputChange}
                  />

                  <input 
                    type="text" 
                    name="city" 
                    placeholder="Mesto" 
                    maxLength={50} 
                    required 
                    value={customer.city}
                    onChange={handleInputChange}
                  />
                </div>
            
                <input 
                  type="tel" 
                  name="phone_number" 
                  placeholder="Telefón" 
                  maxLength={50} 
                  required 
                  value={customer.phone_number}
                  onChange={handleInputChange}
                />

                <textarea 
                  name="message" 
                  placeholder="Správa..." 
                  rows={5}
                  maxLength={100}
                  value={customer.message || ""}
                  onChange={handleInputChange}
                >
                </textarea>
              </form>

              <div className="coupon_container">
                <input 
                  type="text" 
                  name="coupon_code" 
                  placeholder="Zľavový kupón" 
                  maxLength={50} 
                  disabled={applied_coupon ? true : false}
                  value={coupon_code}
                  onChange={(event:React.ChangeEvent<HTMLInputElement>) => setCouponCode(event.target.value)}
                />
              
                {!applied_coupon && (
                  <button 
                    className="validate_coupon" 
                    title="Overiť kupón" 
                    aria-label="Overiť kupón" 
                    disabled={!coupon_code.trim() ? true : false}
                    onClick={validateCoupon}
                  >
                    Overiť
                  </button>
                )}
                
                {applied_coupon && (
                  <button 
                    className="remove_coupon" 
                    title="Odstrániť kupón" 
                    aria-label="Odstrániť kupón" 
                    onClick={removeCoupon}
                  >
                    Zrušiť
                  </button>
                )}
              </div>

              {coupon_message && (
                <p className={`coupon_message ${applied_coupon ? "success" : "error"}`}>
                  {coupon_message}
                </p>
              )}

              <div className="tip_container">
                <input 
                  className="tip_slider" 
                  type="range" 
                  step="5" 
                  min="0" 
                  max="20" 
                  onChange={(event) => changeTipAmount(Number(event.target.value))}
                />

                <p className="tip_amount">{selected_tip}%</p>
              </div>

              <div className="buttons">
                <button 
                  className={`checkout ${!is_open ? "disabled" : ""}`}
                  title="Pokračovať k platbe" 
                  aria-label="Pokračovať k platbe"
                  disabled={!is_open ? true : false}
                  onClick={payAll}
                >
                  Zaplatiť <p className="total_price">{(grand_total_price / 100).toFixed(2).replace(".", ",")}<span>€</span></p>
                </button>

                <button 
                  className={`cash_on_delivery ${!is_open ? "disabled" : ""}`}
                  title="Zaplatiť na dobierku" 
                  aria-label="Zaplatiť na dobierku"
                  disabled={!is_open ? true : false}
                  onClick={orderAll}
                >
                    Na dobierku <p className="total_price">{(price_after_discount / 100).toFixed(2).replace(".", ",")}<span>€</span></p>
                </button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </div>
  )
}