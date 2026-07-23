import { useState, useEffect } from "react"
// @ts-ignore
import "./Catalog.scss"

const BACKEND_URL = "http://localhost:5000"

interface ClothingData {
    id:number,
    title:string,
    description:string,
    categoryId:number,
    price:number,
    image:string,

    category:{
        id:number,
        groupId:number,
        name:string,
        icon:string
    }
}

export default function Catalog() {
    const [clothing, setClothing] = useState<ClothingData[]>([]) // Stores The Clothing
    const [loading, setLoading] = useState<boolean>(true) // Checks If Is Loading
    const [error, setError] = useState<string|null>(null) // Stores The Error

    useEffect(() => {
        // Gets The Clothing
        fetch(`${BACKEND_URL}/api/clothing`)
        .then((response) => {
            if(!response.ok) {
                throw new Error("Pri načítaní položiek došlo k chybe.") // Sets The Error
            }

            return response.json() // Gets The Data
        })
        .then((data:ClothingData[]) => {
            setClothing(data) // Sets The Clothing
            setLoading(false) // Sets The State As Loaded
        })
        .catch((error:Error) => {
            setLoading(false) // Sets The State As Loaded
            setError(error.message) // Sets The Error
            console.error(error) // Shows The Error
        })
    }, [])

    if(loading) return <p>Načítavam...</p>
    if(error) return <p>Pri načítaní položiek došlo k chybe.</p>
    if(clothing.length === 0) return <p>Nenašli sa žiadne položky.</p>

    return (
        <div className="catalog">
            <div className="all_products">
                {clothing.map((one_clothing) => (
                    <article className="one_product" key={one_clothing.id}>
                        <div className="rating">
                            <span className="amount">0</span>
                            <i className="fa-solid fa-star"></i> {/* https://fontawesome.com/icons/star */}
                            <span className="average">0</span>
                        </div>

                        <img src={`http://localhost:5000${one_clothing.image}`} alt={one_clothing.title} />

                        <p className="title">{one_clothing.title}</p>
                        <p className="description">{one_clothing.description}</p>

                        <div className="bottom">
                            <p className="price">{one_clothing.price}<span>€</span></p>
                            <button className="add_to_cart" title="Pridať do košíka" aria-label="Pridať do košíka"><i className="fa-solid fa-basket-shopping"></i> Pridať</button> {/* https://fontawesome.com/icons/basket-shopping */}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}