// @ts-ignore
import "./Order.scss"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"

interface OrderStatusResponse {
    success:boolean,
    message:string,
    order_details:OrderDetails
}

interface OrderDetails {
    id:number,
    tracking_code:string,
    first_name:string,
    last_name:string,
    address:string,
    city:string,
    phone_number:string,
    message?:string,
    price:number,
    total_price:number,
    status:"PENDING"|"PAID"|"PREPARING"|"DELIVERING"|"COMPLETED"|"CANCELLED",
    stripe_intent_id:string,
    cash_on_delivery:boolean,
    creation_time:string
}

interface OrderedItemsResponse {
    success:boolean,
    message:string,
    ordered_items:OrderedItem[]
}

interface OrderedItem {
    id:number,
    title:string,
    description:string,
    price:number,
    quantity:number,

    images:{
        id:number,
        url:string,
        alt_text:string
    }[],

    selected_rating?:number,
    hovered_rating?:number
}

const BACKEND_URL = "http://localhost:5000" // Defines The Back-End URL

export default function Order() {
    const { tracking_code } = useParams() // Gets The Tracking Code

    const [order_details, setOrderDetails] = useState<OrderDetails|null>(null) // Stores The Order Details
    const [ordered_items, setOrderedItems] = useState<(OrderedItem)[]|null>(null) // Stores The Ordered Items
    const [current_index, setCurrentIndex] = useState<number>(0) // Stores The Current Index Of The Active Item
    const [loading, setLoading] = useState<boolean>(true) // Checks If Is Loading
    const [error, setError] = useState<string|null>(null) // Stores The Error

    useEffect(() => {
        // Gets The Order Status
        fetch(`${BACKEND_URL}/api/order-status/${tracking_code}`)
        .then((response:Response) => {
            if(!response.ok) throw new Error("Pri hľadaní objednávky došlo k chybe.") // Sets The Error
            return response.json() // Gets The Data
        })
        .then((order_status_response:OrderStatusResponse) => {
            if(order_status_response.success && order_status_response.order_details) {
                setOrderDetails(order_status_response.order_details) // Sets The Clothing
                getOrderedItems(order_status_response.order_details.id) // Gets All Ordered And Delivered Items
                setLoading(false) // Sets The State As Loaded
            }

            else {
                setLoading(false) // Sets The State As Loaded
                setError(order_status_response.message) // Sets The Error
                console.error(order_status_response.message) // Shows The Error
            }
        })
        .catch((error:Error) => {
            setLoading(false) // Sets The State As Loaded
            setError("Pri načítaní položiek došlo k chybe.") // Sets The Error
            console.error(error) // Shows The Error
        })
    }, [])

    // if(loading) return <p>Načítavam...</p>
    // if(error) return <p>{error}</p>
    // if(clothing.length === 0) return <p>Nenašli sa žiadne položky.</p>

    // Function For Get All Ordered And Delivered Items
    const getOrderedItems = async (order_id:number) => {
        try {
            // Gets The Ordered Items
            const response:Response = await fetch(`${BACKEND_URL}/api/ordered-items/${order_id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: ""
            })
    
            const ordered_items_response:OrderedItemsResponse = await response.json() // Gets The Ordered Items Response
    
            if(ordered_items_response && ordered_items_response.success && ordered_items_response.ordered_items) {
                setOrderedItems(ordered_items_response.ordered_items) // Sets The Ordered Items
            }

            else {
                console.error(ordered_items_response.message) // Shows The Error
            }
        }
          
        catch(error) {
            console.error(error) // Shows The Error
            alert("Pri načítavaní položiek došlo k chybe.") // Shows The Alert
        }
    }

    // Function For Change The Cart Item
    const changeCartItem = (id:number) => {
        if(ordered_items) {
            const item_index:number = ordered_items.findIndex((one_item) => one_item.id === id) // Gets The Index Of The Cart Item
            if(item_index !== -1) setCurrentIndex(item_index) // Changes The Current Index Of The Active Item
        }
    }

    // Helper Function To Update State Of The Ordered Items
    const updateOrderedItemState = (id:number, key:string, value:number) => {
        setOrderedItems((previous_ordered_items) => {
            if(!previous_ordered_items) return null
    
            return previous_ordered_items.map((one_item) => {
                if(one_item.id === id) return { ...one_item, [key]: value }
                return one_item
            })
        })
    }

    // Function For Update The Hovered Rating
    const updateHoveredRating = (item:OrderedItem, rating:number) => {
        updateOrderedItemState(item.id, "hovered_rating", rating) // Updates The Hovered Rating
    }

    // Function For Remove The Hovered Rating
    const removeHoveredRating = (item:OrderedItem) => {
        updateOrderedItemState(item.id, "hovered_rating", 0) // Removes The Hovered Rating
    }

    // Function For Set The Selected Rating
    const setRating = (item:OrderedItem, star:number) => {
        updateOrderedItemState(item.id, "selected_rating", star) // Sets The Selected Rating
    }

    // Function For Send The Rating
    const sendRating = async () => {
        if(!ordered_items || !tracking_code) return

        // Gets All Ratings
        const all_ratings:{
            clothing_id:number,
            rating:number
        }[] = ordered_items
            .filter((one_item:OrderedItem) => (one_item as any).selected_rating && (one_item as any).selected_rating > 0)
            .map((one_item:OrderedItem) => ({
                clothing_id: one_item.id,
                rating: (one_item as any).selected_rating
            }))

        if(all_ratings.length === 0) {
            alert("Pred odoslaním ohodnoť aspoň jednu položku.") // Shows The Alert
            return
        }

        try {
            // Saves The Copy Of All Ratings
            const all_ratings_to_send = {
                tracking_code: tracking_code,
                all_ratings: all_ratings
            }

            // Sends The Rating
            const response:Response = await fetch(`${BACKEND_URL}/api/send-rating`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(all_ratings_to_send)
            })
    
            const send_rating_response = await response.json() // Gets The Send Rating Response
    
            if(send_rating_response && send_rating_response.success) {
                alert("Ďakujeme za tvoje hodnotenie!") // Shows The Alert
            }

            else {
                console.error(send_rating_response.message) // Shows The Error Message
            }
        }
          
        catch(error) {
            console.error(error) // Shows The Error
            alert("Pri odosielaní hodnotenia došlo k chybe.") // Shows The Alert
        }
    }

    return (
        <div className="order_container">
            {order_details && (
                <div className="order">
                    <div className="icon">
                        <i className={`fa-solid ${order_details.status !== "CANCELLED" ? "fa-check" : "fa-xmark"}`}></i> {/* https://fontawesome.com/icons/check / https://fontawesome.com/icons/xmark */}
                    </div>

                    <h1>Objednávka #{order_details.tracking_code}</h1>

                    {order_details.status === "PENDING" && (<h2 className="subheading">Čaká sa na platbu!</h2>)}
                    {order_details.status === "PAID" && (<h2 className="subheading">Platba prebehla úspešne!</h2>)}
                    {order_details.status === "PREPARING" && (<h2 className="subheading">Objednávku pripravujeme!</h2>)}
                    {order_details.status === "DELIVERING" && (<h2 className="subheading">Objednávka je na ceste!</h2>)}
                    {order_details.status === "COMPLETED" && (<h2 className="subheading">Objednávka bola doručená!</h2>)}
                    {order_details.status === "CANCELLED" && (<h2 className="subheading" style={{ color: "#df3535" }}>Objednávka bola zrušená!</h2>)}

                    {order_details.status !== "COMPLETED" && order_details.status !== "CANCELLED" && (
                        <p className="message">Ďakujeme { order_details.first_name } za tvoju objednávku. Objednávka bude doručená na { order_details.address }, { order_details.city }.</p>
                    )}

                    {order_details.cash_on_delivery && order_details.status !== "COMPLETED" && (
                        <p 
                            className="total_price"

                            style={{ 
                                textDecoration: order_details.status === "CANCELLED" ? "line-through" : "none" 
                            }}
                        >
                            Dobierka je {(order_details.total_price / 100).toFixed(2).replace(".", ",")}<span>€</span>
                        </p>
                    )}

                    <div className="middle">
                        {order_details.status === "COMPLETED" && (<h2>Ako ste spokojný?</h2>)}

                        {order_details.status === "COMPLETED" && ordered_items && ordered_items.length > 0 && (
                            <div 
                                className="all_items"
                                style={{ transform: `translateX(calc(${-current_index * 100}% + ${current_index * 20}px))` }}
                            >
                                {ordered_items.map((one_item:OrderedItem, index:number) => (
                                    <div className="one_item" key={one_item.id || index} onClick={() => changeCartItem(one_item.id)}>
                                        <img src={`http://localhost:5000${one_item.images[0].url}`} alt={one_item.title} />
                        
                                        <p className="title">{ one_item.title }</p>

                                        <div className="bottom">
                                            <p className="price">{(one_item.price / 100).toFixed(2).replace(".", ",")}<span>€</span></p>

                                            {order_details.status === "COMPLETED" && ordered_items && ordered_items.length > 0 && (
                                                <div className="rating">
                                                    {[1, 2, 3, 4, 5].map((one_star) => (
                                                        <button 
                                                            type="button" 
                                                            key={one_star}
                                                            onMouseEnter={() => updateHoveredRating(one_item, one_star)}
                                                            onMouseLeave={() => removeHoveredRating(one_item)}
                                                            onClick={() => setRating(one_item, one_star)}
                                                        >
                                                            {/* https://fontawesome.com/icons/star */}
                                                            <i 
                                                                className={
                                                                    `
                                                                        fa-solid fa-star 
                                                                        ${one_star <= (one_item.hovered_rating || one_item.selected_rating || 0) ? "full" : ""}
                                                                        ${one_star > (one_item.hovered_rating || one_item.selected_rating || 0) ? "empty" : ""}
                                                                    `
                                                                }
                                                            ></i>
                                                        </button>
                                                    ))}
                                                
                                                    <input type="hidden" name="rating" maxLength={1} value={one_item.selected_rating || 0} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {order_details.status === "COMPLETED" && ordered_items && ordered_items.length > 1 && (
                            <div className="bars">
                                {ordered_items.map((one_item:OrderedItem, index:number) => (
                                    <div 
                                        className={`one_bar ${current_index === index ? "active" : ""}`} 
                                        key={one_item.id || index}
                                        onClick={() => changeCartItem(one_item.id)}
                                    ></div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="buttons">
                        {order_details.status === "COMPLETED" && (
                            <button 
                                className="send_rating" 
                                title="Odoslať hodnotenie" 
                                aria-label="Odoslať hodnotenie"
                                onClick={sendRating}
                            >
                                Odoslať
                            </button>
                        )}

                        <a href="/" className="back" title="Späť domov" aria-label="Späť domov">Späť</a>
                    </div>
                </div>
            )}

            {!order_details && (
                <div className="not_found_order">
                    <h1>Objednávku sa nepodarilo nájsť.</h1>
                    <button className="try_again" onClick={() => window.location.reload()}>Skúsiť znovu</button>
                </div>
            )}
        </div>
    )
}