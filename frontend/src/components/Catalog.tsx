// @ts-ignore
import "./Catalog.scss"
import { useState, useEffect } from "react"

export interface ClothingResponse {
    success:boolean,
    message:string,
    clothing?:Clothing[]
}

export interface Clothing {
    id:number,
    title:string,
    description:string,
    category_id?:number,
    price:number,
    image:string,
    average_rating?:number,
    rating_amount?:number,
    modifier_groups?:modifierGroup[],

    selected_modifiers?:Record<
        number, 
        
        {
            id:number,
            title:string,
            extra_price:number
        }[]
    >
}

interface modifierGroup {
    id:number,
    title:string,
    is_multiple_choice:boolean,
    is_required:boolean,

    items:{
        id:number,
        title:string,
        extra_price:number
    }[]
}

interface CatalogProps {
    addToCart:(id:number, selected_modifiers?:Record<
        number, 
        
        {
          id:number,
          title:string,
          extra_price:number
        }[]
    >|undefined) => void
}

const BACKEND_URL = "http://localhost:5000" // Defines The Back-End URL

export default function Catalog({ addToCart }:CatalogProps) {
    const [clothing, setClothing] = useState<Clothing[]>([]) // Stores The Clothing
    const [loading, setLoading] = useState<boolean>(true) // Checks If Is Loading
    const [error, setError] = useState<string|null>(null) // Stores The Error

    useEffect(() => {
        // Gets The Clothing
        fetch(`${BACKEND_URL}/api/clothing`)
        .then((response:Response) => {
            if(!response.ok) throw new Error("Pri načítaní položiek došlo k chybe.") // Sets The Error
            return response.json() // Gets The Data
        })
        .then((clothing_response:ClothingResponse) => {
            if(clothing_response.success && clothing_response.clothing) {
                setClothing(clothing_response.clothing) // Sets The Clothing
                setLoading(false) // Sets The State As Loaded
            }

            else {
                setLoading(false) // Sets The State As Loaded
                setError(clothing_response.message) // Sets The Error
                console.error(clothing_response.message) // Shows The Error
            }
        })
        .catch((error:Error) => {
            setLoading(false) // Sets The State As Loaded
            setError("Pri načítaní položiek došlo k chybe.") // Sets The Error
            console.error(error) // Shows The Error
        })
    }, [])

    if(loading) return <p>Načítavam...</p>
    if(error) return <p>{error}</p>
    if(clothing.length === 0) return <p>Nenašli sa žiadne položky.</p>

    // Function For Create The Copy Of Current Modifiers
    const getSafeModifiers = (clothing:Clothing) => {
        return clothing.selected_modifiers ? { ...clothing.selected_modifiers } : {}
    }

    // Function For Select The Modifier With A Radio Button
    const SelectModifierRadio = (
        clothing_id:number,
        group:modifierGroup, 
        item: { id: number, title: string, extra_price: number }
    ) => {
        setClothing((previous_clothing) => previous_clothing.map((one_clothing) => {
            if(one_clothing.id !== clothing_id) return one_clothing

            const updated_modifiers = getSafeModifiers(one_clothing) // Gets The Updated Modifiers

            updated_modifiers[group.id] = [item]
            return { ...one_clothing, selected_modifiers: updated_modifiers }
        }))
    }

    // Function For Toggle The Modifier With A Checkbox Button
    const ToggleModifierCheckbox = (
        clothing_id:number,
        group:modifierGroup, 
        item: { id: number, title: string, extra_price: number }, 
        event:React.ChangeEvent<HTMLInputElement>
    ) => {
        const is_checked:boolean = event.target.checked // Stores The Information If The Checkbox Is Checked

        setClothing((previous_clothing) => previous_clothing.map((one_clothing) => {
            if(one_clothing.id !== clothing_id) return one_clothing

            const updated_modifiers = getSafeModifiers(one_clothing) // Gets The Updated Modifiers
            const current_group_selection = updated_modifiers[group.id] || [] // Gets The Current Group Selection

            if(is_checked) updated_modifiers[group.id] = [...current_group_selection, item] // Adds The New Modifier
            else updated_modifiers[group.id] = current_group_selection.filter((i) => i.id !== item.id) // Removes The New Modifier

            return { ...one_clothing, selected_modifiers: updated_modifiers }
        }))
    }

    return (
        <div className="catalog">
            <div className="all_products">
                {clothing.map((one_clothing) => (
                    <article className="one_product" key={one_clothing.id}>
                        <div className="rating">
                            <span className="amount">{one_clothing.rating_amount || 0}</span>
                            <i className="fa-solid fa-star"></i> {/* https://fontawesome.com/icons/star */}
                            <span className="average">{one_clothing.average_rating || 0}</span>
                        </div>

                        <img src={`http://localhost:5000${one_clothing.image}`} alt={one_clothing.title} />

                        <p className="title">{one_clothing.title}</p>
                        <p className="description">{one_clothing.description}</p>

                        {one_clothing.modifier_groups && (
                            one_clothing.modifier_groups.map((one_modifier_group) => (
                                <div className="modifier_group" key={one_modifier_group.id}>
                                    <p>
                                        { one_modifier_group.title }

                                        {one_modifier_group.is_required && (
                                            <span className="required">*</span>
                                        )}
                                    </p>
                            
                                    {one_modifier_group.items.map((one_item) => (
                                        <label className="modifier_item" key={one_item.id}>
                                            {one_modifier_group.is_multiple_choice && (
                                                <input 
                                                    type="checkbox" 
                                                    name={`clothing_${one_clothing.id}_group_${one_modifier_group.id}`}
                                                    value={one_item.id}
                                                    onChange={(event:React.ChangeEvent<HTMLInputElement>) => ToggleModifierCheckbox(one_clothing.id, one_modifier_group, one_item, event)}
                                                />
                                            )}

                                            {!one_modifier_group.is_multiple_choice && (
                                                <input 
                                                    type="radio" 
                                                    name={`clothing_${one_clothing.id}_group_${one_modifier_group.id}`}
                                                    value={one_item.id}
                                                    onChange={() => SelectModifierRadio(one_clothing.id, one_modifier_group, one_item)}
                                                />
                                            )}
                                
                                            <span>{ one_item.title }</span>

                                            {one_item.extra_price > 0 && (
                                                <p className="price">{(one_item.extra_price / 100).toFixed(2).replace(".", ",")}<span>€</span></p>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            ))
                        )}

                        <div className="bottom">
                            <p className="price">{(one_clothing.price / 100).toFixed(2).replace(".", ",")}<span>€</span></p>
                            <button 
                                className="add_to_cart" 
                                title="Pridať do košíka" 
                                aria-label="Pridať do košíka"
                                onClick={() => addToCart(one_clothing.id, one_clothing.selected_modifiers)}
                            >
                                <i className="fa-solid fa-basket-shopping"></i> Pridať {/* https://fontawesome.com/icons/basket-shopping */}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}