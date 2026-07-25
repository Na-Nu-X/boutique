// @ts-ignore
import "./Order.scss"
import { useState, useEffect } from "react"

import type { CartProductDetail } from "./NavigationBar"

interface OrderDetails {
    id:number,
    tracking_code:string,
    first_name:string,
    last_name:string,
    address:string,
    city:string,
    phone_number:string,
    total_price:number,
    status:"PENDING"|"PAID"|"PREPARING"|"DELIVERING"|"COMPLETED"|"CANCELLED"
    cash_on_delivery:boolean,
    creation_time:string
}

const BACKEND_URL = "http://localhost:5000" // Defines The Back-End URL

export default function Order() {
    const query_params:URLSearchParams = new URLSearchParams(window.location.search) // Gets The Query Params
    const tracking_code:string|null = query_params.get("tracking_code") || null // Gets The Tracking Code

    const [order_details, setOrderDetails] = useState<OrderDetails|null>(null) // Stores The Order Details
    const [ordered_items, setOrderedItems] = useState<(CartProductDetail & { selected_rating?:number; hovered_rating?:number })[]|null>(null) // Stores The Ordered Items
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
        .then((order_status_response) => {
            if(order_status_response.success) {
                // setClothing(order_status_response.clothing) // Sets The Clothing
                setLoading(false) // Sets The State As Loaded

                console.log(order_status_response)
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



    return (
        <div className="order_container">
            <div className="order">
                <div className="icon">
                    <i className="fa-solid"></i> {/* https://fontawesome.com/icons/check / https://fontawesome.com/icons/xmark */}
                </div>

                <h1>Objednávka #000000</h1>

                {/* <h2 class="subheading" *ngIf="order_details.status === 'PENDING'">Čaká sa na platbu!</h2>
                <h2 className="subheading" *ngIf="order_details.status === 'PAID'">Platba prebehla úspešne!</h2>
                <h2 className="subheading" *ngIf="order_details.status === 'PREPARING'">Objednávku pripravujeme!</h2>
                <h2 className="subheading" *ngIf="order_details.status === 'DELIVERING'">Objednávka je na ceste!</h2>
                <h2 className="subheading" *ngIf="order_details.status === 'COMPLETED'">Objednávka bola doručená!</h2>
                <h2 className="subheading" *ngIf="order_details.status === 'CANCELLED'" style="color: #df3535;">Objednávka bola zrušená!</h2> */}

                <p className="message">Ďakujeme za tvoju objednávku. Naši kuchári sa už pustili do práce a tvoje jedlo bude čoskoro na ceste. Objednávka bude doručená na , .</p>

                <p className="total_price"><span>€</span></p>

                <div className="middle">
                    <h2>Ako Vám chutilo?</h2>

                    <div className="all_items">
                        <div className="one_item">
                            <img src="" title="" alt="" />
            
                            <p className="title">Title</p>

                            <div className="bottom">
                                <p className="price"><span>€</span></p>

                                <div className="rating">
                                    <button 
                                        type="button" 
                                    >
                                        <i 
                                            className="fa-solid fa-star"
                                        ></i> {/* https://fontawesome.com/icons/star */}
                                    </button>
                                
                                    <input type="hidden" name="rating" max-length="1" value="" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bars">
                        <div className="one_bar">

                        </div>
                    </div>
                </div>

                <div className="buttons">
                    <button title="Odoslať hodnotenie" aria-label="Odoslať hodnotenie">Odoslať</button>
                    <a href="/" className="back" title="Späť domov" aria-label="Späť domov">Späť</a>
                </div>
            </div>

            <div className="not_found_order">
                <h1>Objednávku sa nepodarilo nájsť.</h1>
                <button className="try_again">Skúsiť znovu</button>
            </div>
        </div>
    )
}